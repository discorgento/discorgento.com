// Stand-in for the `virtual:discorgento-thumb-cache` module (see test/setup.mjs).
// `full` has every tier in every format; `partial` is missing the 1024 WebP and
// all AVIF, to exercise the all-or-nothing srcset rule.
export const CACHED_THUMBS = {
  full: [320, 640, 1024, 1280],
  partial: [320, 640, 1024, 1280],
};
export const WEBP_THUMBS = {
  full: [320, 640, 1024, 1280],
  partial: [320, 640, 1280],
};
export const AVIF_THUMBS = {
  full: [320, 640, 1024, 1280],
};
export const THUMB_VERSION = 'test';
