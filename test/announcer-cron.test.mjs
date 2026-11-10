// The announcer's clock (workers/announcer-cron) is a Worker whose only job is
// to POST workflow_dispatch. Nothing here can be exercised for real without a
// PAT, so these tests stub `fetch` and pin the contract GitHub documents:
// endpoint shape, the ref in the body, and that anything but 204 throws — a
// silent failure would mean the announcements just stop.

import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';

const worker = (await import('../workers/announcer-cron/src/index.js')).default;

const ENV = {
  DISPATCH_TOKEN: 'github_pat_test',
  GITHUB_REPO: 'discorgento/discorgento.com',
  GITHUB_WORKFLOW: 'substack-discord.yml',
  GITHUB_REF: 'main',
};

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
});

/** Replaces fetch with a stub that records the request and answers `status`. */
function stubFetch(status = 204, body = '') {
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url, init });
    // 204 cannot carry a body — the Response constructor rejects one.
    return status === 204
      ? new Response(null, { status })
      : new Response(body, { status });
  };
  return calls;
}

test('the cron dispatches the announcer workflow on the configured ref', async () => {
  const calls = stubFetch();

  await worker.scheduled({}, ENV);

  assert.equal(calls.length, 1);
  assert.equal(
    calls[0].url,
    'https://api.github.com/repos/discorgento/discorgento.com/actions/workflows/substack-discord.yml/dispatches',
  );
  assert.equal(calls[0].init.method, 'POST');
  assert.deepEqual(JSON.parse(calls[0].init.body), { ref: 'main' });
});

test('the dispatch is authenticated and versioned', async () => {
  const calls = stubFetch();

  await worker.scheduled({}, ENV);

  const { headers } = calls[0].init;
  assert.equal(headers.Authorization, 'Bearer github_pat_test');
  assert.equal(headers.Accept, 'application/vnd.github+json');
  assert.equal(headers['X-GitHub-Api-Version'], '2022-11-28');
  // GitHub answers 403 to a request without a User-Agent.
  assert.ok(headers['User-Agent']);
});

test('a refused dispatch throws instead of failing silently', async () => {
  stubFetch(401, '{"message":"Bad credentials"}');

  await assert.rejects(worker.scheduled({}, ENV), /401.*Bad credentials/s);
});

test('the fetch entry point is closed without the token', async () => {
  const calls = stubFetch();

  const response = await worker.fetch(new Request('https://cron.test/'), ENV);

  assert.equal(response.status, 404);
  assert.equal(calls.length, 0);
});

test('the fetch entry point dispatches when the token matches', async () => {
  const calls = stubFetch();

  const response = await worker.fetch(
    new Request('https://cron.test/', {
      method: 'POST',
      headers: { Authorization: 'Bearer github_pat_test' },
    }),
    ENV,
  );

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    dispatched: true,
    workflow: 'substack-discord.yml',
    ref: 'main',
  });
  assert.equal(calls.length, 1);
});
