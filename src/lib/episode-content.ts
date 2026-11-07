// The astro:content side of the episode catalog: assembles each episode from its
// four collections and enforces the cross-file rules. Only prerendered pages and
// endpoints may import this — pulling astro:content into a request-time module
// would bundle every transcript into the Worker. Request-time code uses the
// small index in src/lib/episodes.ts instead.

import { type CollectionEntry, getCollection } from 'astro:content';
import { catalogProblems } from '~/lib/episodes';
import { LOCALES, type Locale } from '~/lib/i18n';
import { team } from '~/lib/team';

export interface Episode {
  slug: string;
  data: CollectionEntry<'episodes'>['data'];
  notes: Record<Locale, CollectionEntry<'episodeNotes'>>;
  transcript: CollectionEntry<'transcripts'>['data'];
  guests: CollectionEntry<'guests'>[];
}

let cache: Promise<Episode[]> | undefined;

/** catalogProblems() already proved presence; this only narrows the type. */
function must<T>(value: T | undefined): T {
  if (value === undefined) throw new Error('[episodes] catalog lookup missed');
  return value;
}

/**
 * Every episode, assembled and validated, newest first.
 *
 * Throws with one line per problem when the catalog is inconsistent (a missing
 * locale, an unknown host, a dangling guest), so the build fails on the file
 * that needs fixing instead of shipping a page with a hole in it. Memoized:
 * every page of the build asks for the same catalog.
 */
export function getEpisodes(): Promise<Episode[]> {
  cache ??= load();
  return cache;
}

async function load(): Promise<Episode[]> {
  const [episodes, notes, transcripts, guests] = await Promise.all([
    getCollection('episodes'),
    getCollection('episodeNotes'),
    getCollection('transcripts'),
    getCollection('guests'),
  ]);

  const problems = catalogProblems({
    episodes: episodes.map((e) => ({
      slug: e.id,
      hosts: e.data.hosts,
      guests: e.data.guests.map((g) => g.id),
    })),
    notes: notes.map((n) => n.id),
    transcripts: transcripts.map((t) => t.id),
    guests: guests.map((g) => g.id),
    hostRoster: team.map((member) => member.slug),
    youtubeIds: episodes.map((e) => e.data.youtubeId),
  });
  if (problems.length) {
    throw new Error(
      `[episodes] the catalog in src/content/episodes is inconsistent:\n  - ${problems.join('\n  - ')}`,
    );
  }

  const notesById = new Map(notes.map((n) => [n.id, n]));
  const transcriptById = new Map(transcripts.map((t) => [t.id, t.data]));
  const guestById = new Map(guests.map((g) => [g.id, g]));

  return episodes
    .map((e) => ({
      slug: e.id,
      data: e.data,
      notes: Object.fromEntries(
        LOCALES.map((l) => [l, must(notesById.get(`${e.id}/${l}`))]),
      ) as Record<Locale, CollectionEntry<'episodeNotes'>>,
      transcript: must(transcriptById.get(e.id)),
      guests: e.data.guests.map((g) => must(guestById.get(g.id))),
    }))
    .sort(
      (a, b) => Date.parse(b.data.published) - Date.parse(a.data.published),
    );
}
