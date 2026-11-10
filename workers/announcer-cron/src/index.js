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
// State (the last announced post) lives in a Durable Object: it survives
// redeploys, needs no namespace to be created by hand, and is what keeps a post
// from being announced twice.

import { DurableObject } from 'cloudflare:workers';
import { discordMessage, selectNewPosts } from './announce.js';
import { fetchPosts } from './feed.js';

const STATE_NAME = 'substack';
const WEBHOOK_ATTEMPTS = 3;

export class AnnouncerState extends DurableObject {
  /** @returns {Promise<{announced: string, announcedAt: string} | null>} */
  async read() {
    return (await this.ctx.storage.get('announced')) ?? null;
  }

  /** @param {{announced: string, announcedAt: string}} state */
  async write(state) {
    await this.ctx.storage.put('announced', state);
  }
}

const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

/**
 * POST the announcement. Same policy as the rest of the repo: a 4xx other than
 * 429 is final, everything else backs off and retries.
 * @param {string} webhook
 * @param {{title: string, url: string, creator: string}} post
 */
async function postToDiscord(webhook, post) {
  const body = JSON.stringify(discordMessage(post));

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
 * One announcing pass. Throws only when something is genuinely wrong (no
 * webhook configured, or Discord refused) so the cron invocation shows up as
 * failed in the Worker's logs instead of going quiet.
 * @param {Env} env
 */
async function announce(env) {
  if (!env.DISCORD_WEBHOOK_URL) {
    throw new Error('DISCORD_WEBHOOK_URL is not set on the Worker');
  }

  const posts = await fetchPosts();
  // Unreachable or empty feed: the next tick retries, nothing to announce.
  if (!posts?.length) return;

  const state = env.STATE.get(env.STATE.idFromName(STATE_NAME));
  const fresh = selectNewPosts(posts, await state.read());
  if (!fresh.length) return;

  for (const post of fresh) {
    if (!(await postToDiscord(env.DISCORD_WEBHOOK_URL, post))) {
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
   * Read-only status: what was announced last and what the feed holds now.
   * It never announces, so it needs no token to be safe to call.
   * @param {Request} _request
   * @param {Env} env
   */
  async fetch(_request, env) {
    const state = await env.STATE.get(env.STATE.idFromName(STATE_NAME)).read();
    const posts = await fetchPosts();
    return Response.json({
      lastAnnounced: state?.announced ?? null,
      lastAnnouncedAt: state?.announcedAt ?? null,
      feedPosts: posts?.length ?? null,
      newest: posts?.[0]?.url ?? null,
    });
  },
};

/**
 * @typedef {object} Env
 * @property {string} DISCORD_WEBHOOK_URL Discord channel webhook (secret).
 * @property {DurableObjectNamespace} STATE Announcement state.
 */
