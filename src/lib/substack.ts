// Fetches the latest posts from the discorgento Substack publication RSS feed.
// Runs at build time — public feed, no auth. Degrades to [] silently (same pattern as youtube.ts).

const FEED_URL = 'https://discorgento.substack.com/feed';

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

export async function getLatestSubstackPosts(limit = 3): Promise<SubstackPost[]> {
  try {
    const res = await fetch(FEED_URL, {
      headers: { 'user-agent': 'discorgento-site' },
    });
    if (!res.ok) return [];
    const text = await res.text();
    if (!text.includes('<item>')) return [];

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
      .filter((post): post is SubstackPost => post !== null)
      .slice(0, limit);
  } catch {
    return [];
  }
}