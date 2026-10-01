// Fetches the latest videos from the discorgento YouTube channel via the public RSS feed.
// Runs at build time (node) — no CORS, no API key. The feed delivers the 15 most recent videos.
//
// The feed is not dependable from CI: it answers 404 from datacenter IPs and 500 under load.
// A build must never ship a home page with no cover art and no episodes, so the fetch falls
// back to the committed snapshot in src/data/episodes.json when it yields nothing.

import snapshot from '~/data/episodes.json';
import { intlLocale } from '~/lib/i18n';
// Ids we have on disk, emitted at build time by plugins/thumb-cache.mjs. Reading
// the filesystem from here is not an option: prerendering runs inside workerd,
// where no path base resolves to the real project.
import { CACHED_THUMBS } from 'virtual:discorgento-thumb-cache';

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
  // The feed answers 500 under load and 404 from datacenter IPs. Retry, and shout in the
  // build log: an empty list silently ships a site with no episodes at all.
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
      if (res.status < 500 && res.status !== 429) {
        console.warn(`[youtube] feed refused with ${res.status}`);
        break;
      }

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

  console.warn('[youtube] falling back to the committed snapshot in src/data/episodes.json');
  return snapshot as Video[];
}

// Thumbnail URLs, self-hosted under public/img/episodes/ instead of i.ytimg.com.
// Three reasons, in order of weight: the cover is the LCP element and a third-party
// origin puts a DNS + TLS handshake on the critical path; Cloudflare cannot cache
// what it does not control, so every cold view re-fetches from Google; and ytimg
// leaks the visitor's IP to Google before they click anything.
//
// Sizing is deliberate, and the YouTube ladder is not what it looks like. Only
// mqdefault (320x180) and maxresdefault/hq720 (1280x720) are genuinely 16:9;
// hqdefault is 480x360 and sddefault is 640x480, both 4:3, and either would lose
// a quarter of the frame to the 16:9 object-fit: cover. Measured against the
// layout, that leaves three tiers:
//
//   320  →  the mobile card, whose art is a 7.5rem strip (120 CSS px) at 1x–2x
//   640  →  the same strip on a 3x phone, and desktop cards at 1x. YouTube has
//          no 16:9 asset this wide, so this one is derived from the 1280 by
//          scripts/sync-thumbs.mjs rather than downloaded.
//   1280 →  the cover, and cards on a 2x tablet, where 320 was drawing at 0.47x
//
// Do not add a downloaded mid tier without re-measuring the file it produces;
// `sddefault` is 640x480, not 640x360.
//
// The local copies are an optimisation, never a requirement: the feed yields a new
// id on every publish, and nobody is around to commit its thumbnail in the same
// commit that publishes the episode. Any id missing from CACHED_THUMBS falls back
// to the remote original, so a new episode costs one cross-origin request instead
// of a broken image. Run `npm run thumbs:sync` to pull the new files in.

/**
 * Fallback for each size when there is no local copy. 640 has no YouTube variant
 * of its own, so it falls back to the 1280 — never to sddefault, which would hand
 * back a 4:3 frame to a 16:9 box.
 */
const REMOTE_VARIANT = { 320: 'mqdefault', 640: 'maxresdefault', 1280: 'maxresdefault' } as const;
export type ThumbSize = keyof typeof REMOTE_VARIANT;

export function thumb(id: string, size: ThumbSize = 320): string {
  const has = CACHED_THUMBS[id]?.includes(size) ?? false;
  return has ? `/img/episodes/${id}-${size}.jpg` : `https://i.ytimg.com/vi/${id}/${REMOTE_VARIANT[size]}.jpg`;
}

export function episodeNum(title: string): string | null {
  const m = title.match(/^#(\d+)/);
  return m ? m[1] : null;
}

export function formatEpDate(published: string, locale: string): string {
  try {
    // UTC: the feed stamps are UTC and the build machine's timezone must not
    // decide which day an episode falls on.
    return new Intl.DateTimeFormat(intlLocale(locale), {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(new Date(published));
  } catch {
    return '';
  }
}