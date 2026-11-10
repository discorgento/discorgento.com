// The Substack → Discord announcer (workers/announcer-cron) runs on Cloudflare:
// a cron trigger reads the public feed and posts through the Discord webhook.
// Everything below is exercised with a stubbed `fetch` and a fake STATE
// namespace, so the tests pin the two things that would fail silently in
// production: announcing the same post twice, and announcing nothing at all
// while the invocation still reports success.

import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { parseSubstackFeed } from '~/lib/substack';
import {
  buildAnnouncement,
  discordMessage,
  selectNewPosts,
} from '../workers/announcer-cron/src/announce.js';
import { parseFeed } from '../workers/announcer-cron/src/feed.js';
import worker from '../workers/announcer-cron/src/index.js';

const FEED_URL = 'https://discorgento.substack.com/feed';
const WEBHOOK = 'https://discord.com/api/webhooks/1/token';

// The same fixture test/feeds.test.mjs pins the site parser against.
const SUBSTACK_FEED = `<rss><channel>
  <title>discorgento</title>
  <item>
    <title><![CDATA[IA no dia a dia: o que vale (& o que não)]]></title>
    <description><![CDATA[Subt&#237;tulo do post]]></description>
    <link>https://discorgento.substack.com/p/ia</link>
    <pubDate>Mon, 21 Sep 2026 12:00:00 GMT</pubDate>
    <dc:creator><![CDATA[jonatanaxe]]></dc:creator>
    <enclosure url="https://substackcdn.com/image/fetch/cover.png" length="0" type="image/jpeg"/>
  </item>
  <item>
    <title>Escaped &amp; plain</title>
    <description>Estamos t&#227;o ocupados</description>
    <link>https://discorgento.substack.com/p/plain</link>
    <pubDate>Mon, 14 Sep 2026 12:00:00 GMT</pubDate>
  </item>
  <item>
    <title>no link, skipped</title>
  </item>
</channel></rss>`;

const POSTS = [
  {
    title: 'Newest',
    url: 'https://discorgento.substack.com/p/newest',
    published: 'Mon, 09 Nov 2026 12:00:00 GMT',
    creator: 'jonatanaxe',
  },
  {
    title: 'Middle',
    url: 'https://discorgento.substack.com/p/middle',
    published: 'Mon, 02 Nov 2026 12:00:00 GMT',
    creator: 'jonatanaxe',
  },
  {
    title: 'Oldest',
    url: 'https://discorgento.substack.com/p/oldest',
    published: 'Mon, 26 Oct 2026 12:00:00 GMT',
    creator: '',
  },
];

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
});

/**
 * A stand-in for the Durable Object namespace: one in-memory state shared by
 * every `get()` for the same name, like the real object.
 */
function fakeState() {
  const storage = new Map();
  const object = {
    read: async () => storage.get('announced') ?? null,
    write: async (state) => {
      storage.set('announced', state);
    },
  };
  return {
    storage,
    namespace: {
      idFromName: (name) => name,
      get: () => object,
    },
  };
}

/**
 * Stub `fetch`: answers the feed with `feed` (or throws when `feed` is null)
 * and the webhook with `webhookStatus`.
 */
function stubFetch({ feed = SUBSTACK_FEED, webhookStatus = 204 } = {}) {
  const calls = [];
  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url, init });
    if (String(url) === FEED_URL) {
      if (feed === null) throw new Error('network down');
      return new Response(feed, { status: 200 });
    }
    return webhookStatus === 204
      ? new Response(null, { status: 204 })
      : new Response('{"message":"refused"}', { status: webhookStatus });
  };
  return {
    calls,
    webhookCalls: () => calls.filter((call) => String(call.url) === WEBHOOK),
  };
}

// --- the feed ------------------------------------------------------------

test('parseFeed agrees with the site parser on the shared fields', () => {
  const mine = parseFeed(SUBSTACK_FEED);
  const site = parseSubstackFeed(SUBSTACK_FEED);

  assert.equal(mine.length, site.length);
  assert.deepEqual(
    mine.map(({ title, url, published, creator }) => ({
      title,
      url,
      published,
      creator,
    })),
    site.map(({ title, url, published, creator }) => ({
      title,
      url,
      published,
      creator,
    })),
  );
  // The CDATA/entity handling is the part that would drift.
  assert.equal(mine[0]?.title, 'IA no dia a dia: o que vale (& o que não)');
  assert.equal(mine[1]?.title, 'Escaped & plain');
  assert.equal(mine[1]?.creator, '');
});

test('parseFeed returns nothing for a feed without items', () => {
  assert.deepEqual(parseFeed('<rss><channel></channel></rss>'), []);
});

// --- which posts are new -------------------------------------------------

test('selectNewPosts bootstraps with the newest post only', () => {
  // A missing state must never dump the whole archive into the channel.
  assert.deepEqual(
    selectNewPosts(POSTS, null).map((post) => post.url),
    [POSTS[0].url],
  );
});

test('selectNewPosts returns everything above the announced post, oldest first', () => {
  const fresh = selectNewPosts(POSTS, {
    announced: POSTS[1].url,
    announcedAt: '2026-11-02T12:05:00.000Z',
  });
  assert.deepEqual(
    fresh.map((post) => post.url),
    [POSTS[0].url],
  );
});

test('selectNewPosts announces nothing when the newest is already announced', () => {
  assert.deepEqual(
    selectNewPosts(POSTS, {
      announced: POSTS[0].url,
      announcedAt: '2026-11-09T12:05:00.000Z',
    }),
    [],
  );
});

test('selectNewPosts falls back to the clock when the post fell off the feed', () => {
  // The feed window rolled past the announced post, so the url is not there —
  // publish dates are the only remaining signal.
  const fresh = selectNewPosts(POSTS, {
    announced: 'https://discorgento.substack.com/p/gone',
    announcedAt: '2026-11-01T00:00:00.000Z',
  });
  assert.deepEqual(
    fresh.map((post) => post.url),
    [POSTS[1].url, POSTS[0].url],
  );
});

// --- the message ---------------------------------------------------------

test('buildAnnouncement is deterministic and carries the link and the byline', () => {
  const first = buildAnnouncement(POSTS[0]);
  assert.equal(first, buildAnnouncement(POSTS[0]));
  assert.ok(first.includes(POSTS[0].url));
  assert.ok(first.includes('@jonatanaxe'));
  assert.ok(first.startsWith('@everyone'));
  // A missing byline still credits the team instead of an empty "@".
  assert.ok(buildAnnouncement(POSTS[2]).includes('time Discorgento'));
});

test('discordMessage is the channel payload, not an embed', () => {
  const message = discordMessage(POSTS[0]);
  assert.equal(message.username, 'Discorgento');
  assert.ok(message.avatar_url.startsWith('https://'));
  assert.deepEqual(message.allowed_mentions, { parse: ['everyone'] });
  assert.equal(message.content, buildAnnouncement(POSTS[0]));
  // The bare link is what lets Discord unfurl Substack's own OG card.
  assert.equal(message.embeds, undefined);
});

// --- the Worker ----------------------------------------------------------

function env(webhook = WEBHOOK) {
  const state = fakeState();
  return {
    state,
    env: { DISCORD_WEBHOOK_URL: webhook, STATE: state.namespace },
  };
}

test('scheduled announces the newest post and records it', async () => {
  const { calls } = stubFetch();
  const { state, env: bindings } = env();
  const newest = parseFeed(SUBSTACK_FEED)[0];

  await worker.scheduled({}, bindings);

  const webhookCalls = calls.filter((call) => String(call.url) === WEBHOOK);
  assert.equal(webhookCalls.length, 1);
  assert.equal(webhookCalls[0].init.method, 'POST');
  assert.deepEqual(
    JSON.parse(webhookCalls[0].init.body),
    discordMessage(newest),
  );
  assert.equal(state.storage.get('announced').announced, newest.url);
  assert.ok(state.storage.get('announced').announcedAt);
});

test('scheduled does not announce the same post twice', async () => {
  const { calls } = stubFetch();
  const { env: bindings } = env();

  await worker.scheduled({}, bindings);
  await worker.scheduled({}, bindings);

  const webhookCalls = calls.filter((call) => String(call.url) === WEBHOOK);
  assert.equal(webhookCalls.length, 1);
});

test('scheduled stays quiet when the feed is unreachable', async () => {
  // The next tick retries; a network blip is not a failed invocation.
  const { calls } = stubFetch({ feed: null });
  const { state, env: bindings } = env();

  await worker.scheduled({}, bindings);

  assert.equal(calls.filter((call) => String(call.url) === WEBHOOK).length, 0);
  assert.equal(state.storage.size, 0);
});

test('scheduled throws when Discord refuses the message', async () => {
  stubFetch({ webhookStatus: 400 });
  const { env: bindings } = env();

  await assert.rejects(worker.scheduled({}, bindings), /400/);
});

test('scheduled throws when the webhook is not configured', async () => {
  const { calls } = stubFetch();
  const { env: bindings } = env('');

  await assert.rejects(worker.scheduled({}, bindings), /DISCORD_WEBHOOK_URL/);
  assert.equal(calls.length, 0);
});

test('fetch reports status without announcing', async () => {
  const { calls } = stubFetch();
  const { state, env: bindings } = env();
  const [newest, second] = parseFeed(SUBSTACK_FEED);
  await state.namespace.get().write({
    announced: second.url,
    announcedAt: '2026-11-02T12:05:00.000Z',
  });

  const response = await worker.fetch(
    new Request('https://cron.test/'),
    bindings,
  );

  assert.deepEqual(await response.json(), {
    lastAnnounced: second.url,
    lastAnnouncedAt: '2026-11-02T12:05:00.000Z',
    feedPosts: 2,
    newest: newest.url,
  });
  assert.equal(calls.filter((call) => String(call.url) === WEBHOOK).length, 0);
});
