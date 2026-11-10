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
// Its state file (.github/substack-discord-state.json) is its own: the Worker
// keeps the live state in a Durable Object, so this script does not know what
// has already been announced automatically. Run it deliberately, not on a timer.
//
// The feed is read with fetchSubstackPosts (~/lib/substack) — the same code the
// site's LatestEdition island uses. State is written after every successful
// post, not once at the end: if post 2 of 3 fails, the next run resumes from
// post 2 instead of re-announcing post 1. A missing state file announces only
// the newest post — the bootstrap run must not dump the whole feed.
//
// Exit codes: 0 when there is nothing to announce or the feed is down, 1 when
// the webhook refuses a post — that is the failure worth seeing.

import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { fetchSubstackPosts } from '~/lib/substack';
import {
  discordMessage,
  selectNewPosts,
} from '../workers/announcer-cron/src/announce.js';

// Re-exported for previews that import this module without running it.
export { buildAnnouncement } from '../workers/announcer-cron/src/announce.js';

const STATE_PATH = resolve(
  process.cwd(),
  '.github/substack-discord-state.json',
);
const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

async function readState() {
  try {
    return JSON.parse(await readFile(STATE_PATH, 'utf8'));
  } catch {
    return null; // absent or unreadable state: announce from scratch
  }
}

async function writeState(url) {
  const state = { announced: url, announcedAt: new Date().toISOString() };
  await writeFile(STATE_PATH, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
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
    await writeState(post.url);
    console.log(`[substack-discord] announced: ${post.title}`);
    if (i < fresh.length - 1) await sleep(1000);
  }
}

// Run only when executed directly (`node scripts/substack-discord.mjs`).
// Importing the module — e.g. to preview announcements — must not post.
const invokedDirectly =
  import.meta.url === pathToFileURL(process.argv[1] ?? '').href;
if (invokedDirectly) await main();
