// Type surface for the virtual module emitted by plugins/thumb-cache.mjs.
// Maps a YouTube video id to the thumbnail sizes we have committed under
// public/img/episodes/.
  declare module 'virtual:discorgento-thumb-cache' {
    export const CACHED_THUMBS: Record<string, number[]>;
    export const WEBP_THUMBS: Record<string, number[]>;
    export const AVIF_THUMBS: Record<string, number[]>;
  }
