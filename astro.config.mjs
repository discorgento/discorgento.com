import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';

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
    locales: ['pt-BR', 'en'],
    defaultLocale: 'pt-BR',
    routing: {
      prefixDefaultLocale: false,
    },
  },
  integrations: [sitemap()],
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover',
  },
  vite: {
    plugins: [tailwindcss()],
    // Keep assets as real files. Small inlined assets become `data:` URIs,
    // which the CSP in public/_headers blocks (no font-src), and small script
    // chunks get emitted as inline <script type="module">, which
    // `script-src 'self'` blocks — that kills all the page JS in production.
    build: { assetsInlineLimit: 0 },
  },
});
