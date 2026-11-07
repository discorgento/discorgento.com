// Fetches the latest videos from the discorgento YouTube channel via the public RSS feed.
// No CORS, no API key; the feed delivers the 15 most recent videos. Called at build time
// (the islands' fallbacks) and at request time (the episode islands and /podcast.xml).
//
// The feed is not dependable from CI: it answers 404 from datacenter IPs and 500 under load.
// A build must never ship a home page with no cover art and no episodes, so the fetch falls
// back to the episode catalog (src/content/episodes, via getSnapshotVideos) when it yields
// nothing.

// Ids we have on disk, emitted at build time by plugins/thumb-cache.mjs. Reading
// the filesystem from here is not an option: prerendering runs inside workerd,
// where no path base resolves to the real project.
import {
  AVIF_THUMBS,
  CACHED_THUMBS,
  THUMB_VERSION,
  WEBP_THUMBS,
} from 'virtual:discorgento-thumb-cache';
import { catalogVideos } from '~/lib/episodes';
import { fetchWithRetry } from '~/lib/fetch';
import { intlLocale } from '~/lib/i18n';
import { xmlText } from '~/lib/xml';

const CHANNEL_ID = 'UChJitnyFtNOoCe6cu-rHcow';
const FEED_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;

export interface Video {
  id: string;
  title: string;
  published: string;
  url: string;
}

/** Parse the `<entry>` elements of the YouTube channel feed. Pure, for tests. */
export function parseFeed(xml: string): Video[] {
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
      const published =
        entry.match(/<published>([^<]+)<\/published>/)?.[1] ?? '';
      return {
        id,
        title: xmlText(title),
        published,
        url: `https://www.youtube.com/watch?v=${id}`,
      };
    })
    .filter((v): v is Video => v !== null);
}

/**
 * The build-time stand-in for the feed: the episode catalog, newest first.
 *
 * The catalog is validated by the content collection schema, so this cannot
 * hand back a malformed entry. An empty catalog is the one failure left, and it
 * would ship a home page with no cover and no episodes, so it throws instead.
 */
export function getSnapshotVideos(): Video[] {
  const videos = catalogVideos();
  if (!videos.length) {
    throw new Error(
      '[episodes] the catalog in src/content/episodes is empty; the home page needs at least one episode',
    );
  }
  return videos;
}

export async function getLatestVideos(): Promise<Video[]> {
  // The feed answers 500 under load and 404 from datacenter IPs; fetchWithRetry
  // covers the flaky cases and logs each attempt. An empty list must never ship a
  // site with no episodes at all, so falling through returns the snapshot.
  const res = await fetchWithRetry(FEED_URL, {
    cacheTtl: 1_800,
    label: 'youtube',
  });

  if (res) {
    const videos = parseFeed(await res.text());
    if (videos.length) return videos;
  }

  console.warn('[youtube] falling back to the episode catalog');
  return getSnapshotVideos();
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
//   1024 →  the cover on a phone. A 346 CSS px slot at DPR 2.625 needs 908 real
//          px, so the browser was jumping straight from 640 to 1280 and pulling
//          41% more pixels than the screen can show. Also derived from the 1280.
//   1280 →  the cover on desktop (1184 CSS px, ~2368 real px) and 2x tablets
//
// Do not add a downloaded mid tier without re-measuring the file it produces;
// `sddefault` is 640x480, not 640x360.
//
// The local copies are an optimisation, never a requirement: the feed yields a new
// id on every publish, and nobody is around to commit its thumbnail in the same
// commit that publishes the episode. Any id missing from CACHED_THUMBS falls back
// to the remote original, so a new episode costs one cross-origin request instead
// of a broken image. `npm run build` syncs the new files in as a pre-build step.

/**
 * Fallback for each size when there is no local copy. 640 and 1024 have no YouTube
 * variant of their own, so they fall back to the 1280 — never to sddefault, which
 * would hand back a 4:3 frame to a 16:9 box.
 */
const REMOTE_VARIANT = {
  320: 'mqdefault',
  640: 'maxresdefault',
  1024: 'maxresdefault',
  1280: 'maxresdefault',
} as const;
export type ThumbSize = keyof typeof REMOTE_VARIANT;

export function thumb(id: string, size: ThumbSize = 320): string {
  const has = CACHED_THUMBS[id]?.includes(size) ?? false;
  return has
    ? `/img/episodes/${id}-${size}.jpg?v=${THUMB_VERSION}`
    : `https://i.ytimg.com/vi/${id}/${REMOTE_VARIANT[size]}.jpg`;
}

/**
 * WebP twin of a cached thumbnail, or null when there is no local copy.
 *
 * YouTube serves no WebP, so the remote fallback cannot be expressed here: a
 * <source type="image/webp"> pointing at i.ytimg.com would hand the browser a
 * JPEG to decode as WebP and paint nothing. Returning null makes the caller drop
 * the <source> entirely and fall back to the <img>, which is the only correct
 * behaviour for an id that was never synced.
 *
 * Exists because the LCP cover is a 1280 JPEG straight off YouTube at ~170 kB;
 * the same frame as WebP is ~104 kB. The .jpg files stay as the <img> fallback
 * so a browser without WebP still gets a picture.
 */
export function webpThumb(id: string, size: ThumbSize = 320): string | null {
  return WEBP_THUMBS[id]?.includes(size)
    ? `/img/episodes/${id}-${size}.webp?v=${THUMB_VERSION}`
    : null;
}

/**
 * Full WebP srcset for a <source>, or null when any tier is missing.
 *
 * All-or-nothing on purpose. A srcset with a hole in it is not a graceful
 * degradation: if 320 is listed but 1280 is not, the browser happily picks the
 * 320 for a 1184px slot and the cover renders soft on desktop. Emitting nothing
 * falls back to the <img>, which is the JPEG and always correct.
 */
export function webpSrcset(id: string, sizes: ThumbSize[]): string | null {
  const parts: string[] = [];
  for (const size of sizes) {
    const path = webpThumb(id, size);
    if (!path) return null;
    parts.push(`${path} ${size}w`);
  }
  return parts.length ? parts.join(', ') : null;
}

/**
 * Full AVIF srcset for a <source>, or null when any tier is missing.
 *
 * Same all-or-nothing rule as webpSrcset, and for a sharper reason: AVIF is only
 * ever emitted as the *first* <source> in the <picture>, so it is the branch every
 * modern browser actually takes. A hole in this srcset is invisible to the JPEG
 * fallback — it would simply be the file the browser settles on.
 *
 * The remote fallback cannot be expressed here at all. YouTube serves no AVIF, so
 * there is nothing to point a <source type="image/avif"> at on i.ytimg.com.
 */
export function avifSrcset(id: string, sizes: ThumbSize[]): string | null {
  const parts: string[] = [];
  for (const size of sizes) {
    if (!AVIF_THUMBS[id]?.includes(size)) return null;
    parts.push(`/img/episodes/${id}-${size}.avif?v=${THUMB_VERSION} ${size}w`);
  }
  return parts.length ? parts.join(', ') : null;
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
