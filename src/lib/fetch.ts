// Shared HTTP fetching for the data libraries (youtube, substack, discord).
//
// Every upstream call in this project needs the same three things, and hand-rolling
// them per library is how one of them (discord) ended up without edge caching:
//   - a hard timeout, so a connection that opens and then stalls cannot hang a
//     build or hold a Worker request open until it is killed;
//   - retries with backoff for the flaky-but-recoverable failures (5xx, 429,
//     network errors), which the YouTube feed produces routinely;
//   - Cloudflare edge caching via `cf`, so a burst of page views becomes one
//     upstream request. Node ignores `cf`, so the build-time path is unaffected.

export interface FetchOptions {
  /** Edge cache TTL in seconds (Cloudflare `cf.cacheTtl`). */
  cacheTtl: number;
  /** Per-attempt timeout in ms. Defaults to 10s. */
  timeoutMs?: number;
  /** Total attempts, including the first. Defaults to 3. */
  attempts?: number;
  /** Base backoff in ms, multiplied by the attempt number. Defaults to 1000. */
  backoffMs?: number;
  /** Tag used in the warning logs, e.g. `youtube`. */
  label: string;
}

const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_ATTEMPTS = 3;
const DEFAULT_BACKOFF_MS = 1_000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch `url` with a timeout, retries and edge caching, returning the first
 * successful `Response`, or `null` when every attempt failed.
 *
 * A 4xx other than 429 is treated as final: the request was refused, not
 * throttled, and retrying it only wastes time. Each failure is logged with the
 * caller's `label` and the attempt count, so a degraded library is visible in the
 * build or Worker logs instead of silently shipping a fallback.
 */
export async function fetchWithRetry(
  url: string,
  options: FetchOptions,
): Promise<Response | null> {
  const {
    cacheTtl,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    attempts = DEFAULT_ATTEMPTS,
    backoffMs = DEFAULT_BACKOFF_MS,
    label,
  } = options;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { 'user-agent': 'discorgento-site' },
        signal: AbortSignal.timeout(timeoutMs),
        cf: { cacheTtl, cacheEverything: true },
      } as RequestInit & {
        cf: { cacheTtl: number; cacheEverything: boolean };
      });

      if (res.ok) return res;

      if (res.status < 500 && res.status !== 429) {
        console.warn(`[${label}] refused with ${res.status}`);
        return null;
      }

      console.warn(
        `[${label}] returned ${res.status}, attempt ${attempt}/${attempts}`,
      );
    } catch (err) {
      console.warn(
        `[${label}] request failed on attempt ${attempt}/${attempts}:`,
        err instanceof Error ? err.message : err,
      );
    }

    if (attempt < attempts) await sleep(backoffMs * attempt);
  }

  return null;
}
