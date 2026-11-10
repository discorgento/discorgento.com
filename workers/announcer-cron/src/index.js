// Punctual clock for the Substack → Discord announcer.
//
// The announcer itself stays a GitHub Actions workflow: the announcement logic
// (scripts/substack-discord.mjs) and the announced-post state
// (.github/substack-discord-state.json) stay in the repo, versioned, with the
// state commit the workflow already pushes. What does NOT work is GitHub's own
// `schedule` dispatcher: it has no SLA (delays are documented, and queued runs
// can be dropped under load) and in this org it was measured 6–10 hours behind
// the nominal minute — ouija's weekly job, nominal 09:00 UTC, actually ran at
// 15:34, 18:56 and 19:16. For "tell the community the post is live" that is
// useless: the announcement has to leave close to the hour it was asked for.
//
// So this Worker holds the timer and calls workflow_dispatch. It runs on a
// Cloudflare cron trigger, which fires on the minute.
//
// This Worker does exactly one thing: POST workflow_dispatch.

const GITHUB_API = 'https://api.github.com';

/**
 * @typedef {object} Env
 * @property {string} DISPATCH_TOKEN Fine-grained PAT, Actions: write on the repo.
 * @property {string} GITHUB_REPO `owner/repo` of the announcer workflow.
 * @property {string} GITHUB_WORKFLOW Workflow file name or id.
 * @property {string} GITHUB_REF Branch the workflow runs on.
 */

/**
 * Asks GitHub to run the announcer workflow.
 * @param {Env} env
 * @returns {Promise<void>}
 */
async function dispatchAnnouncer(env) {
  const endpoint = `${GITHUB_API}/repos/${env.GITHUB_REPO}/actions/workflows/${env.GITHUB_WORKFLOW}/dispatches`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.DISPATCH_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      // GitHub rejects requests without a User-Agent.
      'User-Agent': 'discorgento-announcer-cron',
    },
    body: JSON.stringify({ ref: env.GITHUB_REF }),
  });

  // 204 No Content is the only success. Anything else has to reach the logs —
  // a silent failure here means the announcements simply stop.
  if (response.status !== 204) {
    throw new Error(
      `workflow_dispatch failed: ${response.status} ${await response.text()}`,
    );
  }
}

export default {
  /**
   * Cron entry point. The dispatch is awaited (not handed to waitUntil) so a
   * failure surfaces as a failed invocation in the Cloudflare logs.
   * @param {ScheduledController} _controller
   * @param {Env} env
   */
  async scheduled(_controller, env) {
    await dispatchAnnouncer(env);
  },

  /**
   * Manual trigger, for when the cron is not the thing you want to wait for:
   *   curl -X POST https://<worker>/ -H "Authorization: Bearer $DISPATCH_TOKEN"
   * The token is the same PAT, so this is not an open endpoint.
   * @param {Request} request
   * @param {Env} env
   */
  async fetch(request, env) {
    const token = request.headers
      .get('authorization')
      ?.replace(/^Bearer\s+/i, '');
    if (!token || token !== env.DISPATCH_TOKEN) {
      return new Response('Not found', { status: 404 });
    }

    await dispatchAnnouncer(env);
    return Response.json({
      dispatched: true,
      workflow: env.GITHUB_WORKFLOW,
      ref: env.GITHUB_REF,
    });
  },
};
