// Type surface for the virtual module emitted by plugins/episode-index.mjs:
// the episode catalog reduced to what the request-time code needs.
declare module 'virtual:discorgento-episode-index' {
  export interface EpisodeIndexEntry {
    slug: string;
    youtubeId: string;
    number: number | null;
    /** ISO 8601 with offset. */
    published: string;
    /** Seconds. */
    duration: number;
    title: Record<'pt-BR' | 'en' | 'es', string>;
    /** The meta description of each locale's notes (the title if missing). */
    description: Record<'pt-BR' | 'en' | 'es', string>;
  }
  /** Newest first. */
  export const EPISODE_INDEX: EpisodeIndexEntry[];
}
