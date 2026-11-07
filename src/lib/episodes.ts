// Pure helpers around the episode catalog (src/content/episodes). Nothing here
// imports astro:content, so the request-time code (server islands, /podcast.xml)
// can use it without bundling the collection into the Worker, and `npm test`
// can import it as-is. The astro:content side is src/lib/episode-content.ts.

import {
  EPISODE_INDEX,
  type EpisodeIndexEntry,
} from 'virtual:discorgento-episode-index';
import { LOCALES, type Locale } from '~/lib/i18n';
import type { Video } from '~/lib/youtube';

export type { EpisodeIndexEntry };

export function asLocale(locale: string): Locale {
  return (LOCALES as readonly string[]).includes(locale)
    ? (locale as Locale)
    : 'pt-BR';
}

/** The site path of an episode page. Same slug in every locale. */
export function episodePath(slug: string, locale: string): string {
  const l = asLocale(locale);
  return l === 'pt-BR' ? `/podcast/${slug}/` : `/${l}/podcast/${slug}/`;
}

/** The locale's home page. */
export function homePath(locale: string): string {
  const l = asLocale(locale);
  return l === 'pt-BR' ? '/' : `/${l}/`;
}

/** The locale's /podcast/ listing, which is the series' home. */
export function podcastPath(locale: string): string {
  const l = asLocale(locale);
  return l === 'pt-BR' ? '/podcast/' : `/${l}/podcast/`;
}

export function youtubeUrl(youtubeId: string): string {
  return `https://www.youtube.com/watch?v=${youtubeId}`;
}

export function findEpisode(
  youtubeId: string,
  index: EpisodeIndexEntry[] = EPISODE_INDEX,
): EpisodeIndexEntry | null {
  return index.find((e) => e.youtubeId === youtubeId) ?? null;
}

/** `9` → `'009'`, the way the series has always numbered episodes. */
export function padNumber(n: number | null): string | null {
  return n === null ? null : String(n).padStart(3, '0');
}

/** `#009` from a raw YouTube title, for feed entries the catalog does not know. */
export function numberFromTitle(title: string): string | null {
  return title.match(/^#(\d+)/)?.[1] ?? null;
}

/** The catalog as feed-shaped videos, newest first: the build-time snapshot. */
export function catalogVideos(
  index: EpisodeIndexEntry[] = EPISODE_INDEX,
): Video[] {
  return index.map((e) => ({
    id: e.youtubeId,
    title: e.title['pt-BR'],
    published: e.published,
    url: youtubeUrl(e.youtubeId),
  }));
}

/**
 * The live feed plus every catalogued episode it no longer carries, newest
 * first. The YouTube feed only lists the 15 latest uploads; the catalog is the
 * full archive, so the union is what a listing should show.
 */
export function mergeWithCatalog(
  feed: Video[],
  index: EpisodeIndexEntry[] = EPISODE_INDEX,
): Video[] {
  const seen = new Set(feed.map((v) => v.id));
  const missing = catalogVideos(index).filter((v) => !seen.has(v.id));
  return [...feed, ...missing].sort(
    (a, b) => Date.parse(b.published) - Date.parse(a.published),
  );
}

/** What a card or a list row needs to render one episode in one locale. */
export interface EpisodeCard {
  id: string;
  /** The catalog's clean, localized title; the raw feed title otherwise. */
  title: string;
  /** Zero-padded, e.g. '009'; null outside the numbered series. */
  number: string | null;
  published: string;
  /** The episode page when there is one, YouTube otherwise. */
  href: string;
  external: boolean;
  youtubeUrl: string;
}

export function toCard(
  video: Video,
  locale: string,
  index: EpisodeIndexEntry[] = EPISODE_INDEX,
): EpisodeCard {
  const entry = findEpisode(video.id, index);
  if (!entry) {
    return {
      id: video.id,
      title: video.title,
      number: numberFromTitle(video.title),
      published: video.published,
      href: video.url,
      external: true,
      youtubeUrl: video.url,
    };
  }
  return {
    id: video.id,
    title: entry.title[asLocale(locale)],
    number: padNumber(entry.number),
    published: entry.published,
    href: episodePath(entry.slug, locale),
    external: false,
    youtubeUrl: video.url,
  };
}

/** `3739` → `'PT1H2M19S'` (schema.org / ISO 8601 duration). */
export function isoDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `PT${h ? `${h}H` : ''}${m ? `${m}M` : ''}${s || (!h && !m) ? `${s}S` : ''}`;
}

/** `3739` → `'1:02:19'`, `139` → `'2:19'`: the player-style clock. */
export function clock(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = String(seconds % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`;
}

/** Rounded minutes, at least 1: `3739` → `62`. */
export function minutes(seconds: number): number {
  return Math.max(1, Math.round(seconds / 60));
}

// ---------------------------------------------------------------------------
// Structured data
// ---------------------------------------------------------------------------

export interface JsonLdPerson {
  /** Stable node id: the profile URL for hosts, a site-local id for guests. */
  id: string;
  name: string;
  role?: string | undefined;
  sameAs?: string[] | undefined;
}

export interface EpisodeJsonLdInput {
  site: string;
  locale: string;
  slug: string;
  youtubeId: string;
  number: number | null;
  published: string;
  duration: number;
  /** Spoken language. */
  language: string;
  title: string;
  description: string;
  chapters: { start: number; title: string }[];
  hosts: JsonLdPerson[];
  guests: JsonLdPerson[];
  /** Absolute thumbnail URLs, largest first. */
  thumbnails: string[];
  /** Localized labels for the breadcrumb trail. */
  crumbs: { home: string; podcast: string };
}

/** The site-local node id for a guest, shared by every page that mentions them. */
export function guestNodeId(site: string, guestSlug: string): string {
  return `${new URL('/', site).href}#person-${guestSlug}`;
}

function personNode(person: JsonLdPerson) {
  return {
    '@type': 'Person',
    '@id': person.id,
    name: person.name,
    ...(person.role ? { jobTitle: person.role } : {}),
    ...(person.sameAs?.length ? { sameAs: person.sameAs } : {}),
  };
}

/**
 * PodcastEpisode + VideoObject (with chapters as Clip) + BreadcrumbList + the
 * guests as Person nodes, in one @graph.
 *
 * Google only gives a video rich result on a watch page — one whose main
 * purpose is that video — and requires name, thumbnailUrl and uploadDate on the
 * VideoObject; description, duration, embedUrl and hasPart are recommended.
 * Clip urls point at this page with `?t=`, which the page's player honours, so
 * the key moments land on our page rather than on youtube.com.
 */
export function buildEpisodeJsonLd(input: EpisodeJsonLdInput) {
  const root = new URL('/', input.site).href;
  const pageUrl = new URL(episodePath(input.slug, input.locale), root).href;
  const podcastUrl = new URL(podcastPath(input.locale), root).href;
  const organization = { '@id': `${root}#organization` };
  const videoId = `${pageUrl}#video`;

  const clips = input.chapters.map((chapter, i) => ({
    '@type': 'Clip',
    name: chapter.title,
    startOffset: chapter.start,
    endOffset: input.chapters[i + 1]?.start ?? input.duration,
    url: `${pageUrl}?t=${chapter.start}`,
  }));

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'PodcastEpisode',
        '@id': `${pageUrl}#episode`,
        url: pageUrl,
        name: input.title,
        description: input.description,
        datePublished: input.published,
        timeRequired: isoDuration(input.duration),
        inLanguage: input.language,
        ...(input.number !== null ? { episodeNumber: input.number } : {}),
        partOfSeries: { '@id': `${podcastUrl}#series` },
        publisher: organization,
        associatedMedia: { '@id': videoId },
        ...(input.hosts.length
          ? { author: input.hosts.map((h) => ({ '@id': h.id })) }
          : { author: organization }),
        ...(input.guests.length
          ? { contributor: input.guests.map((g) => ({ '@id': g.id })) }
          : {}),
      },
      {
        '@type': 'VideoObject',
        '@id': videoId,
        name: input.title,
        description: input.description,
        thumbnailUrl: input.thumbnails,
        uploadDate: input.published,
        duration: isoDuration(input.duration),
        embedUrl: `https://www.youtube-nocookie.com/embed/${input.youtubeId}`,
        inLanguage: input.language,
        publisher: organization,
        // The canonical copy lives on YouTube; saying so keeps the two from
        // being read as competing duplicates.
        sameAs: youtubeUrl(input.youtubeId),
        ...(clips.length ? { hasPart: clips } : {}),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            name: input.crumbs.home,
            item: new URL(homePath(input.locale), root).href,
          },
          { name: input.crumbs.podcast, item: podcastUrl },
          { name: input.title, item: pageUrl },
        ].map((crumb, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          ...crumb,
        })),
      },
      ...input.hosts.map(personNode),
      ...input.guests.map(personNode),
    ],
  };
}

// ---------------------------------------------------------------------------
// Catalog integrity (cross-file rules the per-file schemas cannot express)
// ---------------------------------------------------------------------------

export interface CatalogShape {
  /** Episode slug → its host slugs and guest slugs. */
  episodes: { slug: string; hosts: string[]; guests: string[] }[];
  /** `<slug>/<locale>` ids present. */
  notes: string[];
  /** Episode slugs that have a transcript. */
  transcripts: string[];
  guests: string[];
  hostRoster: string[];
  youtubeIds: string[];
}

/** Every problem with the catalog as a readable line; empty when it is sound. */
export function catalogProblems(catalog: CatalogShape): string[] {
  const problems: string[] = [];
  const notes = new Set(catalog.notes);
  const transcripts = new Set(catalog.transcripts);
  const guests = new Set(catalog.guests);
  const roster = new Set(catalog.hostRoster);
  const slugs = new Set(catalog.episodes.map((e) => e.slug));

  for (const episode of catalog.episodes) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(episode.slug)) {
      problems.push(
        `${episode.slug}: the folder name must be a lowercase slug`,
      );
    }
    for (const locale of LOCALES) {
      if (!notes.has(`${episode.slug}/${locale}`)) {
        problems.push(`${episode.slug}: missing ${locale}.md`);
      }
    }
    if (!transcripts.has(episode.slug)) {
      problems.push(`${episode.slug}: missing transcript.json`);
    }
    for (const host of episode.hosts) {
      if (!roster.has(host)) {
        problems.push(
          `${episode.slug}: host "${host}" is not in src/lib/team.ts`,
        );
      }
    }
    for (const guest of episode.guests) {
      if (!guests.has(guest)) {
        problems.push(
          `${episode.slug}: guest "${guest}" has no src/content/guests/${guest}.json`,
        );
      }
    }
  }
  for (const id of notes) {
    const slug = id.split('/')[0] ?? id;
    if (!slugs.has(slug)) problems.push(`${id}.md has no episode.json`);
  }
  const ids = catalog.youtubeIds;
  for (const id of new Set(ids.filter((id, i) => ids.indexOf(id) !== i))) {
    problems.push(`YouTube id ${id} is catalogued more than once`);
  }
  return problems;
}
