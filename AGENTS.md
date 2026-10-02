# AGENTS.md

Discorgento community site (Brazilian Magento/tech community + podcast), built with **Astro 7 + Tailwind v4**. All active development happens in this repository root.

## Language rules

- **Code, comments, filenames, commit messages and docs (this file, README, etc.) must be in English.**
- **Exception — site content stays in Portuguese**: the `pt-BR` strings in `src/lib/i18n.ts` are the product itself (Brazilian community site). Never translate or "fix" them to English.
- UI copy that is hardcoded in components must be moved to `src/lib/i18n.ts` instead of being written inline.

## Commands

All commands run from the repo root.

- `npm install` — install deps
- `npm run dev:start` — start dev server in **background** (log in `.astro/dev.log`)
- `npm run dev:restart` — restart (kills current instance, starts fresh)
- `npm run dev:stop` — stop the dev server
- `npm run dev:status` — check if it's running (URL + PID)
- `npm run dev:logs` — view logs
- `npm run dev` — foreground dev server (Ctrl+C to stop)
- `npm run build` — production build to `dist/` (only meaningful verification). Safe to run with the dev server up: it stops the server, clears `node_modules/.vite`, builds, and restores the server exactly as it was.
- `npm run build -- --keep-server` — same, but leaves the dev server **down** on purpose
- `npm run build:raw` — bare `astro build`, no dev-server handling. Only for debugging the wrapper itself.

No lint, typecheck, or test commands exist. `npm run build` is the only meaningful verification.

> `build` is a wrapper (`scripts/build.mjs`), not `astro build`. Don't "simplify" it back — see the gotcha below for why the dance is necessary, and don't run `build:raw` locally while the dev server is up.

> Background mode relies on a lock file (`.astro/dev.json`). Servers started with `--ignore-lock` or via `nohup`/`setsid` are **not** tracked by `dev:stop`/`dev:status` — kill them by port (`lsof -ti :4321`).

### Build rules (for agents)

**The only build command to run is `npm run build`, and only when explicitly asked.** Do not "help" by building preemptively — it is the sole verification in this repo, which makes it also the one command whose cost matters.

- **Run `npm run build` as-is. Never pre-stop the dev server around it.** `build` is a wrapper (`scripts/build.mjs`) that stops the dev server, clears `node_modules/.vite`, builds, then restores the server exactly as it found it. Manually running `dev:stop` / `rm -rf node_modules/.vite` / `dev:start` on top of that is redundant and easy to get wrong.
- **Never run `npm run build:raw` locally.** That is the bare `astro build` and it carries the footgun in Key gotchas. It exists only to debug the wrapper itself, and even then only with the dev server down.
- **Never "simplify" `build` back to `astro build`**, and never edit `scripts/build.mjs` to drop the stop/restore handling, unless the user asks. The dance exists because the failure is silent: the build passes and only the dev server breaks.
- **Use `npm run build -- --keep-server` only when the user asked for the dev server to be left down.** Otherwise you leave their environment broken. If you did use it, run `npm run dev:start` afterwards and say so.
- **Always run it from the repo root.** `scripts/build.mjs` resolves paths against the process cwd, and `plugins/thumb-cache.mjs` reads `public/img/episodes` from it. From another folder the thumbnail cache silently comes back empty and every episode falls back to the remote YouTube CDN.
- **A passing build *is* the verification — report it and stop.** Do not follow it with extra probes, `dist/` archaeology, or a `wrangler deploy --dry-run` unless asked. If it fails, read the error instead of retrying variations.
- **Never run Wrangler**: `npx wrangler dev`, `wrangler dev`, `wrangler deploy --dry-run`, or any other workerd invocation, without explicit authorization. `wrangler dev` reads the *generated* `dist/client/wrangler.json`, not `wrangler.jsonc`, so it silently serves the last build against the wrong config and reports misleading status codes (a working build comes back as 404 on every route). It also starts a `workerd` process that outlives the shell, holds port 8788, and hangs the session.
- **To verify output locally, use the dev server** (`npm run dev:start` + browser) or inspect `dist/client/` directly.

## Architecture / content layout

- `astro.config.mjs` — Astro config: `output: 'static'`, Cloudflare adapter (Workers), i18n (`pt-BR` default with no prefix, `en` under `/en/`, `es` under `/es/`), Tailwind via `@tailwindcss/vite`, `thumbCache()`, sitemap with hreflang alternates.
- **There is no blog and no content collection.** `src/content/` and `content.config.ts` do not exist, and there is no Content Layer API, no `glob()` loader, and no `posts/[slug].astro` route. The 7 routes are static files listed below. Do not reintroduce Astro ≤5 content-layer patterns from memory — see Key gotchas.
- `src/pages/` — routes per locale, root = pt-BR, `en/` = English, `es/` = Español. Each file is hand-written; there is no dynamic route generation: `index.astro`, `podcast.astro`, `quem-faz.astro`, `404.astro`, and the same three under `en/` and `es/` (the 404 exists only for the default locale).
- `src/layouts/MainLayout.astro` — the only layout: html shell, skip link, navbar, footer, and all SEO (canonical, hreflang, Open Graph, Twitter card, JSON-LD `WebSite` + `Organization` in one `@graph`).
- `src/components/` — `Home.astro` (full home, shared by pt/en, ~2000 lines of scoped fanzine CSS), `Episodes`, `Navbar`, `Footer`, `TeamPage` (the `/quem-faz/` page for both locales), `YouTubeStamp`.
- `src/lib/i18n.ts` — UI strings per locale (`pt-BR`, `en`, `es`) + `useTranslations(locale)`, plus `LOCALE_META` (language-switcher labels), `stripLocale` (drop the `/en` or `/es` prefix) and `intlLocale` (`Intl` tag per locale).
- `src/lib/youtube.ts` — channel RSS fetch at build (`getLatestVideos`, `episodeNum`, `formatEpDate`, `thumb`); on failure it degrades to the committed snapshot in `src/data/episodes.json`. `thumb()` returns a self-hosted path for ids present in `CACHED_THUMBS` and the remote `i.ytimg.com` URL otherwise.
- `plugins/thumb-cache.mjs` — Vite plugin emitting `virtual:discorgento-thumb-cache` with the ids cached under `public/img/episodes/`. Exists because page code cannot read the filesystem during prerender.
- `scripts/sync-thumbs.mjs` — `npm run thumbs:sync`; downloads the missing episode thumbnails. Only `mqdefault` (320x180) and `maxresdefault` (1280x720) are genuinely 16:9 on YouTube — `hqdefault` (480x360) and `sddefault` (640x480) are 4:3 and lose a quarter of the frame to the 16:9 `object-fit`. So every episode gets 320 and 1280, and the 640 is **derived** from the 1280 with sharp rather than downloaded. Each JPEG tier is then re-encoded to WebP (quality 78, effort 5), cutting the 1280 covers from 133–159 kB to 72–107 kB. Page `srcset` picks between the three; the WebP goes in a `<picture>` `<source>` and the JPEG stays in the `<img>` as fallback.
- `scripts/gen-og.mjs` — `npm run og:generate`; builds `public/img/og.jpg`, the 1200x630 social card. Run it after changing the palette, the logo or the wordmark.
- `src/lib/substack.ts` — `getLatestSubstackPosts`, same build-time fetch with the same silent degradation.
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
- **The filesystem is not readable from page code at build time.** With the Cloudflare adapter, prerendering runs inside workerd, where `process.cwd()` is `/bundle`, `import.meta.dirname` is `undefined`, and `import.meta.url` is rewritten to a site URL. Never use `existsSync` in an `.astro` file or `src/lib` to decide on-disk state — it silently always misses and you ship the fallback path. Read the disk in a Vite plugin instead (see `plugins/thumb-cache.mjs`), which runs in real Node.
- **After publishing an episode, run `npm run thumbs:sync`** and commit the new files. The site does not depend on it — `thumb()` in `src/lib/youtube.ts` falls back to the YouTube CDN for any id missing from the cache — but without it that episode's cover costs an extra cross-origin request on the LCP path.
- **Never run `npm run build:raw` while the background dev server is running.** The plain `npm run build` handles this for you (stop → clear `node_modules/.vite` → build → restore); only the raw form still carries the footgun. Root cause: dev server and build share `node_modules/.vite`, and the Cloudflare adapter's SSR dep-optimizer cache (`deps_ssr`) is re-optimized by the build. The running workerd runner then points at a deleted `@astrojs_cloudflare_entrypoints_server.js?v=<hash>` and every request returns 500 ("The file does not exist at … which is in the optimize deps directory"), while the production build itself still passes.
- `wrangler.toml` (local, legacy) and `.wrangler/` are in `.gitignore` — they may contain sensitive account_id/IDs. Versioned configs are `wrangler.jsonc` (production) and `wrangler.staging.jsonc` (staging) — both without secrets. If one exists locally, delete `wrangler.toml` so it doesn't conflict with the versioned configs.

## Deploy

- **Fully automated via GitHub Actions** — `.github/workflows/deploy.yml`:
  - `build` job runs on every push/PR (gate: `npm run build`).
  - `deploy` job runs on push to `main` only, via `cloudflare/wrangler-action@v3` (`wrangler deploy --config wrangler.jsonc`) — production Worker `discorgento` (first deploy creates it; then attach the `discorgento.com` custom domain).
  - `deploy-staging` job runs on push to `develop` only, via `wrangler deploy --config wrangler.staging.jsonc` — staging Worker `staging`, served at `staging.jonatanaxe.workers.dev`.
  - Requires two repo secrets: `CLOUDFLARE_API_TOKEN` (scoped: Workers Scripts Edit, Workers Routes Edit) and `CLOUDFLARE_ACCOUNT_ID`. Never use a full-account token. Trigger `workflow_dispatch` for manual deploys.
- **`wrangler.jsonc` is versioned** (static assets pointing at `dist/client`, `not_found_handling: 404-page`, no `account_id` inside — the action injects it via the `accountId` secret). The Worker `name` must match the existing Worker in the dashboard; a mismatch creates a duplicate Worker.
- **Cloudflare Git integration (Workers Builds) must stay disconnected** — it historically deployed alongside CI and conflicted with the GitHub Actions pipeline. CI owns the deploys now.
- **Dependabot** (`.github/dependabot.yml`) opens weekly PRs for `npm` and `github-actions`; security updates are automatic.
- Before a deploy, validate locally (no auth needed): `npm run build && npx wrangler deploy --dry-run`.
- `public/robots.txt` already allows AI crawlers explicitly (GPTBot, ClaudeBot, PerplexityBot, etc.) — **Cloudflare blocks AI by default** ("AI Crawlers"); if you touch robots.txt, keep the `Allow` lines or the AI-ready work dies at the firewall.