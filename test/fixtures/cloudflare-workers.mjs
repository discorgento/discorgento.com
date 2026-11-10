// `cloudflare:workers` only exists inside workerd. Tests get a stand-in so the
// Worker modules can be imported and their logic exercised in plain Node —
// wired in test/setup.mjs, next to the other Vite-only module ids.

export class DurableObject {
  constructor(ctx, env) {
    this.ctx = ctx;
    this.env = env;
  }
}
