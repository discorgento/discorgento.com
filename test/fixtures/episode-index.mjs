// Stand-in for the `virtual:discorgento-episode-index` module (see test/setup.mjs):
// a numbered episode and a special, newest first, like the real index.
export const EPISODE_INDEX = [
  {
    slug: '010-fixture-episode',
    youtubeId: 'AAAAAAAAAAA',
    number: 10,
    published: '2024-05-01T22:00:00Z',
    duration: 3739,
    title: {
      'pt-BR': 'Episódio de teste',
      en: 'Test episode',
      es: 'Episodio de prueba',
    },
    description: {
      'pt-BR': 'Descrição de teste',
      en: 'Test description',
      es: 'Descripción de prueba',
    },
  },
  {
    slug: 'fixture-special',
    youtubeId: 'BBBBBBBBBBB',
    number: null,
    published: '2023-01-01T12:00:00Z',
    duration: 900,
    title: { 'pt-BR': 'Especial', en: 'Special', es: 'Especial' },
    description: { 'pt-BR': 'Especial', en: 'Special', es: 'Especial' },
  },
];
