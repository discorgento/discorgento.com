#!/usr/bin/env node
// Build without the dev-server footgun.
//
// The dev server and `astro build` share node_modules/.vite. The Cloudflare
// adapter's SSR dep-optimizer cache (`deps_ssr`) is re-optimized by the build,
// so a dev server started before it keeps pointing at an
// @astrojs_cloudflare_entrypoints_server.js that no longer exists — every route
// then answers 500 with "The file does not exist at ... optimize deps
// directory". The build itself still succeeds, which is what makes it so easy to
// miss: you only find out when the dev server starts serving errors.
//
// So: stop the dev server, clear the cache, build, then bring the dev server
// back exactly as it was. CI has no dev server and no lock file, so both the
// stop and the restart fall through as no-ops.
//
// Pass --keep-server to build with the dev server left down on purpose.

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const lockFile = join(root, '.astro', 'dev.json');
const viteCache = join(root, 'node_modules', '.vite');

const log = (msg) => console.log(`\x1b[36m[build]\x1b[0m ${msg}`);

function devServerRunning() {
  if (!existsSync(lockFile)) return null;
  try {
    const { pid } = JSON.parse(readFileSync(lockFile, 'utf8'));
    // A lock file left behind by a killed process would make us "restore" a
    // server that is not there, so confirm the pid is really alive.
    process.kill(pid, 0);
    return pid;
  } catch {
    return null;
  }
}

function astro(...args) {
  const r = spawnSync('npx', ['astro', ...args], {
    cwd: root,
    stdio: 'inherit',
    shell: false,
  });
  return r.status === 0;
}

const keepDown = process.argv.includes('--keep-server');
const pid = devServerRunning();

if (pid) log(`dev server running (pid ${pid}) — stopping it`);
else log('no dev server running');

if (!astro('dev', 'stop')) log('nothing to stop');

// The build rewrites deps_ssr; clearing first keeps it from inheriting the dev
// server's optimizer state, and clearing again before the restart (below)
// guarantees the restored server re-optimizes from scratch.
rmSync(viteCache, { recursive: true, force: true });
log('cleared node_modules/.vite');

let ok = false;
try {
  ok = astro('build');
} finally {
  if (pid && !keepDown) {
    rmSync(viteCache, { recursive: true, force: true });
    if (astro('dev', '--background')) log('dev server restarted');
    else log('build finished but the dev server failed to restart — run npm run dev:start');
  }
}

process.exit(ok ? 0 : 1);
