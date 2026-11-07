import type { APIRoute } from 'astro';
import { llmsIndex } from '~/lib/llms';
import { llmsEpisodes } from '~/lib/llms-data';

// https://llmstxt.org — the site map for language models, generated from the
// episode catalog at build time (replaces the old hand-written public/llms.txt).
export const GET: APIRoute = async () =>
  new Response(llmsIndex(await llmsEpisodes()), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
