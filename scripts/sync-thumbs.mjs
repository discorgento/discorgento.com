// Downloads episode thumbnails into public/img/episodes/ so the LCP image is
// served from our own origin instead of i.ytimg.com.
//
// Run it after publishing a new episode:
//
//   npm run thumbs:sync
//
// It reads the same feed the build reads, mirrors src/data/episodes.json (the
// committed fallback), and writes only what is missing. Existing files are left
// alone, so re-running is cheap and never re-downloads.
//
// The site does not depend on this: src/lib/youtube.ts falls back to the remote
// URL for any id without a local copy. Syncing only removes that extra
// cross-origin request from the critical path.
//
// Note on sizes: mqdefault (320x180) is the smallest genuinely 16:9 asset, and
// the layout crops with object-fit: cover — hqdefault is 480x360 (4:3) and would
// silently crop ~43% of the frame. Only the newest episode gets the 1280 variant,
// because only the newest episode is ever the cover.

import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const CHANNEL_ID = 'UChJitnyFtNOoCe6cu-rHcow';
const FEED_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;
const OUT_DIR = resolve(process.cwd(), 'public/img/episodes');
const TIMEOUT_MS = 15_000;

const sizesFor = (isNewest) =>
  isNewest
    ? [['mqdefault', 320], ['maxresdefault', 1280]]
    : [['mqdefault', 320]];

/* YouTube video ids are [A-Za-z0-9_-]. Validating here is what keeps an id from
   the feed out of the download URL and out of the write path below: the feed
   parser accepts any character except `<`, so `../../../x` would otherwise reach
   resolve(OUT_DIR, `${id}-${size}.jpg`) and write outside the cache directory. */
const VIDEO_ID = /^[\w-]{6,20}$/;
const isVideoId = (id) => VIDEO_ID.test(id);

const feedIds = async () => {
  const res = await fetch(FEED_URL, {
    headers: { 'user-agent': 'discorgento-site' },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`feed returned ${res.status}`);
  const xml = await res.text();
  return [...xml.matchAll(/<yt:videoId>([^<]+)<\/yt:videoId>/g)]
    .map((m) => m[1])
    .filter(isVideoId);
};

const snapshotIds = async () => {
  const { default: snap } = await import(resolve(process.cwd(), 'src/data/episodes.json'), {
    with: { type: 'json' },
  });
  return snap.map((v) => v.id).filter(isVideoId);
};

const download = async (id, variant, size) => {
  if (!isVideoId(id)) {
    console.warn(`  skip ${id}: not a valid video id`);
    return false;
  }
  const url = `https://i.ytimg.com/vi/${id}/${variant}.jpg`;
  const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) {
    console.warn(`  skip ${id}/${variant}: HTTP ${res.status}`);
    return false;
  }
  const bytes = Buffer.from(await res.arrayBuffer());
  await writeFile(resolve(OUT_DIR, `${id}-${size}.jpg`), bytes);
  console.log(`  got  ${id}-${size}.jpg  ${(bytes.length / 1024).toFixed(1)} kB`);
  return true;
};

const main = async () => {
  await mkdir(OUT_DIR, { recursive: true });

  let ids;
  try {
    ids = await feedIds();
    console.log(`feed: ${ids.length} episodes`);
  } catch (err) {
    console.warn(`feed unavailable (${err.message}), falling back to the committed snapshot`);
    ids = await snapshotIds();
  }

  const snap = await snapshotIds();
  const all = [...new Set([...ids, ...snap])];
  let downloaded = 0;
  let skipped = 0;

  for (const [i, id] of all.entries()) {
    for (const [variant, size] of sizesFor(i === 0)) {
      if (existsSync(resolve(OUT_DIR, `${id}-${size}.jpg`))) {
        skipped++;
        continue;
      }
      if (await download(id, variant, size)) downloaded++;
    }
  }

  console.log(`\ndone: ${downloaded} downloaded, ${skipped} already present`);
  if (downloaded) console.log('review the new files, then commit them with the episode');
};

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
