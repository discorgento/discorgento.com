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
  vite: {
    plugins: [tailwindcss(), thumbCache()],
    // Keep assets as real files. Small inlined assets become `data:` URIs,
    // which the CSP in public/_headers blocks (no font-src), and small script
    // chunks get emitted as inline <script type="module">, which
    // `script-src 'self'` blocks — that kills all the page JS in production.
    build: { assetsInlineLimit: 0 },
  },
});
