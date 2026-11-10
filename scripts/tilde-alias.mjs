// Node resolve hook for the `~/` alias (src/, .ts by default) — the same
// mapping tsconfig.json and Vite give the site code. Lets a CLI script run
// with plain `node` import the src/lib modules without a bundler:
//
//   node --import ./scripts/tilde-alias.mjs scripts/substack-discord.mjs
//
// test/setup.mjs imports this file for its side effect (npm test needs the
// same alias on top of its virtual-module fixtures), so the two cannot drift.

import { registerHooks } from 'node:module';
import { pathToFileURL } from 'node:url';

const ROOT = pathToFileURL(`${process.cwd()}/`);

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (!specifier.startsWith('~/')) return nextResolve(specifier, context);
    let target = new URL(`src/${specifier.slice(2)}`, ROOT).href;
    if (!/\.[a-z]+$/.test(target)) target += '.ts';
    return nextResolve(target, context);
  },
});
