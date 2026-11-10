<h1 align="center">
  <img src="public/img/logo.svg" alt="Discorgento logo" width="128" height="128" title="Discorgento"/>
  <br>
  discorgento.com
  <br>
</h1>

<p align="center">
  <a href="https://github.com/discorgento/discorgento.com/actions/workflows/deploy.yml"><img src="https://github.com/discorgento/discorgento.com/actions/workflows/deploy.yml/badge.svg" alt="CI/CD status" /></a>
  <a href="https://nodejs.org/en"><img src="https://img.shields.io/badge/node-%E2%89%A5%2022.18-339933?logo=node.js" alt="Node >= 22.18" /></a>
  <a href="https://biomejs.dev"><img src="https://img.shields.io/badge/code%20style-biome-60a5fa?logo=biome" alt="Linted with Biome" /></a>
</p>

**Discorgento** is a Brazilian tech community born in the Magento/e-commerce world, now talking about tech in general: PHP, JavaScript, e-commerce and AI. This repository holds the community's home on the web — [discorgento.com](https://discorgento.com) — where the podcast lives, the episode archive is browsable and the newsletter is announced.

The site's product is in Brazilian Portuguese (with `/en` and `/es` editions); everything else here — code, docs, commit messages — is in English.

## The site

Static-first Astro site with a handful of **server islands** that re-render on every request inside a Cloudflare Worker, so live data (latest YouTube episode, Substack edition, Discord stats) shows up without a redeploy:

- **Built with** [Astro 7](https://astro.build) + [Tailwind v4](https://tailwindcss.com), deployed as a Cloudflare Worker via GitHub Actions
- **Three locales**: `pt-BR` (default, no prefix), `/en/`, `/es/` — every route exists in all three, with hreflang wired
- **Podcast archive** as a content collection: one folder per episode (`episode.json`, localized notes, timestamped transcript) powers watch pages with chapters, Q&A and JSON-LD (`PodcastEpisode`, `VideoObject`, `BreadcrumbList`)
- **Self-hosted media**: episode thumbnails are downloaded, resized and re-encoded (AVIF/WebP/JPEG tiers) at build time, so the LCP image never leaves our origin
- **Strict CSP** with hashed inline scripts/styles, opt-in GA4 consent, and AI crawlers explicitly allowed in `robots.txt`

See [AGENTS.md](AGENTS.md) for the full architecture, commands and gotchas — it is the deep dev doc this README only summarizes.

## Automation

- **CI/CD**: every push runs `astro check`, Biome lint, unit tests and a production build; `main` deploys the build to the `discorgento` Worker and `develop` to the `staging` Worker (what passed the gates is exactly what ships)
- **Substack → Discord**: an hourly GitHub Actions workflow watches the newsletter feed and announces new posts in the community's Discord news channel — house-voice message, rotating lines, duplicate-proof via a committed state file

## Quick start

Requires Node >= 22.18.

```bash
npm install
npm run dev        # foreground dev server on http://localhost:4321
```

| Command                          | What it does                                              |
| -------------------------------- | --------------------------------------------------------- |
| `npm run dev`                    | Dev server (foreground; Ctrl+C to stop)                   |
| `npm run dev:start` / `dev:stop` | Dev server in the background (log in `.astro/dev.log`)    |
| `npm run dev:reset`              | Full clean cycle: stop, clear caches, build, start fresh  |
| `npm run build`                  | Production build to `dist/` (safe with the dev server up) |
| `npm run check`                  | Type-check the project and templates                      |
| `npm run lint` / `format`        | Biome check / check with fixes applied                    |
| `npm test`                       | Unit tests for the pure `src/lib` code                    |

## Project layout

```
src/
  content/episodes/<slug>/   # one folder per episode: episode.json + pt-BR/en/es.md + transcript.json
  content/guests/            # podcast guests
  pages/                     # routes per locale (root = pt-BR, en/, es/)
  components/                # Home sections, Navbar, Footer, EpisodeArt, CookieConsent, islands
  lib/                       # feeds (YouTube/Substack/Discord), i18n, episode helpers
  layouts/MainLayout.astro   # html shell + all SEO
scripts/                    # build wrapper, thumbnails, OG image, transcripts, Discord announcer
.github/workflows/          # CI/CD + the Substack → Discord announcer
```

## Contributing

Issues and pull requests are welcome — the community is the point. For anything beyond a typo, open an issue first so we can talk it through. The gates CI runs are the same ones you should run locally before submitting:

```bash
npm run check && npm run lint && npm test
```

Publishing an episode or a page translation follows the catalog conventions in [AGENTS.md](AGENTS.md) — start there.

## Follow us

- [Discord](https://discorgento.com/discord)
- [Newsletter (Substack)](https://discorgento.substack.com)
- [YouTube](https://www.youtube.com/channel/UChJitnyFtNOoCe6cu-rHcow)
- [Spotify](https://open.spotify.com/show/5h3gKepBezY4Iz5LM79nUn)
- [Instagram](https://www.instagram.com/discorgento/)
- [Twitter](https://twitter.com/discorgento)

<a href="https://github.com/discorgento/discorgento.com/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=discorgento/discorgento.com" />
</a>
