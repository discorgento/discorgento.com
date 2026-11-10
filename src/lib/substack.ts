// Fetches the latest posts from the discorgento Substack publication RSS feed.
// Public feed, no auth. Degrades to [] when it fails.
//
// Three callers with different clocks:
//   - the LatestEdition server island reads it at request time, so a new post shows
//     up without a redeploy. That is the point of the island.
//   - scripts/substack-discord.mjs (run hourly by the substack-discord workflow
//     in GitHub Actions) reads it to announce new posts on Discord.
//   - nothing reads it at build time any more; the page ships the island, not the
//     post, so there is no committed snapshot to keep current.
//
// Timeout, retries and edge caching live in `~/lib/fetch` (`fetchWithRetry`),
// shared with youtube.ts and discord.ts so the three cannot drift apart.

import { fetchWithRetry } from '~/lib/fetch';
import { decodeXmlEntities, xmlText } from '~/lib/xml';

const FEED_URL = 'https://discorgento.substack.com/feed';
const EDGE_TTL_S = 1_800;

export interface SubstackPost {
  title: string;
  published: string; // RFC822 pubDate, parsed by consumers via Date.parse
  url: string;
  /** Post subtitle: the feed's plain-text teaser, already entity-decoded. */
  description: string;
  /** `<dc:creator>` byline, e.g. "jonatanaxe" or "Maria Ferro". */
  creator: string;
  /** Cover image from the feed's `<enclosure>`, when it carries one. */
  image: string;
}

/** Parse the `<item>` entries of the Substack RSS feed. Pure, for tests. */
export function parseSubstackFeed(text: string): SubstackPost[] {
  return text
    .split('<item>')
    .slice(1)
    .map((entry) => {
      const title = xmlText(
        entry.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? '',
      );
      const url = xmlText(entry.match(/<link>([^<]+)<\/link>/)?.[1] ?? '');
      const published = xmlText(
        entry.match(/<pubDate>([^<]+)<\/pubDate>/)?.[1] ?? '',
      );
      // Substack double-encodes <description>: the entities sit inside the
      // CDATA section, where xmlText takes the content verbatim. Decoding the
      // extracted string turns `Intelig&#234;ncia` back into readable text.
      const description = decodeXmlEntities(
        xmlText(
          entry.match(/<description>([\s\S]*?)<\/description>/)?.[1] ?? '',
        ),
      );
      const creator = xmlText(
        entry.match(/<dc:creator>([\s\S]*?)<\/dc:creator>/)?.[1] ?? '',
      );
      const image = xmlText(
        entry.match(/<enclosure[^>]*\burl="([^"]+)"/)?.[1] ?? '',
      );
      if (!title || !url) return null;
      return { title, published, url, description, creator, image };
    })
    .filter((post): post is SubstackPost => post !== null);
}

/**
 * Read and parse the feed, or `null` when it is unreachable after retries.
 * Read by the LatestEdition island (request time) and by
 * scripts/substack-discord.mjs (GitHub Actions, hourly).
 */
export async function fetchSubstackPosts(): Promise<SubstackPost[] | null> {
  const res = await fetchWithRetry(FEED_URL, {
    cacheTtl: EDGE_TTL_S,
    backoffMs: 400,
    label: 'substack',
  });

  if (!res) return null;

  const text = await res.text();
  if (!text.includes('<item>')) {
    console.warn('[substack] feed carried no <item>');
    return null;
  }

  return parseSubstackFeed(text);
}

export async function getLatestSubstackPosts(
  limit = 3,
): Promise<SubstackPost[]> {
  const posts = await fetchSubstackPosts();
  // A parsed feed is the answer even when it is empty: retrying a publication
  // that genuinely has no posts yet will not conjure one.
  if (posts) return posts.slice(0, limit);

  console.warn(
    '[substack] feed unavailable after retries, the island renders its fallback',
  );
  return [];
}
