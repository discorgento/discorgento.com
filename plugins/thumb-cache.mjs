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

import { readdirSync } from 'node:fs';
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
       * WebP twins, tracked separately rather than assumed from the JPEG list. The
       * pages emit a <picture> with a WebP <source>, and a <source> pointing at a
       * missing file is worse than no <source> at all: the browser commits to the
       * WebP, gets a 404, and paints nothing. Deriving this map from `sizes` would
       * make that a silent failure the day one file is deleted or a sync is
       * interrupted.
       * @type {Record<string, number[]>}
       */
      const webp = {};
      /* Sizes are read off the filenames instead of being listed here. A hardcoded
         alternation is a trap: adding a tier to sync-thumbs.mjs without editing this
         regex leaves the new files invisible, webpSrcset() goes null, and every
         <source> silently disappears from the built page — which looks like a
         regression in the WebP work rather than a stale regex. The set of sizes the
         site will ever ask for is the ThumbSize union in src/lib/youtube.ts, so an
         unexpected width on disk is inert rather than harmful. */
      const anySize = /^(.+)-(\d+)\.jpg$/;
      const anyWebp = /^(.+)-(\d+)\.webp$/;
      try {
        for (const file of readdirSync(dir)) {
          const jpg = anySize.exec(file);
          if (jpg) {
            (sizes[jpg[1]] ??= []).push(Number(jpg[2]));
            continue;
          }
          const w = anyWebp.exec(file);
          if (w) (webp[w[1]] ??= []).push(Number(w[2]));
        }
      } catch {
        // No cache directory yet: every id resolves to the remote CDN.
      }

      const count = Object.keys(sizes).length;
      const webpCount = Object.keys(webp).length;
      if (count) this.info?.(`[thumbs] ${count} cached thumbnail id(s), ${webpCount} with webp`);
      return `export const CACHED_THUMBS = ${JSON.stringify(sizes)};
export const WEBP_THUMBS = ${JSON.stringify(webp)};`;
    },
  };
}
