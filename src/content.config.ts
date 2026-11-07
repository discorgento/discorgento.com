// The episode catalog: one folder per episode under src/content/episodes/<slug>/.
//
//   episode.json      language-neutral facts: YouTube id, number, date, duration,
//                     localized title and chapters, host and guest references
//   pt-BR.md en.md es.md
//                     the editorial layer per locale: meta description, key
//                     points, FAQ in the frontmatter, the summary as the body
//   transcript.json   timestamped transcript in the spoken language
//
// Everything is validated here, so a malformed file fails `npm run build` (and
// `npm run check`) with the file and field instead of shipping a broken page.
// Rules that span files — every locale present, a transcript per episode — live
// in getEpisodes() (src/lib/episode-content.ts) and in test/episodes.test.mjs.
//
// The slug is the folder name and it is the same in every locale, which is what
// lets MainLayout derive the hreflang alternates from the path alone.

import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { LOCALES } from '~/lib/i18n';

const EPISODES = './src/content/episodes';

/** One string per locale, all required: the pages exist in all three. */
const localized = (max: number) =>
  z.object(
    Object.fromEntries(
      LOCALES.map((locale) => [locale, z.string().trim().min(1).max(max)]),
    ) as Record<(typeof LOCALES)[number], z.ZodString>,
  );

/** `<slug>/<file>` → `<slug>` (or `<slug>/<locale>` for the notes). */
const folderOf = (entry: string) => entry.split('/')[0] ?? entry;

const episodes = defineCollection({
  loader: glob({
    base: EPISODES,
    pattern: '*/episode.json',
    generateId: ({ entry }) => folderOf(entry),
  }),
  schema: z
    .object({
      youtubeId: z.string().regex(/^[\w-]{11}$/),
      /** null for videos outside the numbered series (tutorials, specials). */
      number: z.number().int().positive().nullable(),
      published: z.iso.datetime({ offset: true }),
      /** Seconds. */
      duration: z.number().int().positive(),
      /** The language spoken in the video, not the page language. */
      language: z.enum(LOCALES),
      title: localized(70),
      /** Slugs from src/lib/team.ts; checked against the roster in the tests. */
      hosts: z.array(z.string()).default([]),
      guests: z.array(reference('guests')).default([]),
      chapters: z
        .array(
          z.object({
            start: z.number().int().nonnegative(),
            title: localized(60),
          }),
        )
        .default([]),
    })
    .superRefine((episode, ctx) => {
      // Google's Clip markup rejects overlapping or out-of-range key moments,
      // and a chapter list that does not start at 0 leaves the intro unlabeled.
      const starts = episode.chapters.map((c) => c.start);
      if (starts.length && starts[0] !== 0) {
        ctx.addIssue({
          code: 'custom',
          path: ['chapters', 0, 'start'],
          message: 'the first chapter must start at 0',
        });
      }
      starts.forEach((start, i) => {
        const previous = starts[i - 1];
        if (previous !== undefined && start <= previous) {
          ctx.addIssue({
            code: 'custom',
            path: ['chapters', i, 'start'],
            message: 'chapter starts must be strictly increasing',
          });
        }
        if (start >= episode.duration) {
          ctx.addIssue({
            code: 'custom',
            path: ['chapters', i, 'start'],
            message: `chapter starts after the end of the video (${episode.duration}s)`,
          });
        }
      });
    }),
});

const episodeNotes = defineCollection({
  loader: glob({
    base: EPISODES,
    pattern: '*/{pt-BR,en,es}.md',
    // Keep the locale's case: the default id slugifies `pt-BR` to `pt-br`.
    generateId: ({ entry }) => entry.replace(/\.md$/, ''),
  }),
  schema: z.object({
    /** The meta description: short enough not to be truncated in results. */
    description: z.string().trim().min(50).max(160),
    keyPoints: z.array(z.string().trim().min(1)).min(3).max(8),
    faq: z
      .array(
        z.object({
          question: z.string().trim().min(1),
          answer: z.string().trim().min(1),
        }),
      )
      .min(2)
      .max(6),
  }),
});

const transcripts = defineCollection({
  loader: glob({
    base: EPISODES,
    pattern: '*/transcript.json',
    generateId: ({ entry }) => folderOf(entry),
  }),
  schema: z.object({
    /** Where the text came from; auto captions are labeled as such on the page. */
    source: z.enum(['youtube-auto-captions', 'manual']),
    language: z.enum(LOCALES),
    /** [start in seconds, text], in order. */
    segments: z
      .array(z.tuple([z.number().int().nonnegative(), z.string().min(1)]))
      .min(1),
  }),
});

const guests = defineCollection({
  loader: glob({ base: './src/content/guests', pattern: '*.json' }),
  schema: z.object({
    name: z.string().trim().min(1),
    role: localized(80).optional(),
    /** Public profiles, for Person.sameAs. Only links the guest published. */
    sameAs: z.array(z.url()).default([]),
  }),
});

export const collections = { episodes, episodeNotes, transcripts, guests };
