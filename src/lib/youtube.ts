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

const MAX_ATTEMPTS = 3;
const TIMEOUT_MS = 10_000;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function parseFeed(xml: string): Video[] {
  return xml
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
}

export async function getLatestVideos(): Promise<Video[]> {
  // The feed answers 500 intermittently. Retry, and shout in the build log:
  // an empty list silently ships a site with no episodes at all.
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(FEED_URL, {
        headers: { 'user-agent': 'discorgento-site' },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });

      if (res.ok) {
        const videos = parseFeed(await res.text());
        if (videos.length) return videos;
        break;
      }

      // 4xx means we are being refused, not throttled: retrying won't help.
      if (res.status < 500 && res.status !== 429) break;

      console.warn(
        `[youtube] feed returned ${res.status}, attempt ${attempt}/${MAX_ATTEMPTS}`
      );
    } catch (err) {
      console.warn(
        `[youtube] feed request failed on attempt ${attempt}/${MAX_ATTEMPTS}:`,
        err instanceof Error ? err.message : err
      );
    }

    if (attempt < MAX_ATTEMPTS) await sleep(attempt * 1000);
  }

  console.warn(
    '[youtube] no episodes fetched — the site will build with an empty episode list'
  );
  return [];
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