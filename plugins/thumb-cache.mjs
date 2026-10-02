// Vite plugin that publishes the list of locally cached episode thumbnails.
//
// The lookup cannot live in the page code. With the Cloudflare adapter, prerendering
// runs inside workerd, where every filesystem base is wrong or unavailable:
// `import.meta.url` is rewritten to a site URL, `import.meta.dirname` is undefined,
// and `process.cwd()` is /bundle. A existsSync() in a component therefore always
// misses and silently falls back to the remote CDN — the self-hosting never happens.
//
// This plugin runs in real Node, at config time, where the filesystem is reachable.
// It emits a virtual module holding the ids we have on disk, so the page code does a
// plain Set lookup with no I/O and no path guessing.

import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const VIRTUAL_ID = 'virtual:discorgento-thumb-cache';
const RESOLVED_ID = '\0' + VIRTUAL_ID;

/** Cached sizes are part of the contract; see the sizing note in src/lib/youtube.ts. */
export function thumbCache() {
  return {
    name: 'discorgento:thumb-cache',

    resolveId(id) {
      return id === VIRTUAL_ID ? RESOLVED_ID : null;
    },

    load(id) {
      if (id !== RESOLVED_ID) return null;

      const dir = resolve(process.cwd(), 'public/img/episodes');
      /** @type {Record<string, number[]>} */
      const sizes = {};
      /**
       * Modern-format twins, tracked per format rather than assumed from the JPEG
       * list. The pages emit a <picture> with an AVIF and a WebP <source>, and a
       * <source> pointing at a missing file is worse than no <source> at all: the
       * browser commits to that format, gets a 404, and paints nothing. Deriving
       * these maps from `sizes` would make that a silent failure the day one file is
       * deleted or a sync is interrupted.
       * @type {Record<string, number[]>}
       */
      const webp = {};
      /** @type {Record<string, number[]>} */
      const avif = {};
      const buckets = { jpg: sizes, webp, avif };
      /* Sizes and formats are read off the filenames instead of being listed here. A
         hardcoded alternation is a trap: adding a tier or a format to sync-thumbs.mjs
         without editing this regex leaves the new files invisible, avifSrcset() and
         webpSrcset() go null, and every <source> silently disappears from the built
         page — which looks like a regression in the image work rather than a stale
         regex. The set of sizes the site will ever ask for is the ThumbSize union in
         src/lib/youtube.ts, so an unexpected width on disk is inert rather than
         harmful. */
      const anySize = /^(.+)-(\d+)\.(jpg|webp|avif)$/;
      try {
        for (const file of readdirSync(dir)) {
          const m = anySize.exec(file);
          if (m) (buckets[m[3]][m[1]] ??= []).push(Number(m[2]));
        }
      } catch {
        // No cache directory yet: every id resolves to the remote CDN.
      }

      const count = Object.keys(sizes).length;
      const webpCount = Object.keys(webp).length;
      const avifCount = Object.keys(avif).length;
      if (count) {
        this.info?.(
          `[thumbs] ${count} cached thumbnail id(s), ${webpCount} with webp, ${avifCount} with avif`
        );
      }
      /* A content version for the cacheable episode assets, so the immutable
         Cache-Control in public/_headers is provably safe.
         The files are named <id>-<size>.<ext>, not content-hashed, so a re-encode
         at different encoder settings produces different bytes behind an unchanged
         URL. With immutable that is a trap: browsers would keep the old encoding for
         a year. Hashing the directory and threading it through as ?v= turns any byte
         change into a new URL, which is the same trick Astro already uses for
         /_astro — and the reason those get max-age=31536000 while these images
         shipped max-age=0. */
      const version = createHash('sha256');
      for (const file of readdirSync(dir).sort()) {
        version.update(file).update(readFileSync(resolve(dir, file)));
      }

      return `export const CACHED_THUMBS = ${JSON.stringify(sizes)};
export const WEBP_THUMBS = ${JSON.stringify(webp)};
export const AVIF_THUMBS = ${JSON.stringify(avif)};
export const THUMB_VERSION = ${JSON.stringify(version.digest('hex').slice(0, 8))};`;
    },
  };
}
