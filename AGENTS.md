# AGENTS.md

Discorgento community site (Brazilian Magento/tech community + podcast), built with **Astro 7 + Tailwind v4**. All active development happens in this repository root.

## Language rules

- **Code, comments, filenames, commit messages and docs (this file, README, etc.) must be in English.**
- **Exception — site content stays in Portuguese**: the `pt-BR` strings in `src/lib/i18n.ts` are the product itself (Brazilian community site). Never translate or "fix" them to English.
- UI copy that is hardcoded in components must be moved to `src/lib/i18n.ts` instead of being written inline.

## Commands

All commands run from the repo root.

- `npm install` — install deps
- `npm run dev` — foreground dev server (Ctrl+C to stop)
- `npm run dev:start` — start dev server in **background** (log in `.astro/dev.log`)
- `npm run dev:stop` — stop the dev server
- `npm run dev:reset` — full clean cycle in one command: stop the old server, clear `node_modules/.vite`, production-build, start a fresh server. Use it when the dev server has gone stale.
- `npm run build` — production build to `dist/` (only meaningful verification). Safe to run with the dev server up: it stops the server, clears `node_modules/.vite`, builds, and restores the server exactly as it was. As pre-build steps it also regenerates `public/img/og.jpg` and syncs any missing episode thumbnails (both best-effort — see Architecture).
- `npm run build -- --keep-server` — same, but leaves the dev server **down** on purpose

No lint, typecheck, or test commands exist. `npm run build` is the only meaningful verification.

> `build` is a wrapper (`scripts/build.mjs`), not `astro build`. Don't "simplify" it back — see the gotcha below for why the dance is necessary, and never run bare `astro build` locally while the dev server is up.

> Background mode relies on a lock file (`.astro/dev.json`). Servers started with `--ignore-lock` or via `nohup`/`setsid` are **not** tracked by `dev:stop` — kill them by port (`lsof -ti :4321`). For the rarer status/logs check there is no npm alias: run `npx astro dev status` / `npx astro dev logs`.

### Full clean cycle (tear everything down, rebuild, start fresh)

When the dev server has gone stale (env changes, odd HMR, "it works in the browser but not in the build"), reset from zero with one command, run from the repo root:

```bash
npm run dev:reset
```

It is a two-step chain, and `scripts/build.mjs` does the teardown for you:

1. `npm run build -- --keep-server` — stops the tracked dev server, clears `node_modules/.vite`, runs the full production build, and **leaves the server down** on purpose. This is the only step that compiles anything.
2. `npm run dev:start` — brings up exactly one fresh background instance. Confirm the new PID and URL with `npx astro dev status`.

`build.mjs` already calls `astro dev stop` before building, so an explicit `dev:stop` first is redundant; the `--keep-server` flag is what keeps the build from restoring the server it just stopped, which is the *opposite* of what a reset wants. The one gap: a server started outside the lock file (via `nohup`/`setsid`) is invisible to `dev:stop` — kill it by port first with `lsof -ti :4321 | xargs -r kill`.

For an ordinary check this is **not** needed: `npm run build` alone already stops the server, clears the cache, builds, and restores it. Reach for `dev:reset` only to deliberately start over.

### Build rules (for agents)

**The only build command to run is `npm run build`, and only when explicitly asked.** Do not "help" by building preemptively — it is the sole verification in this repo, which makes it also the one command whose cost matters.

- **Run `npm run build` as-is. Never pre-stop the dev server around it.** `build` is a wrapper (`scripts/build.mjs`) that stops the dev server, clears `node_modules/.vite`, builds, then restores the server exactly as it found it. Manually running `dev:stop` / `rm -rf node_modules/.vite` / `dev:start` on top of that is redundant and easy to get wrong.
- **Never run bare `astro build` locally.** There is no npm script for it on purpose — it carries the footgun in Key gotchas.
- **Never "simplify" `build` back to `astro build`**, and never edit `scripts/build.mjs` to drop the stop/restore handling, unless the user asks. The dance exists because the failure is silent: the build passes and only the dev server breaks.
- **Use `npm run build -- --keep-server` only when the user asked for the dev server to be left down.** Otherwise you leave their environment broken. If you did use it, run `npm run dev:start` afterwards and say so.
- **Always run it from the repo root.** `scripts/build.mjs` resolves paths against the process cwd, and `plugins/thumb-cache.mjs` reads `public/img/episodes` from it. From another folder the thumbnail cache silently comes back empty and every episode falls back to the remote YouTube CDN.
- **A passing build *is* the verification — report it and stop.** Do not follow it with extra probes, `dist/` archaeology, or a `wrangler deploy --dry-run` unless asked. If it fails, read the error instead of retrying variations.
- **Never run Wrangler**: `npx wrangler dev`, `wrangler dev`, `wrangler deploy --dry-run`, or any other workerd invocation, without explicit authorization. `wrangler dev` reads the *generated* `dist/client/wrangler.json`, not `wrangler.jsonc`, so it silently serves the last build against the wrong config and reports misleading status codes (a working build comes back as 404 on every route). It also starts a `workerd` process that outlives the shell, holds port 8788, and hangs the session.
- **To verify output locally, use the dev server** (`npm run dev:start` + browser) or inspect `dist/client/` directly.

## Architecture / content layout

- `astro.config.mjs` — Astro config: `output: 'static'`, Cloudflare adapter (Workers), i18n (`pt-BR` default with no prefix, `en` under `/en/`, `es` under `/es/`), Tailwind via `@tailwindcss/vite`, `thumbCache()`, sitemap with hreflang alternates. The adapter is configured with `imageService: 'passthrough'` and top-level `session: false` on purpose: nothing here uses astro:assets or sessions, and the defaults would auto-provision a Cloudflare Images binding and a KV namespace on every deploy for features the Worker never calls. `security.csp` makes Astro emit the strict script/style policy as a per-page `<meta http-equiv="content-security-policy">` with hashes of the inline scripts it injects (the `server:defer` island bootstrap cannot carry a static hash — its content ends with a per-page encrypted prop payload). `public/_headers` keeps the directives that can't live in a meta tag; see the Deploy section for the split.
- **There is no blog and no content collection.** `src/content/` and `content.config.ts` do not exist, and there is no Content Layer API, no `glob()` loader, and no `posts/[slug].astro` route. The 7 routes are static files listed below. Do not reintroduce Astro ≤5 content-layer patterns from memory — see Key gotchas.
- `src/pages/` — routes per locale, root = pt-BR, `en/` = English, `es/` = Español. Each file is hand-written; there is no dynamic route generation: `index.astro`, `podcast.astro`, `quem-faz.astro`, `404.astro`, and the same three under `en/` and `es/` (the 404 exists only for the default locale).
- `src/layouts/MainLayout.astro` — the only layout: html shell, skip link, navbar, footer, and all SEO (canonical, hreflang, Open Graph, Twitter card, JSON-LD `WebSite` + `Organization` in one `@graph`).
- `src/components/` — `Home.astro` (full home, shared by pt/en, ~2000 lines of scoped fanzine CSS), `Episodes`, `Navbar`, `Footer`, `TeamPage` (the `/quem-faz/` page for both locales), `YouTubeStamp`, and `LatestEdition.astro` (the Substack server island — see below).
- `src/components/LatestEdition.astro` — the only `server:defer` island: the "última edição" card, rendered on every request instead of at build, so a post published on Substack shows up without a redeploy. It takes **no props**, so its URL is byte-identical for every locale; the locale is recovered from the `Referer` header (full URL on a same-origin request under our `Referrer-Policy`) and the response is sent `Cache-Control: no-store` so a cached copy can't leak the pt-BR card to `/en/` and `/es/`. The `<a class="edition" slot="fallback">` in `Home.astro` is the build-time stand-in swapped out once the island arrives. Because that markup lives in two components, its CSS is in `global.css`, not scoped to `Home.astro`.
- `src/lib/i18n.ts` — UI strings per locale (`pt-BR`, `en`, `es`) + `useTranslations(locale)`, plus `LOCALE_META` (language-switcher labels), `stripLocale` (drop the `/en` or `/es` prefix) and `intlLocale` (`Intl` tag per locale).
- `src/lib/youtube.ts` — channel RSS fetch at build (`getLatestVideos`, `episodeNum`, `formatEpDate`, `thumb`); on failure it degrades to the committed snapshot in `src/data/episodes.json`. `thumb()` returns a self-hosted path for ids present in `CACHED_THUMBS` and the remote `i.ytimg.com` URL otherwise.
- `plugins/thumb-cache.mjs` — Vite plugin emitting `virtual:discorgento-thumb-cache` with the ids cached under `public/img/episodes/`. Exists because page code cannot read the filesystem during prerender.
- `scripts/sync-thumbs.mjs` — runs automatically as a pre-build step inside `npm run build` (no npm alias anymore); downloads the missing episode thumbnails. Only `mqdefault` (320x180) and `maxresdefault` (1280x720) are genuinely 16:9 on YouTube — `hqdefault` (480x360) and `sddefault` (640x480) are 4:3 and lose a quarter of the frame to the 16:9 `object-fit`. So every episode gets 320 and 1280 downloaded, and the **640 and 1024 are derived** from the 1280 with sharp rather than downloaded. The 1024 exists for the cover on a phone: a 346 CSS px slot at DPR 2.625 needs 908 real px, so without it the browser jumps 640→1280 and pulls 41% more pixels than the screen can show. Each JPEG tier is then re-encoded to WebP (quality 78, effort 5), cutting the 1280 covers from 133–159 kB to 72–107 kB. Page `srcset` picks between the tiers; the WebP goes in a `<picture>` `<source>` and the JPEG stays in the `<img>` as fallback.
- `scripts/gen-og.mjs` — runs automatically as a pre-build step inside `npm run build` (no npm alias anymore); builds `public/img/og.jpg`, the 1200x630 social card. Regenerates on every build (deterministic, so it stays byte-identical); it only meaningfully changes after a palette, logo or wordmark change.
- `src/lib/substack.ts` — `getLatestSubstackPosts`, the Substack feed fetch. It runs **at request time**, not at build: it is called from the `LatestEdition` server island (see below), retries three times with backoff, edge-caches the feed via `cf.cacheTtl` (1800s), and degrades to `[]`. There is no committed snapshot — the "última edição" block is live.
- `src/lib/discord.ts` — `getDiscordStats`, community member count for the home page.
- `src/lib/team.ts` — `team` / `getTeam`, the host roster behind `TeamPage`. A host photo is used at two sizes, so the byline asks for less. GitHub avatars are resized server-side, so `photoSrcset` rewrites `?s=400` to offer `?s=96` as well; a local photo in `public/time/` cannot be rewritten and needs a real small copy named `<slug>-96.<ext>`, which the resolver picks up. The `<slug>-96.` suffix cannot shadow the main `<slug>.` photo. Keep the small copy JPEG, not WebP — it is referenced from a bare `srcset` with no `<picture>`, so there is no fallback if a browser rejects the format.
- `src/data/episodes.json` — curated episode metadata (id, title, published, url), used as the fallback when the YouTube fetch yields nothing. It lags the live feed: refresh it when publishing so the fallback stays current.
- `src/styles/global.css` — Tailwind v4 CSS-first: `@import "tailwindcss"` + `@plugin "@tailwindcss/typography"` + `@theme` (colors `--color-brand-*`, `--color-background`, etc. — **no `tailwind.config.js`**). Also holds the component classes that aren't Tailwind utilities: `.skip-link`, `.read-progress`, `.eyebrow`.

## Key gotchas

- **Default locale is `pt-BR`, content is in Portuguese.** Keep new UI copy in Brazilian Portuguese (site content exception — see Language rules). Locale folders must match `i18n.locales` exactly (`pt-BR`, `en`, `es`).
- **Astro 7 + Tailwind v4 — do not follow old tutorials (≤ Astro 5 / Tailwind v3).** Content Layer API (`content.config.ts` at root, `glob()` loader, `z` from `astro/zod`) and CSS-first Tailwind (`@theme`, no `tailwind.config.js`) changed everything.
- **`@tailwindcss/vite` ≥ 4.2.2 is required** with Vite 8 (Astro 7). Old versions break the build.
- **Frontmatter YAML:** colons (`:`) in values break the build — quote them (e.g. `description: "texto: com dois pontos"`).
- **All three editions exist for every route** — `pt-BR` (root), `en/` and `es/`. The language switcher is derived from `LOCALES` and `LOCALE_META` in `src/lib/i18n.ts`; never hardcode a pair of locales in a component. There is no per-post translation logic because there are no posts.
- **Deps with build scripts** (`esbuild`, `workerd`) need `allowScripts` in `package.json` (already configured).
- **Imports use the `~/` alias** (defined in `tsconfig.json` → `./src/*`) — never use relative `../`/`../../`.
- **The Worker entrypoint is `@astrojs/cloudflare/entrypoints/server`, not a built file.** Astro 6+ routes `astro dev`, `astro preview` and the production deploy through one unified Cloudflare entrypoint, declared as `main` in `wrangler.jsonc`. Never point `main` at `dist/server/entry.mjs` — that is the Astro ≤5 shape. The adapter still emits that file internally, but `main` must stay on the package entrypoint or dev and production diverge. Same for the removed `platformProxy` adapter option: it no longer exists in v14, dev runs in workerd natively.
- **The filesystem is not readable from page code at build time.** With the Cloudflare adapter, prerendering runs inside workerd, where `process.cwd()` is `/bundle`, `import.meta.dirname` is `undefined`, and `import.meta.url` is rewritten to a site URL. Never use `existsSync` in an `.astro` file or `src/lib` to decide on-disk state — it silently always misses and you ship the fallback path. Read the disk in a Vite plugin instead (see `plugins/thumb-cache.mjs`), which runs in real Node.
- **The thumbnail tiers are derived from the filenames, not hardcoded.** `plugins/thumb-cache.mjs` matches `/^(.+)-(\d+)\.jpg$/` rather than listing `(320|640|1024|1280)`. A hardcoded alternation silently breaks when a tier is added: `webpSrcset()` goes null, and every `<source>` vanishes from the built page — which reads as a WebP regression instead of a stale regex. The sizes the site can actually request are the `ThumbSize` union in `src/lib/youtube.ts`, which is the single source of truth; an unexpected width on disk is inert.
- **`sizes` must state the slot's real width, never `100vw`.** `srcset` selection is `sizes × devicePixelRatio`, so an overestimate crosses a tier threshold and the new tier becomes unreachable while still looking correct in the markup. The cover measures 347 CSS px in a 412 px viewport — the gutter and the `object-fit` frame are not free — and `100vw` at DPR 2.625 asks for 1081 px, which skips the 1024 tier entirely and lands on 1280. Hence `84vw` on the cover and `90vw` on the podcast card. Re-measure the rendered width in the browser after changing a gutter; do not trust the arithmetic. A `sizes` value cannot be verified by watching `currentSrc` in a long-lived devtools session either — repeated `deviceScaleFactor` emulation changes leave `srcset` selection returning the largest candidate for every input, so confirm against a fresh Lighthouse run in production instead.
- **After publishing an episode, nothing to run.** `npm run build` syncs the new cover into `public/img/episodes/` automatically (the skip-if-present guard keeps it cheap), and the freshly generated files ship inside `dist/client` — so the self-hosted thumb arrives with the next deploy, no manual step. The site does not depend on it though: `thumb()` in `src/lib/youtube.ts` falls back to the YouTube CDN for any id missing from the cache, and uncommitted synced files still end up in the build because they land in `public/` before Astro copies it.
- **Never run bare `astro build` while the background dev server is running.** `npm run build` handles this for you (stop → clear `node_modules/.vite` → build → restore); only the raw form still carries the footgun. Root cause: dev server and build share `node_modules/.vite`, and the Cloudflare adapter's SSR dep-optimizer cache (`deps_ssr`) is re-optimized by the build. The running workerd runner then points at a deleted `@astrojs_cloudflare_entrypoints_server.js?v=<hash>` and every request returns 500 ("The file does not exist at … which is in the optimize deps directory"), while the production build itself still passes.
- `wrangler.toml` (local, legacy) and `.wrangler/` are in `.gitignore` — they may contain sensitive account_id/IDs. Versioned configs are `wrangler.jsonc` (production) and `wrangler.staging.jsonc` (staging) — both without secrets. If one exists locally, delete `wrangler.toml` so it doesn't conflict with the versioned configs.

## Deploy

- **Fully automated via GitHub Actions** — `.github/workflows/deploy.yml`:
  - `build` job runs on every push/PR (gate: `npm run build`).
  - `deploy` job runs on push to `main` only, via `cloudflare/wrangler-action@v3` (`wrangler deploy --config wrangler.jsonc`) — production Worker `discorgento` (first deploy creates it; then attach the `discorgento.com` custom domain).
  - `deploy-staging` job runs on push to `develop` only, via `wrangler deploy --config wrangler.staging.jsonc` — staging Worker `staging`, served at `staging.jonatanaxe.workers.dev`.
  - Requires two repo secrets: `CLOUDFLARE_API_TOKEN` (scoped: Workers Scripts Edit, Workers Routes Edit) and `CLOUDFLARE_ACCOUNT_ID`. Never use a full-account token. Trigger `workflow_dispatch` for manual deploys.
- **The deploy ships a Worker, not just assets** — since the `LatestEdition` server island, `wrangler.jsonc` declares `main: "@astrojs/cloudflare/entrypoints/server"` (the Astro 6+ unified entrypoint, see gotchas) plus `assets.binding: ASSETS` for `dist/client`. `compatibility_flags` are `["nodejs_compat", "global_fetch_strictly_public"]`. Keep the `main` on the package entrypoint — do not point it at `dist/server/entry.mjs`.
- **`wrangler.jsonc` is versioned** (assets pointing at `dist/client`, `not_found_handling: 404-page`, `html_handling: auto-trailing-slash`, no `account_id` inside — the action injects it via the `accountId` secret). The Worker `name` must match the existing Worker in the dashboard; a mismatch creates a duplicate Worker.
- **Cloudflare Git integration (Workers Builds) must stay disconnected** — it historically deployed alongside CI and conflicted with the GitHub Actions pipeline. CI owns the deploys now.
- **A strict CSP is deliberate, but it is now split across two places.** Scripts and styles are enforced by Astro's `security.csp` — per-page `<meta>` CSP whose `script-src`/`style-src-elem` carry SHA-256 hashes of exactly the inline scripts/styles Astro emitted (that is the only way the `server:defer` island works), plus `style-src-attr 'unsafe-inline'` for the static `style="--i:..."` attributes on the logo and dialog. `public/_headers` carries the directives a meta tag cannot express (`frame-ancestors 'none'`) and the rest of the resource policy (`img-src`, `frame-src`, `connect-src`, `font-src`, `object-src 'none'`, etc.). Because the meta is per-document, do not expect the `_headers` CSP to list script sources — that moved to Astro. `script-src 'self'` with no third-party origins is what makes analytics a decision rather than an accident: Cloudflare injects `static.cloudflareinsights.com/beacon.min.js` into every page and the policy blocks it, so `beacon.min.js` in the console is the policy working, not a bug to fix. Web Analytics is switched off at the zone level and RUM is switched off with it; the site collects nothing.
- **Do not "fix" the beacon CSP error by whitelisting `cloudflareinsights.com`.** If analytics is ever wanted, that is a product decision to make deliberately (it means editing the meta `script-src` *and* the header `connect-src`, and the dashboard toggle is not enough on its own — a CSP-stripped beacon just makes Cloudflare report zero page views, which reads as a broken dashboard rather than a blocked script). Either change both or neither.
- **`style-src-attr 'unsafe-inline'` is scoped, not blanket.** Astro `security.csp` hash-locks the inline `<style>` elements under `style-src-elem` (all 82 kB of CSS land in each document via `build.inlineStylesheets: 'always'`, and removing the hash would blank the site) while only inline style *attributes* fall back to `'unsafe-inline'` for the logo letter positions and the dialog. No `'unsafe-inline'` exists in `script-src` anywhere, in either the meta or the header.
- **Dependabot** (`.github/dependabot.yml`) opens weekly PRs for `npm` and `github-actions`; security updates are automatic.
- Before a deploy, validate locally (no auth needed): `npm run build && npx wrangler deploy --dry-run`.
- `public/robots.txt` already allows AI crawlers explicitly (GPTBot, ClaudeBot, PerplexityBot, etc.) — **Cloudflare blocks AI by default** ("AI Crawlers"); if you touch robots.txt, keep the `Allow` lines or the AI-ready work dies at the firewall.