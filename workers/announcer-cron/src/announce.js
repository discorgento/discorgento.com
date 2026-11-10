// The announcement itself: which posts are new, and what the message says.
//
// Single source of truth, imported by both the Cloudflare cron Worker
// (bundled by wrangler) and scripts/substack-discord.mjs (local/manual runs) —
// the two must never drift into different house voices.

export const AVATAR_URL =
  'https://discorgento.com/img/logo-avatar-transparent-1024.png';

/**
 * The posts left to announce, oldest first (the feed is newest-first).
 * @param {Array<{url: string, published: string}>} posts
 * @param {{announced?: string, announcedAt?: string} | null} state
 */
export function selectNewPosts(posts, state) {
  if (!state?.announced) return posts.slice(0, 1); // bootstrap: newest only
  const index = posts.findIndex((post) => post.url === state.announced);
  if (index === -1) {
    // The announced post fell off the feed window; fall back to the clock.
    const cutoff = Date.parse(state.announcedAt ?? '') || 0;
    return posts
      .filter((post) => Date.parse(post.published) > cutoff)
      .reverse();
  }
  return posts.slice(0, index).reverse();
}

// Credit ping in the community's announcement voice (the same style as the
// episode announcements: 🎥 YouTube / 🎧 Spotify / special thanks). A plain
// "@Name" reads naturally but does not ping — a real mention needs the
// author's Discord user id as `<@id>`; add a map here when the ids are known.
const AUTHORS_DISCORD_IDS = {
  // e.g. 'jonatanaxe': '<@123456789012345678>',
};

// The three fixed lines of the announcement vary per post — same house
// format, different words every edition. Each slot is picked from a slice of
// the URL hash: deterministic, so a resumed run never flips the combo
// halfway, and the slices keep the three lines from moving in lockstep.
const HEADER_VARIANTS = [
  '@everyone Nova Edição da Newsletter Disponível! 🚀',
  '@everyone Saiu edição nova da newsletter! 🚀',
  '@everyone Tem texto novo no Substack! 🚀',
  '@everyone A newsletter chegou com tudo! 🚀',
  '@everyone Edição fresquinha no ar! 🚀',
];

const LINK_VARIANTS = [
  '📬 Leia no Substack: {url}',
  '📬 Ler agora no Substack: {url}',
  '📬 Confere a edição completa: {url}',
  '📬 A edição completa tá aqui: {url}',
  '📬 Bora ler no Substack: {url}',
];

const CREDIT_VARIANTS = [
  'Escrito por {who}! Confira agora! 👏🔥😄',
  'Escrito por {who}! Vem ler! 👏🔥😄',
  'Autoria de {who}! Bora conferir! 👏🔥😄',
  'Saiu da mente (e do teclado) de {who}! 👏🔥😄',
  'Créditos ao {who}! Vale a leitura! 👏🔥😄',
];

function hashUrl(url) {
  let hash = 5381;
  for (const ch of url) hash = ((hash << 5) + hash + ch.charCodeAt(0)) >>> 0;
  return hash;
}

/** The announcement text for a post: header, bare link, credit. */
export function buildAnnouncement(post) {
  const hash = hashUrl(post.url);
  const who = post.creator
    ? (AUTHORS_DISCORD_IDS[post.creator] ?? `@${post.creator}`)
    : 'time Discorgento';
  const header = HEADER_VARIANTS[hash % HEADER_VARIANTS.length];
  // >>> (unsigned shift): >> would go negative once the hash crosses 2^31,
  // and a negative index picks nothing.
  const link = LINK_VARIANTS[(hash >>> 6) % LINK_VARIANTS.length].replaceAll(
    '{url}',
    post.url,
  );
  const credit = CREDIT_VARIANTS[
    (hash >>> 12) % CREDIT_VARIANTS.length
  ].replaceAll('{who}', who);
  return [header, '', link, '', credit].join('\n');
}

/** The webhook payload: the channel's established announcement format. */
export function discordMessage(post) {
  // No hand-built embeds: the bare link lets Discord unfurl Substack's own
  // Open Graph card (title, subtitle, cover) below the message.
  return {
    username: 'Discorgento',
    avatar_url: AVATAR_URL,
    allowed_mentions: { parse: ['everyone'] },
    content: buildAnnouncement(post),
  };
}

/**
 * The outage notice: the feed has been unreachable for a while, so no edition
 * can be announced. Deliberately does NOT ping anyone — an ops notice is not a
 * new edition, and `parse: []` keeps it from notifying the channel.
 * @param {number} failures consecutive missed ticks
 */
export function discordAlert(failures) {
  const minutes = failures * 10; // one tick every 10 minutes
  const elapsed =
    minutes >= 60 ? `${Math.round(minutes / 60)} h` : `${minutes} min`;
  return {
    username: 'Discorgento',
    avatar_url: AVATAR_URL,
    allowed_mentions: { parse: [] },
    content: [
      '⚠️ **Aviso do announcer:** o feed do Substack não está respondendo.',
      `Já são ${failures} verificações seguidas (~${elapsed}) sem conseguir ler as edições.`,
      'Enquanto isso, uma edição nova não seria anunciada aqui.',
      'Quando o feed voltar, o anúncio sai sozinho — não precisa fazer nada.',
      '_(aviso automático, não é um post novo)_',
    ].join('\n'),
  };
}
