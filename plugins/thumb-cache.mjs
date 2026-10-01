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
      try {
        for (const file of readdirSync(dir)) {
          const m = /^(.+)-(320|640|1280)\.jpg$/.exec(file);
          if (!m) continue;
          (sizes[m[1]] ??= []).push(Number(m[2]));
        }
      } catch {
        // No cache directory yet: every id resolves to the remote CDN.
      }

      const count = Object.keys(sizes).length;
      if (count) this.info?.(`[thumbs] ${count} cached thumbnail id(s) available`);
      return `export const CACHED_THUMBS = ${JSON.stringify(sizes)};`;
    },
  };
}
