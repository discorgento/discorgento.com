// Feeds src/lib/llms.ts from the catalog. Separate from it because this imports
// astro:content (via getEpisodes), which only the prerendered endpoints may use.

import { getEpisodes } from '~/lib/episode-content';
import { episodePath, padNumber } from '~/lib/episodes';
import { useTranslations } from '~/lib/i18n';
import type { LlmsEpisode } from '~/lib/llms';
import { team } from '~/lib/team';

const SITE = 'https://discorgento.com';

/** Every episode in pt-BR, the site's default edition, newest first. */
export async function llmsEpisodes(): Promise<LlmsEpisode[]> {
  const t = useTranslations('pt-BR');
  const episodes = await getEpisodes();
  return episodes.map((episode) => {
    const note = episode.notes['pt-BR'];
    const num = padNumber(episode.data.number);
    const hosts = team
      .filter((member) => episode.data.hosts.includes(member.slug))
      .map((member) => `${member.name} (${t('episode.host')})`);
    const guests = episode.guests.map((g) => g.data.name);
    return {
      title: episode.data.title['pt-BR'],
      tag: num ? `#${num}` : t('episode.special'),
      url: `${SITE}${episodePath(episode.slug, 'pt-BR')}`,
      published: episode.data.published,
      description: note.data.description,
      people: [...guests, ...hosts],
      summary: note.body ?? '',
      keyPoints: note.data.keyPoints,
      faq: note.data.faq,
    };
  });
}
