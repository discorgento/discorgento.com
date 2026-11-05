// The site's outbound profile links, in one place so the navbar, footer, home
// sections and JSON-LD cannot drift apart.

export const LINKS = {
  youtube: 'https://www.youtube.com/@discorgento',
  /** Curated playlist: what the UI links to and embeds. */
  spotify: 'https://open.spotify.com/playlist/4pU2Abae7J8vdY4yqPCXRc',
  /** The podcast's canonical Spotify entity, for structured data (sameAs). */
  spotifyShow: 'https://open.spotify.com/show/5h3gKepBezY4Iz5LM79nUn',
  substack: 'https://discorgento.substack.com',
  discord: 'https://discorgento.com/discord',
  github: 'https://github.com/discorgento',
  twitter: 'https://twitter.com/discorgento',
  instagram: 'https://www.instagram.com/discorgento/',
} as const;
