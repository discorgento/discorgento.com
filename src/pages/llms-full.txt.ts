import type { APIRoute } from 'astro';
import { llmsFull } from '~/lib/llms';
import { llmsEpisodes } from '~/lib/llms-data';

// Every episode's summary, key points and Q&A in one plain-text file, so an
// agent can read the whole archive in a single fetch instead of crawling pages.
export const GET: APIRoute = async () =>
  new Response(llmsFull(await llmsEpisodes()), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
