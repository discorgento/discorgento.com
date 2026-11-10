#!/usr/bin/env node
// Announces new Discorgento Substack posts in the community Discord's news
// channel, through the channel webhook.
//
// The AUTOMATIC path is not this script any more: it is workers/announcer-cron,
// a Cloudflare cron Worker that reads the same feed and posts the same message
// (both import the message format from workers/announcer-cron/src/announce.js).
// This script is the manual/emergency path — useful for a local preview, and for
// announcing when the Worker is being changed:
//
//   DISCORD_WEBHOOK_URL='https://discord.com/api/webhooks/…' \
//     node --import ./scripts/tilde-alias.mjs scripts/substack-discord.mjs
//
// Its state is the Worker's: before announcing, it asks the Worker's read-only
// status endpoint what was announced last, so a manual run does not repeat what
// the cron already posted. There is no state file in git — the live state is a
// Durable Object, and this script never writes it (it cannot, and should not:
// the status endpoint is deliberately read-only). Run it deliberately, not on a
// timer, and at most once per post.
//
// The feed is read with fetchSubstackPosts (~/lib/substack) — the same code the
// site's LatestEdition island uses. When the Worker is unreachable the diff has
// no anchor, so only the newest post is announced — the bootstrap rule must not
// dump the whole feed.
//
// Exit codes: 0 when there is nothing to announce or the feed is down, 1 when
// the webhook refuses a post — that is the failure worth seeing.

import { pathToFileURL } from 'node:url';
import { fetchSubstackPosts } from '~/lib/substack';
import {
  discordMessage,
  selectNewPosts,
} from '../workers/announcer-cron/src/announce.js';

// Re-exported for previews that import this module without running it.
export { buildAnnouncement } from '../workers/announcer-cron/src/announce.js';

// The Worker's read-only status endpoint: the single source of truth for what
// has already been announced. Override it when the Worker is renamed.
const STATUS_URL =
  process.env.ANNOUNCER_STATUS_URL ??
  'https://discorgento-announcer-cron.jonatanaxe.workers.dev/';
const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

/** What the Worker announced last, or null when it cannot be reached. */
async function readState() {
  try {
    const res = await fetch(STATUS_URL, {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return null;
    const { lastAnnounced, lastAnnouncedAt } = await res.json();
    if (!lastAnnounced) return null;
    return { announced: lastAnnounced, announcedAt: lastAnnouncedAt };
  } catch {
    return null; // unreachable: fall back to the bootstrap rule
  }
}

async function postToDiscord(post) {
  const body = JSON.stringify(discordMessage(post));
  // Same policy as fetchWithRetry in ~/lib/fetch (which is GET-only): a 4xx
  // other than 429 is final, everything else backs off and retries.
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body,
        signal: AbortSignal.timeout(10_000),
      });
      if (res.ok) return true;
      if (res.status < 500 && res.status !== 429) {
        console.error(
          `[substack-discord] webhook refused with ${res.status}: ${await res.text()}`,
        );
        return false;
      }
      console.warn(
        `[substack-discord] webhook returned ${res.status}, attempt ${attempt}/3`,
      );
    } catch (err) {
      console.warn(
        `[substack-discord] webhook failed on attempt ${attempt}/3:`,
        err instanceof Error ? err.message : err,
      );
    }
    if (attempt < 3) await sleep(1000 * attempt);
  }
  return false;
}

async function main() {
  if (!WEBHOOK_URL) {
    console.error('[substack-discord] DISCORD_WEBHOOK_URL is not set');
    process.exit(1);
  }

  const posts = await fetchSubstackPosts();
  if (posts === null) {
    console.warn('[substack-discord] feed unavailable, nothing announced');
    process.exit(0);
  }
  if (posts.length === 0) {
    console.log('[substack-discord] feed carries no posts');
    process.exit(0);
  }

  const state = await readState();
  const fresh = selectNewPosts(posts, state);

  if (fresh.length === 0) {
    console.log('[substack-discord] nothing new to announce');
    process.exit(0);
  }

  for (const [i, post] of fresh.entries()) {
    if (!(await postToDiscord(post))) {
      console.error(`[substack-discord] giving up on: ${post.url}`);
      process.exit(1);
    }
    console.log(`[substack-discord] announced: ${post.title}`);
    if (i < fresh.length - 1) await sleep(1000);
  }
  // The Worker's state is untouched: it will still think the previous post was
  // the last one, so do not run this twice for the same post.
  console.log(
    '[substack-discord] done — the cron will catch up on its own state at the next tick',
  );
}

// Run only when executed directly (`node scripts/substack-discord.mjs`).
// Importing the module — e.g. to preview announcements — must not post.
const invokedDirectly =
  import.meta.url === pathToFileURL(process.argv[1] ?? '').href;
if (invokedDirectly) await main();
