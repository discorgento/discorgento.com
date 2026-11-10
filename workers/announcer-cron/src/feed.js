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

const FEED_URL = 'https://discorgento.substack.com/feed';

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
 * Read the feed, or `null` when it is unreachable or carries no items. A null
 * answer is never fatal: the next cron tick retries.
 */
export async function fetchPosts() {
  try {
    const response = await fetch(FEED_URL, {
      headers: { 'user-agent': 'discorgento-announcer-cron' },
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) return null;
    const text = await response.text();
    if (!text.includes('<item>')) return null;
    return parseFeed(text);
  } catch {
    return null;
  }
}
