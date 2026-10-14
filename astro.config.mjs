import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';
import { thumbCache } from './plugins/thumb-cache.mjs';

// https://astro.build/config
export default defineConfig({
  site: 'https://discorgento.com',
  output: 'static',
  adapter: cloudflare({
    // Nothing in this project uses astro:assets, so the adapter's default
    // `cloudflare-binding` image service would only auto-provision a Cloudflare
    // Images binding that nothing ever calls. `passthrough` skips it.
    imageService: 'passthrough',
  }),
  // No sessions here. `false` keeps the adapter from auto-provisioning a KV
  // namespace and drops the session runtime from the Worker bundle.
  session: false,
  // Astro hashes the inline scripts it emits and ships the strict CSP as a
  // <meta http-equiv="content-security-policy"> on every page. This is the only
  // way to keep `server:defer` islands: their bootstrap script is inline and
  // its content ends with a per-page encrypted prop payload, so a static hash in
  // public/_headers can never match it. The meta walks the same tightrope a hash
  // in the header would, and the policy travels with the document no matter how
  // Cloudflare serves it.
  //
  // public/_headers still carries the non-script directives (frame-ancestors
  // cannot live in a meta tag) — see there for the split.
  security: {
    csp: {
      // Google Analytics (gtag.js) is the one third-party script the site may
      // load, and only after the visitor opts in — see CookieConsent.astro. The
      // resource list replaces Astro's defaults, so 'self' has to be repeated.
      // Astro still appends its own hashes to the directive (there is no
      // 'unsafe-inline' here), so the bundled and inline scripts keep working.
      scriptDirective: {
        resources: ["'self'", 'https://www.googletagmanager.com'],
      },
      styleDirective: {
        // The site ships static inline style attributes (e.g. `--i` on the logo
        // letters, the dialog positioners) — not element styles, which Astro
        // already hashes. `style-src-attr 'unsafe-inline'` keeps the attributes
        // working while the <style> elements stay hash-locked under
        // style-src-elem.
        resources: [
          { resource: "'self'", kind: 'element' },
          { resource: "'unsafe-inline'", kind: 'attribute' },
        ],
      },
    },
  },
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
