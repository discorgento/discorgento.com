// The /llms.txt and /llms-full.txt bodies (https://llmstxt.org). Built from the
// episode catalog at build time, so a new episode is listed without anyone
// remembering to edit a static file. Pure: the endpoints pass the data in.

export interface LlmsEpisode {
  title: string;
  /** '#009' or the "special" label. */
  tag: string;
  url: string;
  published: string;
  description: string;
  people: string[];
  summary: string;
  keyPoints: string[];
  faq: { question: string; answer: string }[];
}

const SITE = 'https://discorgento.com';

const HEADER = `# discorgento

> Comunidade brasileira de tecnologia que nasceu no Magento: podcast de entrevistas sobre e-commerce e engenharia (Magento/Adobe Commerce, VTEX, headless, carreira), newsletter e uma comunidade aberta no Discord.

O discorgento existe desde 2021. O conteúdo principal é o podcast, publicado em vídeo no YouTube e com uma página por episódio neste site (resumo, capítulos, perguntas e respostas e transcrição). O site tem edições em português (padrão), inglês (/en/) e espanhol (/es/).`;

export function llmsIndex(episodes: LlmsEpisode[]): string {
  const list = episodes
    .map((e) => `- [${e.tag} · ${e.title}](${e.url}): ${e.description}`)
    .join('\n');
  return `${HEADER}

## Episódios

${list}

## Podcast

- [Todos os episódios](${SITE}/podcast/): lista completa, do mais recente ao mais antigo.
- [Feed RSS](${SITE}/podcast.xml): os episódios em RSS 2.0.
- [Canal no YouTube](https://www.youtube.com/@discorgento): os episódios em vídeo.

## Sobre

- [Quem faz o discorgento](${SITE}/quem-faz/): a equipe por trás do podcast e do Discord.
- [Discord](${SITE}/discord): a comunidade, o ponto de entrada para conversar sobre tecnologia.
- [Newsletter (Substack)](https://discorgento.substack.com/): edições com bastidores, links e novidades.

## Outros idiomas

- [English edition](${SITE}/en/): the same pages in English, including every episode page.
- [Edición en español](${SITE}/es/): las mismas páginas en español, con cada episodio.

## Optional

- [Conteúdo completo dos episódios](${SITE}/llms-full.txt): resumo, pontos principais e perguntas e respostas de cada episódio num único arquivo.
- [X / Twitter](https://twitter.com/discorgento): anúncios curtos.
`;
}

export function llmsFull(episodes: LlmsEpisode[]): string {
  const blocks = episodes.map((e) =>
    [
      `## ${e.tag} · ${e.title}`,
      '',
      `- Página: ${e.url}`,
      `- Publicado em: ${e.published.slice(0, 10)}`,
      ...(e.people.length ? [`- Participantes: ${e.people.join(', ')}`] : []),
      '',
      e.summary.trim(),
      '',
      '### Pontos principais',
      '',
      ...e.keyPoints.map((p) => `- ${p}`),
      '',
      '### Perguntas e respostas',
      '',
      ...e.faq.flatMap((f) => [`**${f.question}**`, '', f.answer, '']),
    ].join('\n'),
  );
  return `${HEADER}

${blocks.join('\n\n').trim()}
`;
}
