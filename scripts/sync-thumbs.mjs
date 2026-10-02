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
// Note on sizes: YouTube's ladder is not what the names suggest. Only mqdefault
// (320x180) and maxresdefault/hq720 (1280x720) are genuinely 16:9. hqdefault is
// 480x360 and sddefault is 640x480, both 4:3 — either would lose a quarter of the
// frame to the 16:9 object-fit: cover.
//
// So there is no mid tier to download, and there is no reason not to have one.
// The 1280 is already 16:9, so the 640 and the 1024 are derived from it locally
// with sharp: exact 2:1 and 4:5 downscales, no crop, ~46 kB and ~103 kB against
// the 1280's ~146 kB. Without the 640 the browser jumps from 320 straight to
// 1280 on a 3x phone, which is ~870 kB for six 120px thumbnails instead of
// ~276 kB. Without the 1024 the cover on a phone pulls the full 1280.

import { existsSync } from 'node:fs';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import sharp from 'sharp';

const CHANNEL_ID = 'UChJitnyFtNOoCe6cu-rHcow';
const FEED_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;
const OUT_DIR = resolve(process.cwd(), 'public/img/episodes');
const TIMEOUT_MS = 15_000;

/** Downloaded straight from YouTube. Both are 16:9. */
const SOURCES = [['mqdefault', 320], ['maxresdefault', 1280]];
/**
 * Derived locally from the 1280. YouTube has no 16:9 asset at these widths.
 *
 * 640 covers the mobile card strip; 1024 covers the cover on a phone, where a
 * 346 CSS px slot at DPR 2.625 needs 908 real px. Without 1024 the browser jumps
 * from 640 to 1280 there and pulls 41% more pixels than the screen can show,
 * which is ~104 kB of WebP where ~74 kB would do.
 */
const DERIVED = [
  [1280, 640],
  [1280, 1024],
];

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

/* YouTube has no 16:9 asset at 640 wide — sddefault is 640x480, which the 16:9
   cover would crop. The 1280 is already 16:9, so resize it. `cover` on an exact
   2:1 source and target crops nothing; it only matters if a future source is a
   different shape, where it keeps the frame filling 16:9 the same way the CSS
   object-fit does. */
const derive = async (id, from, to) => {
  const src = resolve(OUT_DIR, `${id}-${from}.jpg`);
  if (!existsSync(src)) {
    console.warn(`  skip ${id}-${to}.jpg: ${from} is not on disk`);
    return false;
  }
  const out = await sharp(await readFile(src))
    .resize(to, Math.round((to * 9) / 16), { fit: 'cover' })
    .jpeg({ quality: 82, chromaSubsampling: '4:2:0', progressive: true })
    .toBuffer();
  await writeFile(resolve(OUT_DIR, `${id}-${to}.jpg`), out);
  console.log(`  made ${id}-${to}.jpg  ${(out.length / 1024).toFixed(1)} kB`);
  return true;
};

/* WebP twin of an already-present .jpg.
 *
 * YouTube only serves JPEG, and its JPEGs are not well compressed: the 1280 cover
 * that carries the LCP on a phone lands at ~170 kB, while the same frame as WebP
 * is ~104 kB. Every browser that matters supports WebP, so the pages serve it
 * through <picture> and keep the .jpg as the <img> fallback.
 *
 * Derived from the file already on disk rather than downloaded again — the
 * source is local, so this costs one encode and no network. */
const toWebp = async (id, size) => {
  const src = resolve(OUT_DIR, `${id}-${size}.jpg`);
  const out_path = resolve(OUT_DIR, `${id}-${size}.webp`);
  if (!existsSync(src)) return false;
  if (existsSync(out_path)) return false;
  const out = await sharp(await readFile(src))
    .webp({ quality: 78, effort: 5 })
    .toBuffer();
  await writeFile(out_path, out);
  const before = (await stat(src)).size;
  console.log(
    `  webp ${id}-${size}.webp  ${(out.length / 1024).toFixed(1)} kB  (jpg era ${(before / 1024).toFixed(1)} kB)`
  );
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
  let derived = 0;
  let encoded = 0;
  let skipped = 0;

  const sizes = SOURCES.map(([, size]) => size).concat(DERIVED.map(([, to]) => to));
  for (const id of all) {
    for (const [variant, size] of SOURCES) {
      if (existsSync(resolve(OUT_DIR, `${id}-${size}.jpg`))) {
        skipped++;
        continue;
      }
      if (await download(id, variant, size)) downloaded++;
    }
    for (const [from, to] of DERIVED) {
      if (existsSync(resolve(OUT_DIR, `${id}-${to}.jpg`))) {
        skipped++;
        continue;
      }
      if (await derive(id, from, to)) derived++;
    }
    for (const size of sizes) {
      if (await toWebp(id, size)) encoded++;
    }
  }

  console.log(
    `\ndone: ${downloaded} downloaded, ${derived} derived, ${encoded} webp, ${skipped} already present`
  );
  if (downloaded) console.log('review the new files, then commit them with the episode');
};

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
