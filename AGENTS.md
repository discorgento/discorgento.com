# AGENTS.md

Discorgento community site (Brazilian Magento/tech community + podcast), built with **Astro 7 + Tailwind v4**. All active development happens in this repository root.

## Language rules

- **Code, comments, filenames, commit messages and docs (this file, README, etc.) must be in English.**
- **Exception — site content stays in Portuguese**: blog posts under `src/content/posts/pt-br/*.md` and the `pt-BR` strings in `src/lib/i18n.ts` are the product itself (Brazilian community site). Never translate or "fix" them to English.
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
- `npm run build` — production build to `dist/` (only meaningful verification)

No lint, typecheck, or test commands exist. `npm run build` is the only meaningful verification.

> Background mode relies on a lock file (`.astro/dev.json`). Servers started with `--ignore-lock` or via `nohup`/`setsid` are **not** tracked by `dev:stop`/`dev:status` — kill them by port (`lsof -ti :4321`).

## Architecture / content layout

- `astro.config.mjs` — Astro config: `output: 'static'`, Cloudflare adapter (Workers), i18n (`pt-BR` default with no prefix, `en` with `/en/` prefix), Tailwind via `@tailwindcss/vite`, sitemap.
- `src/content/posts/{pt-br,en}/*.md` — blog posts. Frontmatter: `title`, `pubDate`, `description`, `tags`, `locale`, `author`, `draft`. Slug = filename.
- `src/content/authors/*.json` — authors (`machado`, `mary`, `couto`).
- `src/content.config.ts` — Astro 7 Content Layer API: `defineCollection` + `glob` loader + Zod schema. **Imports come from `astro:content` / `astro/loaders` / `astro/zod`** (don't confuse: `defineCollection` from `astro:content`, `z` from `astro/zod`).
- `src/pages/` — routes per locale: root = pt-BR, `en/` = English. `posts/[slug].astro` dynamic via `getStaticPaths`; `404.astro` at root.
- `src/layouts/` — `MainLayout.astro` (html/navbar/footer/SEO: canonical, Open Graph, Twitter card, JSON-LD WebSite), `PostLayout.astro` (markdown render + author + translation button + JSON-LD Article).
- `src/components/` — `Home.astro` (full home, shared by pt/en), `ArticleCard`, `Episodes`, `Navbar`, `Footer`.
- `src/lib/i18n.ts` — UI strings per locale + `useTranslations(locale)` helper.
- `src/lib/youtube.ts` — channel RSS feed fetch at build (`getLatestVideos`, `episodeNum`, `formatEpDate`); on failure it degrades to `[]` silently.
- `src/styles/global.css` — Tailwind v4 CSS-first: `@import "tailwindcss"` + `@plugin "@tailwindcss/typography"` + `@theme` (colors `--color-primary`, etc. — **no `tailwind.config.js`**).

## Key gotchas

- **Default locale is `pt-BR`, content is in Portuguese.** Keep new blog prose in Brazilian Portuguese (site content exception — see Language rules). Locale folders must match `i18n.locales` exactly (`pt-BR`, `en`).
- **Astro 7 + Tailwind v4 — do not follow old tutorials (≤ Astro 5 / Tailwind v3).** Content Layer API (`content.config.ts` at root, `glob()` loader, `z` from `astro/zod`) and CSS-first Tailwind (`@theme`, no `tailwind.config.js`) changed everything.
- **`@tailwindcss/vite` ≥ 4.2.2 is required** with Vite 8 (Astro 7). Old versions break the build.
- **Frontmatter YAML:** colons (`:`) in values break the build — quote them (e.g. `description: "texto: com dois pontos"`).
- **English posts exist** (`src/content/posts/en/*.md`) — all posts have translations; the translation button only shows when the post exists in the other locale (same slug).
- **Deps with build scripts** (`esbuild`, `workerd`) need `allowScripts` in `package.json` (already configured).
- **Imports use the `~/` alias** (defined in `tsconfig.json` → `./src/*`) — never use relative `../`/`../../`.
- **Always run `npm run build` from the repo root.** The content layer `glob()` resolves `base` relative to the build cwd — if a CI/monorepo builds from another folder, it resolves to a nonexistent directory and returns an empty collection **silently** (build "passes", site ships without posts). `import.meta.url` is not an alternative: Astro rewrites the `content.config.ts` URL.
- `wrangler.toml` (local, legacy) and `.wrangler/` are in `.gitignore` — they may contain sensitive account_id/IDs. Deploy is Cloudflare **Pages**, which needs no wrangler config file. If a local `wrangler.toml` exists, delete it so it doesn't override the pipeline.

## Deploy

- **Fully automated via GitHub Actions** — `.github/workflows/deploy.yml`:
  - `build` job runs on every push/PR (gate: `npm run build`).
  - `deploy` job runs on push to `main` only: `wrangler pages deploy dist/client --project-name=discorgento-com` — the existing Pages project that serves the `discorgento.com` domain.
  - `deploy-staging` job runs on push to `develop` only: creates the Pages project `staging` (idempotent) and deploys to it — URL `staging.pages.dev`.
  - Requires two repo secrets: `CLOUDFLARE_API_TOKEN` (scoped: Workers Scripts Edit, Workers Routes Edit — Pages deploys use the same token) and `CLOUDFLARE_ACCOUNT_ID`. Never use a full-account token. Trigger `workflow_dispatch` for manual deploys.
- **Cloudflare Git integration must be disconnected**: the Pages project was historically connected to the repo (Workers Builds), which conflicts with the GitHub Actions pipeline. Disconnect it in the dashboard, then let Actions own the deploys.
- **Dependabot** (`.github/dependabot.yml`) opens weekly PRs for `npm` and `github-actions`; security updates are automatic.
- Before a deploy, validate locally (no auth needed): `npm run build` (there is no `--dry-run` for `wrangler pages deploy`).
- `public/robots.txt` already allows AI crawlers explicitly (GPTBot, ClaudeBot, PerplexityBot, etc.) — **Cloudflare blocks AI by default** ("AI Crawlers"); if you touch robots.txt, keep the `Allow` lines or the AI-ready work dies at the firewall.