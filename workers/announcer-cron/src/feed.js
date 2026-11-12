// The publication's RSS feed, read by the cron Worker.
//
// src/lib/substack.ts stays the source of truth for the pages (it also decodes
// the teaser HTML for the LatestEdition island). This one is deliberately
// smaller: an announcement only needs the url, the byline and the publication
// date, so nothing here touches the teaser. The text extraction below is a copy
// of `xmlText`/`decodeXmlEntities` from src/lib/xml.ts — the Worker is bundled
// on its own, with no `~/` alias — and test/announcer-cron.test.mjs pins the
// shared fields against the site parser on the same feed, so the two cannot
// quietly disagree about which post is which.
//
// The other thing this file has to get right is telling the ways a read can
// fail apart. Substack answers 429 to this Worker's scheduled-egress in long
// bursts — the feed itself is up throughout, a plain request from anywhere else
// gets a 200 in ~80 ms — so a rate limit is not an outage and must not be
// counted as one. `readFeed` reports the reason instead of collapsing every
// failure into null, which is what let a throttle page the channel about a feed
// that was answering fine.

const FEED_URL = 'https://discorgento.substack.com/feed';
const TIMEOUT_MS = 10_000;

/**
 * Browser-shaped headers, with the announcer still identified by the
 * `compatible;` convention: Substack's bot rules treat an unknown user agent
 * from a datacenter IP as scrapable, a browser-shaped one as a reader.
 * `accept-encoding` is left to the runtime on purpose.
 */
const HEADERS = {
  'user-agent':
    'Mozilla/5.0 (compatible; DiscorgentoAnnouncer/1.0; +https://discorgento.com)',
  accept:
    'application/rss+xml, application/xml;q=0.9, text/xml;q=0.8, */*;q=0.7',
  'accept-language': 'pt-BR,pt;q=0.9,en;q=0.8',
};

/**
 * One retry is what a stalled origin needs; a throttle needs time. Waiting a
 * second and hitting a rate limiter again only doubles the request rate, so a
 * 429 asks for the `Retry-After` (or `rateLimitDelayMs` when the response
 * carries none) and the waits are capped at `maxDelayMs`, which keeps one tick
 * inside ~1 min of wall clock — the length of a typical rate-limit window, so
 * the tick can outlast it instead of burning the next one too. The status
 * endpoint reads with a single attempt (see `readFeed`), because a snapshot
 * must not sit through the backoff.
 * Exported so the tests can zero the delays instead of sleeping through them;
 * the Worker never changes it.
 */
export const RETRY = {
  attempts: 3,
  delayMs: 5_000,
  rateLimitDelayMs: 20_000,
  maxDelayMs: 30_000,
};

const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

const NAMED = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
};

/** Decode predefined entities and numeric refs in one pass (see xml.ts). */
function decodeXmlEntities(value) {
  return value.replace(
    /&(#x[0-9a-fA-F]+|#[0-9]+|amp|lt|gt|quot|apos);/g,
    (match, entity) => {
      if (entity[0] !== '#') return NAMED[entity] ?? match;
      const code =
        entity[1] === 'x'
          ? Number.parseInt(entity.slice(2), 16)
          : Number.parseInt(entity.slice(1), 10);
      return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : match;
    },
  );
}

/** CDATA is taken verbatim; everything outside it is entity-decoded. */
function xmlText(raw = '') {
  return raw
    .split(/(<!\[CDATA\[[\s\S]*?\]\]>)/)
    .map((part) =>
      part.startsWith('<![CDATA[')
        ? part.slice(9, -3)
        : decodeXmlEntities(part),
    )
    .join('')
    .trim();
}

/**
 * Parse the `<item>` entries. Posts without a title or a link are skipped, the
 * same rule the site parser applies.
 * @param {string} text
 */
export function parseFeed(text) {
  return text
    .split('<item>')
    .slice(1)
    .map((entry) => {
      const title = xmlText(entry.match(/<title>([\s\S]*?)<\/title>/)?.[1]);
      const url = xmlText(entry.match(/<link>([^<]+)<\/link>/)?.[1]);
      const published = xmlText(
        entry.match(/<pubDate>([^<]+)<\/pubDate>/)?.[1],
      );
      const creator = xmlText(
        entry.match(/<dc:creator>([\s\S]*?)<\/dc:creator>/)?.[1],
      );
      if (!title || !url) return null;
      return { title, url, published, creator };
    })
    .filter((post) => post !== null);
}

/**
 * `Retry-After` in milliseconds: seconds or an HTTP date, `null` when absent or
 * unreadable.
 * @param {Headers} headers
 */
function retryAfterMs(headers) {
  const raw = headers.get('retry-after');
  if (!raw) return null;
  const seconds = Number(raw);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);
  const at = Date.parse(raw);
  return Number.isNaN(at) ? null : Math.max(0, at - Date.now());
}

/** How long to wait before the next attempt, honouring a `Retry-After`. */
function delayFor(attempt, waitMs) {
  if (waitMs !== null) return Math.min(waitMs, RETRY.maxDelayMs);
  return RETRY.delayMs * attempt;
}

/**
 * @typedef {object} Post
 * @property {string} title
 * @property {string} url
 * @property {string} published
 * @property {string} creator
 */

/**
 * @typedef {{ok: true, posts: Post[]}
 *   | {ok: false, reason: 'rate-limited', status: number}
 *   | {ok: false, reason: 'unavailable', error: string}} FeedResult
 */

/**
 * Read the feed. Never throws — the reason is part of the answer, so the tick
 * can stay quiet about a rate limit and only raise the alarm about a feed that
 * is genuinely unreachable.
 * @param {{attempts?: number}} [options] `attempts: 1` for a snapshot (the
 *   status endpoint), which must answer instead of sitting through the backoff.
 * @returns {Promise<FeedResult>}
 */
export async function readFeed({ attempts = RETRY.attempts } = {}) {
  /** @type {FeedResult} */
  let outcome = { ok: false, reason: 'unavailable', error: 'no attempt made' };

  for (let attempt = 1; attempt <= attempts; attempt++) {
    let waitMs = null;

    try {
      const response = await fetch(FEED_URL, {
        headers: HEADERS,
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });

      if (response.status === 429) {
        waitMs = retryAfterMs(response.headers) ?? RETRY.rateLimitDelayMs;
        outcome = { ok: false, reason: 'rate-limited', status: 429 };
        console.warn(
          `[announcer] feed throttled (429), attempt ${attempt}/${attempts}`,
        );
        if (attempt < attempts) await sleep(delayFor(attempt, waitMs));
        continue;
      }

      if (!response.ok) throw new Error(`feed answered ${response.status}`);
      const text = await response.text();
      if (!text.includes('<item>')) throw new Error('feed carried no items');
      return { ok: true, posts: parseFeed(text) };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      outcome = { ok: false, reason: 'unavailable', error: message };
      console.warn(
        `[announcer] feed attempt ${attempt}/${attempts} failed:`,
        message,
      );
      if (attempt < attempts) await sleep(delayFor(attempt, null));
    }
  }

  return outcome;
}
