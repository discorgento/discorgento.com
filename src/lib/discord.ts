// Fetches the Discorgento Discord server stats via the public invite API.
// Runs at build time — no token, no CORS. Falls back to null on failure.
//
// The timeout is not optional: this fetch runs inside `astro build`, so an API that
// accepts the connection and then stalls hangs the build with no error to read.

const INVITE_CODE = 'amfwybm3yj'; // resolved from discorgento.com/discord → discord.gg/amfwybm3yj
const API_URL = `https://discord.com/api/v10/invites/${INVITE_CODE}?with_counts=true`;
const TIMEOUT_MS = 10_000;

export interface DiscordStats {
  guild: string;
  members: number;
  online: number;
}

export async function getDiscordStats(): Promise<DiscordStats | null> {
  try {
    const res = await fetch(API_URL, {
      headers: { 'user-agent': 'discorgento-site' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) {
      console.warn(`[discord] invite API returned ${res.status}`);
      return null;
    }
    const data = await res.json();
    const members = data?.approximate_member_count;
    if (typeof members !== 'number') {
      console.warn('[discord] invite API answered without approximate_member_count');
      return null;
    }
    return {
      guild: data?.guild?.name ?? 'Discorgento',
      members,
      online: data?.approximate_presence_count ?? 0,
    };
  } catch (err) {
    console.warn(
      '[discord] invite request failed, the member count will not render:',
      err instanceof Error ? err.message : err
    );
    return null;
  }
}