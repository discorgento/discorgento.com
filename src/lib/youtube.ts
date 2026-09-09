// Fetches the latest videos from the discorgento YouTube channel via the public RSS feed.
// Runs at build time (node) — no CORS, no API key. The feed delivers the 15 most recent videos.

const CHANNEL_ID = 'UChJitnyFtNOoCe6cu-rHcow';
const FEED_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;

export interface Video {
  id: string;
  title: string;
  published: string;
  url: string;
}

function decodeXml(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

export async function getLatestVideos(): Promise<Video[]> {
  try {
    const res = await fetch(FEED_URL, {
      headers: { 'user-agent': 'discorgento-site' },
    });
    if (!res.ok) return [];
    const text = await res.text();

    return text
      .split('<entry>')
      .slice(1)
      .map((entry) => {
        const id = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1];
        if (!id) return null;
        const title =
          entry.match(/<media:title>([^<]+)<\/media:title>/)?.[1] ??
          entry.match(/<title>([^<]+)<\/title>/)?.[1] ??
          '';
        const published = entry.match(/<published>([^<]+)<\/published>/)?.[1] ?? '';
        return {
          id,
          title: decodeXml(title),
          published,
          url: `https://www.youtube.com/watch?v=${id}`,
        };
      })
      .filter((v): v is Video => v !== null);
  } catch {
    return [];
  }
}

export function episodeNum(title: string): string | null {
  const m = title.match(/^#(\d+)/);
  return m ? m[1] : null;
}

export function formatEpDate(published: string, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale === 'pt-BR' ? 'pt-BR' : 'en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(published));
  } catch {
    return '';
  }
}