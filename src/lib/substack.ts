// Fetches the latest posts from the discorgento Substack publication RSS feed.
// Public feed, no auth. Degrades to [] when it fails.
//
// Two callers with different clocks:
//   - the LatestEdition server island reads it at request time, so a new post shows
//     up without a redeploy. That is the point of the island.
//   - nothing reads it at build time any more; the page ships the island, not the
//     post, so there is no committed snapshot to keep current.
//
// The timeout is not optional. On the runtime path a feed that accepts the connection
// and then never responds would hold the island open until the Worker is killed; at
// build time it hangs the whole build. Same for discord.ts.

const FEED_URL = 'https://discorgento.substack.com/feed';
const TIMEOUT_MS = 10_000;
const ATTEMPTS = 3;
const RETRY_BACKOFF_MS = 400;
// The island runs once per page view. Caching the feed at the Cloudflare edge keeps
// the publication from being hit on every one of them; a new post is visible within
// this window. Node ignores `cf`, so the build-time path is unaffected.
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

// A fresh AbortSignal per attempt: reusing one would leave it already aborted after
// the first timeout and make every retry fail instantly.
async function readFeed(): Promise<SubstackPost[] | null> {
  const res = await fetch(FEED_URL, {
    headers: { 'user-agent': 'discorgento-site' },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    cf: { cacheTtl: EDGE_TTL_S, cacheEverything: true },
  } as RequestInit & { cf: { cacheTtl: number; cacheEverything: boolean } });

  if (!res.ok) {
    console.warn(`[substack] feed returned ${res.status}`);
    return null;
  }

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
      const published = clean(entry.match(/<pubDate>([^<]+)<\/pubDate>/)?.[1] ?? '');
      if (!title || !url) return null;
      return { title, published, url };
    })
    .filter((post): post is SubstackPost => post !== null);
}

export async function getLatestSubstackPosts(limit = 3): Promise<SubstackPost[]> {
  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    try {
      const posts = await readFeed();
      // A parsed feed is the answer even when it is empty: retrying a publication
      // that genuinely has no posts yet will not conjure one.
      if (posts) return posts.slice(0, limit);
    } catch (err) {
      console.warn(
        `[substack] attempt ${attempt}/${ATTEMPTS} failed:`,
        err instanceof Error ? err.message : err
      );
    }
    if (attempt < ATTEMPTS) {
      await new Promise((resolve) => setTimeout(resolve, RETRY_BACKOFF_MS * attempt));
    }
  }

  console.warn('[substack] feed unavailable after retries, the island renders its fallback');
  return [];
}
