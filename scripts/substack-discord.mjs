#!/usr/bin/env node
// Announces new Discorgento Substack posts in the community Discord's news
// channel, through the channel webhook. Runs hourly from
// .github/workflows/substack-discord.yml — the repo is public, so the GitHub
// Actions minutes are free and unlimited. Manual run, from the repo root:
//
//   DISCORD_WEBHOOK_URL='https://discord.com/api/webhooks/…' \
//     node --import ./scripts/tilde-alias.mjs scripts/substack-discord.mjs
//
// The feed is read with fetchSubstackPosts (~/lib/substack) — the same code
// the site's LatestEdition island uses. What has already been announced lives
// in .github/substack-discord-state.json, committed back by the workflow with
// [skip ci], so the state commit never triggers the site deploy. State is
// written after every successful post, not once at the end: if post 2 of 3
// fails, the next run resumes from post 2 instead of re-announcing post 1.
// A missing state file announces only the newest post — the bootstrap run
// must not dump the whole feed into the channel.
//
// Exit codes: 0 when there is nothing to announce or the feed is down (the
// next hourly run retries), 1 when the webhook refuses a post — that is the
// failure worth seeing in the Actions log.

import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { fetchSubstackPosts } from '~/lib/substack';

const STATE_PATH = resolve(
  process.cwd(),
  '.github/substack-discord-state.json',
);
const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
// The webhook speaks for the community: brand name and brand avatar.
const AVATAR_URL =
  'https://discorgento.com/img/logo-avatar-transparent-1024.png';

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

/** The posts left to announce, oldest first (the feed is newest-first). */
function selectNewPosts(posts, state) {
  if (!state?.announced) return posts.slice(0, 1); // bootstrap: newest only
  const index = posts.findIndex((post) => post.url === state.announced);
  if (index === -1) {
    // The announced post fell off the feed window; fall back to the clock.
    const cutoff = Date.parse(state.announcedAt ?? '') || 0;
    return posts
      .filter((post) => Date.parse(post.published) > cutoff)
      .reverse();
  }
  return posts.slice(0, index).reverse();
}

// Credit ping in the community's announcement voice (the same style as the
// episode announcements: 🎥 YouTube / 🎧 Spotify / special thanks). A plain
// "@Name" reads naturally but does not ping — a real mention needs the
// author's Discord user id as `<@id>`; add a map here when the ids are known.
const AUTHORS_DISCORD_IDS = {
  // e.g. 'jonatanaxe': '<@123456789012345678>',
};

// The three fixed lines of the announcement vary per post — same house
// format, different words every edition. Each slot is picked from a slice of
// the URL hash: deterministic, so a resumed run never flips the combo
// halfway, and the slices keep the three lines from moving in lockstep.
const HEADER_VARIANTS = [
  '@everyone Nova Edição da Newsletter Disponível! 🚀',
  '@everyone Saiu edição nova da newsletter! 🚀',
  '@everyone Tem texto novo no Substack! 🚀',
  '@everyone A newsletter chegou com tudo! 🚀',
  '@everyone Edição fresquinha no ar! 🚀',
];

const LINK_VARIANTS = [
  '📬 Leia no Substack: {url}',
  '📬 Ler agora no Substack: {url}',
  '📬 Confere a edição completa: {url}',
  '📬 A edição completa tá aqui: {url}',
  '📬 Bora ler no Substack: {url}',
];

const CREDIT_VARIANTS = [
  'Escrito por {who}! Confira agora! 👏🔥😄',
  'Escrito por {who}! Vem ler! 👏🔥😄',
  'Autoria de {who}! Bora conferir! 👏🔥😄',
  'Saiu da mente (e do teclado) de {who}! 👏🔥😄',
  'Créditos ao {who}! Vale a leitura! 👏🔥😄',
];

function hashUrl(url) {
  let hash = 5381;
  for (const ch of url) hash = ((hash << 5) + hash + ch.charCodeAt(0)) >>> 0;
  return hash;
}

/** The announcement text for a post: header, bare link, credit. */
export function buildAnnouncement(post) {
  const hash = hashUrl(post.url);
  const who = post.creator
    ? (AUTHORS_DISCORD_IDS[post.creator] ?? `@${post.creator}`)
    : 'time Discorgento';
  const header = HEADER_VARIANTS[hash % HEADER_VARIANTS.length];
  // >>> (unsigned shift): >> would go negative once the hash crosses 2^31,
  // and a negative index picks nothing.
  const link = LINK_VARIANTS[(hash >>> 6) % LINK_VARIANTS.length].replaceAll(
    '{url}',
    post.url,
  );
  const credit = CREDIT_VARIANTS[
    (hash >>> 12) % CREDIT_VARIANTS.length
  ].replaceAll('{who}', who);
  return [header, '', link, '', credit].join('\n');
}

function discordMessage(post) {
  // The channel's established announcement format — no hand-built embeds:
  // the bare link lets Discord unfurl Substack's own Open Graph card (title,
  // subtitle, cover) below the message.
  return {
    username: 'Discorgento',
    avatar_url: AVATAR_URL,
    allowed_mentions: { parse: ['everyone'] },
    content: buildAnnouncement(post),
  };
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
