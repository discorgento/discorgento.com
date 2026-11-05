// Preloaded by `npm test` (node --import). Teaches Node the two module ids that
// only exist inside Vite, so the src/lib modules can be imported as they are:
//
//   - `~/…` is the tsconfig/Vite alias for src/.
//   - `virtual:discorgento-thumb-cache` is emitted by plugins/thumb-cache.mjs at
//     build time. Tests get the fixture in test/fixtures/thumb-cache.mjs instead
//     of the files on disk, so they do not change whenever an episode is synced.
//
// JSON imports also get their `type: 'json'` attribute here: Vite does not need
// one, Node refuses to load JSON without it.

import { registerHooks } from 'node:module';
import { pathToFileURL } from 'node:url';

const ROOT = pathToFileURL(`${process.cwd()}/`);
const VIRTUAL = new URL('test/fixtures/thumb-cache.mjs', ROOT).href;

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === 'virtual:discorgento-thumb-cache') {
      return { url: VIRTUAL, shortCircuit: true };
    }
    let target = specifier;
    if (specifier.startsWith('~/')) {
      target = new URL(`src/${specifier.slice(2)}`, ROOT).href;
      if (!/\.[a-z]+$/.test(target)) target += '.ts';
    }
    return nextResolve(target, context);
  },
  load(url, context, nextLoad) {
    if (url.endsWith('.json')) {
      return nextLoad(url, {
        ...context,
        importAttributes: { ...context.importAttributes, type: 'json' },
      });
    }
    return nextLoad(url, context);
  },
});
