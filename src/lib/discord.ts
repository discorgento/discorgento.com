// Fetches the Discorgento Discord server stats via the public invite API.
// Runs at build time — no token, no CORS. Falls back to null silently on failure.

const INVITE_CODE = 'amfwybm3yj'; // resolved from discorgento.com/discord → discord.gg/amfwybm3yj
const API_URL = `https://discord.com/api/v10/invites/${INVITE_CODE}?with_counts=true`;

export interface DiscordStats {
  guild: string;
  members: number;
  online: number;
}

export async function getDiscordStats(): Promise<DiscordStats | null> {
  try {
    const res = await fetch(API_URL, {
      headers: { 'user-agent': 'discorgento-site' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const members = data?.approximate_member_count;
    if (typeof members !== 'number') return null;
    return {
      guild: data?.guild?.name ?? 'Discorgento',
      members,
      online: data?.approximate_presence_count ?? 0,
    };
  } catch {
    return null;
  }
}