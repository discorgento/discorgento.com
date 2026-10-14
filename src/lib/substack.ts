// Fetches the latest posts from the discorgento Substack publication RSS feed.
// Public feed, no auth. Degrades to [] when it fails.
//
// Two callers with different clocks:
//   - the LatestEdition server island reads it at request time, so a new post shows
//     up without a redeploy. That is the point of the island.
//   - nothing reads it at build time any more; the page ships the island, not the
//     post, so there is no committed snapshot to keep current.
//
// Timeout, retries and edge caching live in `~/lib/fetch` (`fetchWithRetry`),
// shared with youtube.ts and discord.ts so the three cannot drift apart.

import { fetchWithRetry } from '~/lib/fetch';

const FEED_URL = 'https://discorgento.substack.com/feed';
const EDGE_TTL_S = 1_800;

export interface SubstackPost {
  title: string;
  published: string; // RFC822 pubDate, parsed by consumers via Date.parse
  url: string;
}

function clean(value: string): string {
  return value
    .replace(/<!\[CDATA\[|\]\]>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .trim();
}

async function readFeed(): Promise<SubstackPost[] | null> {
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

  return text
    .split('<item>')
    .slice(1)
    .map((entry) => {
      const title = clean(entry.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? '');
      const url = clean(entry.match(/<link>([^<]+)<\/link>/)?.[1] ?? '');
      const published = clean(
        entry.match(/<pubDate>([^<]+)<\/pubDate>/)?.[1] ?? '',
      );
      if (!title || !url) return null;
      return { title, published, url };
    })
    .filter((post): post is SubstackPost => post !== null);
}

export async function getLatestSubstackPosts(
  limit = 3,
): Promise<SubstackPost[]> {
  const posts = await readFeed();
  // A parsed feed is the answer even when it is empty: retrying a publication
  // that genuinely has no posts yet will not conjure one.
  if (posts) return posts.slice(0, limit);

  console.warn(
    '[substack] feed unavailable after retries, the island renders its fallback',
  );
  return [];
}
