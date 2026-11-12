// The Substack → Discord announcer, run entirely on Cloudflare.
//
// Why it lives here and not in GitHub Actions: GitHub's `schedule` dispatcher
// has no SLA (delays are documented, queued runs can be dropped) and in this
// org it was measured 6–10 hours behind the nominal minute, with zero runs for
// a fresh workflow. Driving it from a cron Worker needed a PAT, which needed a
// secret, which needed a repo the PAT could see — three chances to fail before
// the first announcement. Here there is no credential at all: the Worker reads
// the public feed and posts through the Discord webhook, which is already a
// repo secret that CI syncs in.
//
// State (the last announced post, plus the feed's health) lives in a Durable
// Object: it survives redeploys, needs no namespace to be created by hand, and
// is what keeps a post from being announced twice.
//
// The one failure mode that used to be silent: the feed answering 4xx/5xx for
// days. The tick "succeeded" with nothing to announce, so nobody found out
// until the next edition never appeared. After ALERT_AFTER_FAILURES consecutive
// misses (~6 h) the Worker says so in the channel, once per outage, and resets
// the counter as soon as the feed answers again.
//
// The failure mode that made that alert useless: Substack throttling this
// Worker's scheduled-egress with 429 while the feed stayed up. A rate limit is
// not an outage — it is one tick that did not get through, retried ten minutes
// later — so it is logged and never counted, and cannot page anyone.

import { DurableObject } from 'cloudflare:workers';
import { discordAlert, discordMessage, selectNewPosts } from './announce.js';
import { readFeed } from './feed.js';

const STATE_NAME = 'substack';
const WEBHOOK_ATTEMPTS = 3;
// 36 ticks × 10 min ≈ 6 h. One hour was short enough that a routine throttle
// turned into a page; six hours is long enough that only a feed that is really
// down reaches the channel.
const ALERT_AFTER_FAILURES = 36;

export class AnnouncerState extends DurableObject {
  /** @returns {Promise<{announced: string, announcedAt: string} | null>} */
  async read() {
    return (await this.ctx.storage.get('announced')) ?? null;
  }

  /** @param {{announced: string, announcedAt: string}} state */
  async write(state) {
    await this.ctx.storage.put('announced', state);
  }

  /** @returns {Promise<{failures: number, alertedAt: string | null}>} */
  async health() {
    return (
      (await this.ctx.storage.get('health')) ?? { failures: 0, alertedAt: null }
    );
  }

  /** @param {{failures: number, alertedAt: string | null}} health */
  async setHealth(health) {
    await this.ctx.storage.put('health', health);
  }
}

const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

/**
 * POST a payload to the channel. Same policy as the rest of the repo: a 4xx
 * other than 429 is final, everything else backs off and retries.
 * @param {string} webhook
 * @param {object} payload
 */
async function postToDiscord(webhook, payload) {
  const body = JSON.stringify(payload);

  for (let attempt = 1; attempt <= WEBHOOK_ATTEMPTS; attempt++) {
    try {
      const response = await fetch(webhook, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body,
        signal: AbortSignal.timeout(10_000),
      });
      if (response.ok) return true;
      if (response.status < 500 && response.status !== 429) {
        throw new Error(
          `webhook refused with ${response.status}: ${await response.text()}`,
        );
      }
      console.warn(
        `[announcer] webhook returned ${response.status}, attempt ${attempt}/${WEBHOOK_ATTEMPTS}`,
      );
    } catch (error) {
      // A refusal is not worth retrying; a network error is.
      if (
        error instanceof Error &&
        error.message.startsWith('webhook refused')
      ) {
        throw error;
      }
      console.warn(
        `[announcer] webhook failed on attempt ${attempt}/${WEBHOOK_ATTEMPTS}:`,
        error instanceof Error ? error.message : error,
      );
    }
    if (attempt < WEBHOOK_ATTEMPTS) await sleep(1000 * attempt);
  }

  return false;
}

/**
 * Count a feed miss and, past the threshold, say it in the channel — once per
 * outage. `alertedAt` is written only after Discord accepts the alert, so a
 * failed alert is retried on the next tick instead of being swallowed.
 * @param {Env} env
 * @param {AnnouncerState} state
 */
async function reportFeedFailure(env, state) {
  const health = await state.health();
  const failures = health.failures + 1;
  await state.setHealth({ failures, alertedAt: health.alertedAt });

  const shouldAlert = failures >= ALERT_AFTER_FAILURES && !health.alertedAt;
  if (!shouldAlert) {
    console.warn(`[announcer] feed miss ${failures}/${ALERT_AFTER_FAILURES}`);
    return;
  }

  if (!(await postToDiscord(env.DISCORD_WEBHOOK_URL, discordAlert(failures)))) {
    console.warn('[announcer] the outage alert could not be posted, retrying');
    return;
  }

  await state.setHealth({ failures, alertedAt: new Date().toISOString() });
  console.warn(`[announcer] outage alert posted after ${failures} misses`);
}

/**
 * One announcing pass. Throws only when something is genuinely wrong (no
 * webhook configured, or Discord refused) so the cron invocation shows up as
 * failed in the Worker's logs instead of going quiet.
 * @param {Env} env
 */
async function announce(env) {
  if (!env.DISCORD_WEBHOOK_URL) {
    throw new Error('DISCORD_WEBHOOK_URL is not set on the Worker');
  }

  const state = env.STATE.get(env.STATE.idFromName(STATE_NAME));
  const feed = await readFeed();

  // Throttled by Substack: the feed is up, this tick just was not allowed to
  // read it. Log it, count nothing, and let the next tick try again — paging
  // the channel here is exactly the noise this used to produce.
  if (!feed.ok) {
    if (feed.reason === 'rate-limited') {
      console.warn('[announcer] feed throttled, next tick retries');
      return;
    }
    // Unreachable: count it, maybe alert, and let the next tick retry.
    await reportFeedFailure(env, state);
    return;
  }

  // Reachable but carrying nothing announceable: the same treatment as a miss.
  if (!feed.posts.length) {
    await reportFeedFailure(env, state);
    return;
  }

  // The feed answered: clear the outage, so a later one can alert again.
  await state.setHealth({ failures: 0, alertedAt: null });

  const fresh = selectNewPosts(feed.posts, await state.read());
  if (!fresh.length) return;

  for (const post of fresh) {
    if (!(await postToDiscord(env.DISCORD_WEBHOOK_URL, discordMessage(post)))) {
      throw new Error(`giving up on ${post.url}`);
    }
    // Written after every successful post, so a mid-list failure resumes
    // instead of replaying.
    await state.write({
      announced: post.url,
      announcedAt: new Date().toISOString(),
    });
    console.log(`[announcer] announced: ${post.title}`);
  }
}

export default {
  /**
   * Cron entry point. Awaited (not handed to waitUntil) so a failure surfaces
   * as a failed invocation.
   * @param {ScheduledController} _controller
   * @param {Env} env
   */
  async scheduled(_controller, env) {
    await announce(env);
  },

  /**
   * Read-only status: what was announced last, what the feed holds now, how the
   * feed has been behaving and which build is running (so a forgotten
   * `wrangler deploy` is visible). `feedStatus` tells a throttle (`rate-limited`)
   * apart from a real outage (`unavailable`) — the cron never alerts on the
   * former, so this is where a long one is visible. It never announces, so it
   * needs no token to be safe to call.
   * @param {Request} _request
   * @param {Env} env
   */
  async fetch(_request, env) {
    const state = env.STATE.get(env.STATE.idFromName(STATE_NAME));
    const [announced, health, feed] = await Promise.all([
      state.read(),
      state.health(),
      // A snapshot: one attempt, so the backoff a real tick needs cannot turn
      // this endpoint into a 60-second call.
      readFeed({ attempts: 1 }),
    ]);
    return Response.json({
      lastAnnounced: announced?.announced ?? null,
      lastAnnouncedAt: announced?.announcedAt ?? null,
      feedStatus: feed.ok ? 'ok' : feed.reason,
      feedPosts: feed.ok ? feed.posts.length : null,
      newest: feed.ok ? (feed.posts[0]?.url ?? null) : null,
      feedFailures: health.failures,
      outageAlertedAt: health.alertedAt,
      version: env.CF_VERSION_METADATA ?? null,
    });
  },
};

/**
 * @typedef {object} Env
 * @property {string} DISCORD_WEBHOOK_URL Discord channel webhook (secret).
 * @property {DurableObjectNamespace} STATE Announcement state.
 * @property {{id: string, tag: string, timestamp: string}} [CF_VERSION_METADATA]
 *   Set by the `version_metadata` binding: which build is deployed.
 */
