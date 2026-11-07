// Vite plugin that publishes a small index of the episode catalog.
//
// The catalog itself is the `episodes` content collection (src/content.config.ts),
// and the prerendered episode pages read it through astro:content. The server
// islands and /podcast.xml cannot: they run in the Worker at request time, and
// importing astro:content there would bundle every transcript into the Worker.
// What they need is tiny — "does this YouTube id have a page, and what is it
// called?" — so this plugin reads the episode.json files in real Node (the same
// reason plugins/thumb-cache.mjs exists: page code cannot touch the disk) and
// emits just that.
//
// readEpisodeIndex() is exported for astro.config.mjs (video sitemap entries) and
// scripts/sync-thumbs.mjs, so all three read the catalog the same way.

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const VIRTUAL_ID = 'virtual:discorgento-episode-index';
const RESOLVED_ID = `\0${VIRTUAL_ID}`;
export const EPISODES_DIR = 'src/content/episodes';
const LOCALES = ['pt-BR', 'en', 'es'];

/**
 * The `description:` line of a notes file's frontmatter. The schema requires it
 * double-quoted on one line in practice (every file is written that way), and a
 * YAML double-quoted scalar of that kind is valid JSON, so JSON.parse unescapes
 * it. Anything else falls back to the title rather than guessing.
 */
function readDescription(file) {
  if (!existsSync(file)) return null;
  const match = /^description:\s*("(?:[^"\\]|\\.)*")\s*$/m.exec(
    readFileSync(file, 'utf8'),
  );
  if (!match) return null;
  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

/**
 * Every episode folder that has an episode.json, as
 * `{ slug, youtubeId, number, published, duration, title }`, newest first.
 * Shape errors are left to the content collection schema, which fails the build
 * with a precise message; this only needs the fields to be present.
 * @param {string} [root]
 */
export function readEpisodeIndex(root = process.cwd()) {
  const dir = resolve(root, EPISODES_DIR);
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const file = resolve(dir, entry.name, 'episode.json');
      if (!existsSync(file)) return null;
      const data = JSON.parse(readFileSync(file, 'utf8'));
      return {
        slug: entry.name,
        youtubeId: data.youtubeId,
        number: data.number ?? null,
        published: data.published,
        duration: data.duration,
        title: data.title,
        description: Object.fromEntries(
          LOCALES.map((locale) => [
            locale,
            readDescription(resolve(dir, entry.name, `${locale}.md`)) ??
              data.title?.[locale] ??
              '',
          ]),
        ),
      };
    })
    .filter(Boolean)
    .sort((a, b) => Date.parse(b.published) - Date.parse(a.published));
}

export function episodeIndex() {
  return {
    name: 'discorgento:episode-index',

    resolveId(id) {
      return id === VIRTUAL_ID ? RESOLVED_ID : null;
    },

    load(id) {
      if (id !== RESOLVED_ID) return null;
      const index = readEpisodeIndex();
      // Re-run when an episode.json changes, so the dev server picks up a
      // renamed title without a restart. (A brand-new folder still needs one.)
      for (const entry of index) {
        this.addWatchFile?.(
          resolve(process.cwd(), EPISODES_DIR, entry.slug, 'episode.json'),
        );
      }
      return `export const EPISODE_INDEX = ${JSON.stringify(index)};`;
    },
  };
}
