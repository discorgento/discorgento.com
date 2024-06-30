import { defineCollection, reference, z } from 'astro:content'

const blogContent = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    pubDate: z.date(),
    authors: z.array(reference('authors')),
    tags: z.array(z.string()),
  }),
})


const authors = defineCollection({
  type: 'data',
  schema: z.object({
    name: z.string(),
    portfolio: z.string().url(),
  })
});

export const collections = {
  blog: blogContent,
  authors
}
