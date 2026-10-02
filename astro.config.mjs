import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';
import { thumbCache } from './plugins/thumb-cache.mjs';

// https://astro.build/config
export default defineConfig({
  site: 'https://discorgento.com',
  output: 'static',
  adapter: cloudflare({
    platformProxy: {
      enabled: true,
    },
  }),
  i18n: {
    locales: ['pt-BR', 'en', 'es'],
    defaultLocale: 'pt-BR',
    routing: {
      prefixDefaultLocale: false,
    },
  },
  integrations: [
    // Emit xhtml:link hreflang alternates in the sitemap so crawlers see the
    // pt-BR/en/es editions as translations of one page, not three duplicates.
    sitemap({
      i18n: {
        defaultLocale: 'pt-BR',
        locales: { 'pt-BR': 'pt-BR', en: 'en', es: 'es' },
      },
    }),
  ],
  // Prefetch every internal link as it enters the viewport. `hover` (the
  // previous strategy) never fires on touch devices, so mobile got no prefetch
  // at all; `viewport` works everywhere and, with only a handful of static
  // pages, costs almost nothing.
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport',
  },
  // Ship the CSS inside each document instead of as three separate files.
  //
  // Lighthouse flags all three as render-blocking, and the number it quotes is
  // inflated — they sit adjacent in <head> and are fetched in parallel, so the
  // cost is one round-trip group, not three serial waits. But 18 kB brotli'd
  // across three files is small enough that inlining is close to free: the bytes
  // ride along in a request already on the critical path, so the transfer total
  // barely moves and the request count drops from four to one.
  //
  // The one real trade-off is that the CSS stops being cacheable on its own. With
  // seven routes sharing this layout that would matter, but there is no
  // ClientRouter here — every navigation is a full document load, which pulls the
  // HTML again regardless, so the CSS was never being reused between them.
  build: {
    inlineStylesheets: 'always',
  },
  vite: {
    plugins: [tailwindcss(), thumbCache()],
    // Keep assets as real files. Small inlined assets become `data:` URIs,
    // which the CSP in public/_headers blocks (no font-src), and small script
    // chunks get emitted as inline <script type="module">, which
    // `script-src 'self'` blocks — that kills all the page JS in production.
    build: { assetsInlineLimit: 0 },
  },
});
