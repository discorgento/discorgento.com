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
import {
  parseFeed,
  RETRY,
  readFeed,
} from '../workers/announcer-cron/src/feed.js';

// The retry delays exist for production; the tests should not sleep through
// them.
RETRY.delayMs = 0;
RETRY.rateLimitDelayMs = 0;

import worker, { AnnouncerState } from '../workers/announcer-cron/src/index.js';

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
 * A stand-in for the Durable Object namespace: every `get()` builds a real
 * `AnnouncerState` over the same in-memory storage, so the tests exercise the
 * Worker's own read/write methods instead of a reimplementation of them.
 */
function fakeState() {
  const storage = new Map();
  const ctx = {
    storage: {
      get: async (key) => storage.get(key),
      put: async (key, value) => void storage.set(key, value),
      delete: async (key) => storage.delete(key),
    },
  };
  return {
    storage,
    namespace: {
      idFromName: (name) => name,
      get: () => new AnnouncerState(ctx, {}),
    },
  };
}

/**
 * Stub `fetch`: answers the feed with `feed` (or throws when `feed` is null),
 * or with `feedStatus` when that is not 200 — 429 is the one that matters, since
 * it is what Substack actually answers this Worker. The webhook answers with
 * `webhookStatus`. `setFeed`/`setFeedStatus` flip the feed mid-test, for
 * outage-then-recovery.
 */
function stubFetch({
  feed = SUBSTACK_FEED,
  feedStatus = 200,
  webhookStatus = 204,
} = {}) {
  const calls = [];
  let current = feed;
  let status = feedStatus;
  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url, init });
    if (String(url) === FEED_URL) {
      if (current === null) throw new Error('network down');
      if (status === 429) {
        return new Response('rate limited', {
          status: 429,
          headers: { 'retry-after': '0' },
        });
      }
      if (status !== 200) return new Response('nope', { status });
      return new Response(current, { status: 200 });
    }
    return webhookStatus === 204
      ? new Response(null, { status: 204 })
      : new Response('{"message":"refused"}', { status: webhookStatus });
  };
  return {
    calls,
    setFeed: (value) => {
      current = value;
    },
    setFeedStatus: (value) => {
      status = value;
    },
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

test('readFeed retries a stalled attempt before giving up', async () => {
  let attempts = 0;
  globalThis.fetch = async () => {
    attempts += 1;
    // The first tick stalls; the retry gets the feed.
    if (attempts === 1) throw new Error('timeout');
    return new Response(SUBSTACK_FEED, { status: 200 });
  };

  const feed = await readFeed();

  assert.equal(attempts, 2);
  assert.equal(feed.ok, true);
  assert.equal(feed.posts?.length, 2);
});

test('readFeed reports an unreachable feed as unavailable', async () => {
  globalThis.fetch = async () => new Response('nope', { status: 503 });

  assert.deepEqual((await readFeed()).reason, 'unavailable');
});

test('readFeed reads a snapshot with a single attempt', async () => {
  // The status endpoint must answer, not sit through the backoff a real tick
  // needs: it asks for one attempt and takes the first answer.
  let attempts = 0;
  globalThis.fetch = async () => {
    attempts += 1;
    return new Response('rate limited', {
      status: 429,
      headers: { 'retry-after': '0' },
    });
  };

  const feed = await readFeed({ attempts: 1 });

  assert.equal(attempts, 1);
  assert.equal(feed.reason, 'rate-limited');
});

test('readFeed reports a 429 as rate-limited, not as an outage', async () => {
  // What Substack actually answers this Worker's scheduled egress: the feed is
  // up, the tick just was not allowed to read it. The two must not be confused,
  // or a throttle pages the channel about a feed that never went down.
  globalThis.fetch = async () =>
    new Response('rate limited', {
      status: 429,
      headers: { 'retry-after': '0' },
    });

  const feed = await readFeed();

  assert.equal(feed.ok, false);
  assert.equal(feed.reason, 'rate-limited');
  assert.equal(feed.status, 429);
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

test('selectNewPosts announces both when two posts landed between ticks', () => {
  // Two collaborators publishing before the same tick must not lose one.
  const fresh = selectNewPosts(POSTS, {
    announced: POSTS[2].url,
    announcedAt: '2026-10-26T12:05:00.000Z',
  });
  assert.deepEqual(
    fresh.map((post) => post.title),
    ['Middle', 'Newest'], // oldest first: chronological order in the channel
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
  // The byline is the plain name: "@name" would look like a mention and notify
  // nobody, so it is not written at all.
  assert.ok(first.includes('jonatanaxe'));
  assert.ok(!first.includes('@jonatanaxe'));
  assert.ok(first.startsWith('@everyone'));
  // A missing byline still credits the team instead of an empty line.
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

test('scheduled counts a feed miss without announcing', async () => {
  // The next tick retries; a network blip is not a failed invocation.
  const { calls } = stubFetch({ feed: null });
  const { state, env: bindings } = env();

  await worker.scheduled({}, bindings);

  assert.equal(calls.filter((call) => String(call.url) === WEBHOOK).length, 0);
  assert.equal(state.storage.get('health').failures, 1);
  assert.equal(state.storage.get('announced'), undefined);
});

test('a long outage is announced in the channel, once', async () => {
  const stub = stubFetch({ feed: null });
  const { env: bindings } = env();

  // 35 misses (~6 h): still silent, so only a feed that is really down reaches
  // the channel.
  for (let i = 0; i < 35; i++) await worker.scheduled({}, bindings);
  assert.equal(stub.webhookCalls().length, 0);

  // The 36th says it, and says it without pinging anyone.
  await worker.scheduled({}, bindings);
  assert.equal(stub.webhookCalls().length, 1);
  const alert = JSON.parse(stub.webhookCalls()[0].init.body);
  assert.deepEqual(alert.allowed_mentions, { parse: [] });
  assert.match(alert.content, /feed do Substack não está respondendo/);
  assert.match(alert.content, /~6 h/);

  // Ticks 37 and 38 do not repeat it.
  await worker.scheduled({}, bindings);
  await worker.scheduled({}, bindings);
  assert.equal(stub.webhookCalls().length, 1);
});

test('a rate limit never reaches the channel, however long it lasts', async () => {
  // The bug this pins: 429s counted as misses, so a one-hour throttle posted
  // "o feed do Substack não está respondendo" about a feed that was answering
  // 200 to everyone else the whole time.
  const stub = stubFetch({ feedStatus: 429 });
  const { state, env: bindings } = env();

  for (let i = 0; i < 80; i++) await worker.scheduled({}, bindings);

  assert.equal(stub.webhookCalls().length, 0);
  assert.equal(state.storage.get('health'), undefined);

  // ...and the edition that landed during the throttle goes out once the feed
  // answers again.
  stub.setFeedStatus(200);
  await worker.scheduled({}, bindings);

  assert.equal(stub.webhookCalls().length, 1);
  assert.deepEqual(state.storage.get('health'), {
    failures: 0,
    alertedAt: null,
  });
});

test('the outage counter resets when the feed answers again', async () => {
  const stub = stubFetch({ feed: null });
  const { state, env: bindings } = env();

  for (let i = 0; i < 3; i++) await worker.scheduled({}, bindings);
  assert.equal(state.storage.get('health').failures, 3);

  stub.setFeed(SUBSTACK_FEED);
  await worker.scheduled({}, bindings);
  assert.deepEqual(state.storage.get('health'), {
    failures: 0,
    alertedAt: null,
  });
  // ...and the post that landed during the outage is announced now.
  assert.equal(stub.webhookCalls().length, 1);
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
  const object = state.namespace.get();
  await object.write({
    announced: second.url,
    announcedAt: '2026-11-02T12:05:00.000Z',
  });
  await object.setHealth({ failures: 2, alertedAt: null });

  const response = await worker.fetch(new Request('https://cron.test/'), {
    ...bindings,
    CF_VERSION_METADATA: { id: 'abc', tag: '', timestamp: '2026-11-10' },
  });

  assert.deepEqual(await response.json(), {
    lastAnnounced: second.url,
    lastAnnouncedAt: '2026-11-02T12:05:00.000Z',
    feedStatus: 'ok',
    feedPosts: 2,
    newest: newest.url,
    feedFailures: 2,
    outageAlertedAt: null,
    version: { id: 'abc', tag: '', timestamp: '2026-11-10' },
  });
  assert.equal(calls.filter((call) => String(call.url) === WEBHOOK).length, 0);
});
