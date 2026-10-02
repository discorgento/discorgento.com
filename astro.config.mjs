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
  // Ship the CSS inside each document instead of as three separate files.
  //
  // Lighthouse flags all three as render-blocking, and the number it quotes is
  // inflated — they sit adjacent in <head> and are fetched in parallel, so the
  // cost is one round-trip group, not three serial waits. But 18 kB brotli'd
  // across three files is small enough that inlining is close to free: the bytes
  // ride along in a request already on the critical path, so the transfer total
  // barely moves and the request count drops from four to one.
  //
  // This was a bad trade while <ClientRouter /> was in use, and is a good one now
  // that it is gone. A client-side navigation re-fetched the destination's HTML,
  // which then carried 82 kB of inline CSS instead of a cached stylesheet link —
  // so inlining won on the first document load and lost on every one after it.
  // With plain full-page navigation the CSS rides along in the document that page
  // needs anyway, and nothing is fetched twice. Do not reintroduce a client router
  // without re-reading the "critical request chains" audit; that is what made this
  // decision flip.
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
