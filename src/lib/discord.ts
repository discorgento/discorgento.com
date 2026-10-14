// Fetches the Discorgento Discord server stats via the public invite API.
// Runs at request time from the DiscordStats server island and at build time
// from Home (its fallback) — no token, no CORS. Falls back to null on failure.
//
// Timeout, retries and edge caching live in `~/lib/fetch` (`fetchWithRetry`),
// shared with youtube.ts and substack.ts so the three cannot drift apart.

import { fetchWithRetry } from '~/lib/fetch';

const INVITE_CODE = 'amfwybm3yj'; // resolved from discorgento.com/discord → discord.gg/amfwybm3yj
const API_URL = `https://discord.com/api/v10/invites/${INVITE_CODE}?with_counts=true`;

export interface DiscordStats {
  guild: string;
  members: number;
  online: number;
}

export async function getDiscordStats(): Promise<DiscordStats | null> {
  const res = await fetchWithRetry(API_URL, {
    cacheTtl: 1_800,
    label: 'discord',
  });
  if (!res) return null;

  try {
    const data = await res.json();
    const members = data?.approximate_member_count;
    if (typeof members !== 'number') {
      console.warn(
        '[discord] invite API answered without approximate_member_count',
      );
      return null;
    }
    return {
      guild: data?.guild?.name ?? 'Discorgento',
      members,
      online: data?.approximate_presence_count ?? 0,
    };
  } catch (err) {
    console.warn(
      '[discord] invite response was not valid JSON:',
      err instanceof Error ? err.message : err,
    );
    return null;
  }
}
