import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Base is resolved relative to the build cwd — the Astro project is the repo
// root, so always run `npm run build` from the root.
// (import.meta.url does not work here: Astro rewrites the content.config.ts URL.)
// CI/monorepo note: if a pipeline builds from another folder, the glob resolves
// to a nonexistent directory and returns an empty collection SILENTLY.

const posts = defineCollection({
  loader: glob({
    pattern: '**/*.md',
    base: './src/content/posts',
  }),
  schema: z.object({
    title: z.string(),
    pubDate: z.coerce.date(),
    description: z.string().optional(),
    tags: z.array(z.string()).default([]),
    locale: z.enum(['pt-BR', 'en']).default('pt-BR'),
    draft: z.boolean().default(false),
    author: z.enum(['machado', 'mary', 'couto']).default('machado'),
  }),
});

const authors = defineCollection({
  loader: glob({
    pattern: '*.json',
    base: './src/content/authors',
  }),
  schema: z.object({
    name: z.string(),
    title: z.string().default('Magento Developer'),
    url: z.string().url(),
    avatar: z.string().url(),
  }),
});

export const collections = { posts, authors };
