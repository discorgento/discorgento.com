import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';
import {
  buildEpisodeJsonLd,
  catalogProblems,
  clock,
  episodePath,
  isoDuration,
  mergeWithCatalog,
  minutes,
  padNumber,
  toCard,
} from '~/lib/episodes';
import { LOCALES } from '~/lib/i18n';
import { llmsFull, llmsIndex } from '~/lib/llms';
import { team } from '~/lib/team';
import { readEpisodeIndex } from '../plugins/episode-index.mjs';
import { applyCorrections, parseVtt } from '../scripts/import-transcript.mjs';

// ---------------------------------------------------------------------------
// Pure helpers (against test/fixtures/episode-index.mjs)
// ---------------------------------------------------------------------------

test('episode paths keep the slug and prefix only the non-default locales', () => {
  assert.equal(episodePath('009-x', 'pt-BR'), '/podcast/009-x/');
  assert.equal(episodePath('009-x', 'en'), '/en/podcast/009-x/');
  assert.equal(episodePath('009-x', 'es'), '/es/podcast/009-x/');
  assert.equal(episodePath('009-x', 'xx'), '/podcast/009-x/');
});

test('durations and clocks', () => {
  assert.equal(isoDuration(3739), 'PT1H2M19S');
  assert.equal(isoDuration(3600), 'PT1H');
  assert.equal(isoDuration(59), 'PT59S');
  assert.equal(isoDuration(0), 'PT0S');
  assert.equal(clock(3739), '1:02:19');
  assert.equal(clock(139), '2:19');
  assert.equal(clock(0), '0:00');
  assert.equal(minutes(3739), 62);
  assert.equal(minutes(10), 1);
  assert.equal(padNumber(9), '009');
  assert.equal(padNumber(null), null);
});

test('a catalogued video becomes an internal, localized card', () => {
  const video = {
    id: 'AAAAAAAAAAA',
    title: '#010 - Raw title - @discorgento',
    published: '2024-05-01T22:00:00Z',
    url: 'https://www.youtube.com/watch?v=AAAAAAAAAAA',
  };
  const card = toCard(video, 'en');
  assert.equal(card.title, 'Test episode');
  assert.equal(card.number, '010');
  assert.equal(card.href, '/en/podcast/010-fixture-episode/');
  assert.equal(card.external, false);
  assert.equal(card.youtubeUrl, video.url);
});

test('an unknown video keeps its feed title and links out', () => {
  const video = {
    id: 'CCCCCCCCCCC',
    title: '#011 - Brand new',
    published: '2024-06-01T22:00:00Z',
    url: 'https://www.youtube.com/watch?v=CCCCCCCCCCC',
  };
  const card = toCard(video, 'pt-BR');
  assert.equal(card.title, '#011 - Brand new');
  assert.equal(card.number, '011');
  assert.equal(card.href, video.url);
  assert.equal(card.external, true);
});

test('mergeWithCatalog adds the archive the feed no longer carries', () => {
  const feed = [
    {
      id: 'CCCCCCCCCCC',
      title: 'new',
      published: '2024-06-01T22:00:00Z',
      url: 'https://www.youtube.com/watch?v=CCCCCCCCCCC',
    },
    {
      id: 'AAAAAAAAAAA',
      title: 'feed copy',
      published: '2024-05-01T22:00:00Z',
      url: 'https://www.youtube.com/watch?v=AAAAAAAAAAA',
    },
  ];
  const merged = mergeWithCatalog(feed);
  assert.deepEqual(
    merged.map((v) => v.id),
    ['CCCCCCCCCCC', 'AAAAAAAAAAA', 'BBBBBBBBBBB'],
  );
  // The feed's own entry wins over the catalog copy.
  assert.equal(merged[1]?.title, 'feed copy');
});

test('episode JSON-LD carries what Google requires for a video', () => {
  const jsonLd = buildEpisodeJsonLd({
    site: 'https://discorgento.com/',
    locale: 'en',
    slug: '009-x',
    youtubeId: 'IkP1afuGgWs',
    number: 9,
    published: '2023-10-10T22:30:07Z',
    duration: 3739,
    language: 'pt-BR',
    title: 'Headless e-commerce',
    description: 'What headless is.',
    chapters: [
      { start: 0, title: 'Intro' },
      { start: 120, title: 'Topic' },
    ],
    hosts: [{ id: 'https://github.com/host', name: 'Host', role: 'Host' }],
    guests: [
      {
        id: 'https://discorgento.com/#person-guest',
        name: 'Guest',
        sameAs: ['https://www.youtube.com/@guest'],
      },
    ],
    thumbnails: ['https://discorgento.com/img/episodes/IkP1afuGgWs-1280.jpg'],
    crumbs: { home: 'Home', podcast: 'Podcast' },
  });
  const graph = jsonLd['@graph'];
  const byType = (type) => graph.filter((node) => node['@type'] === type);

  const [video] = byType('VideoObject');
  assert.ok(video.name && video.thumbnailUrl.length && video.uploadDate);
  assert.equal(video.duration, 'PT1H2M19S');
  assert.deepEqual(
    video.hasPart.map((clip) => [clip.startOffset, clip.endOffset, clip.url]),
    [
      [0, 120, 'https://discorgento.com/en/podcast/009-x/?t=0'],
      [120, 3739, 'https://discorgento.com/en/podcast/009-x/?t=120'],
    ],
  );

  const [episode] = byType('PodcastEpisode');
  assert.equal(episode.url, 'https://discorgento.com/en/podcast/009-x/');
  assert.equal(episode.episodeNumber, 9);
  assert.equal(
    episode.partOfSeries['@id'],
    'https://discorgento.com/en/podcast/#series',
  );
  assert.deepEqual(episode.associatedMedia, { '@id': video['@id'] });

  const [breadcrumbs] = byType('BreadcrumbList');
  assert.deepEqual(
    breadcrumbs.itemListElement.map((c) => c.item),
    [
      'https://discorgento.com/en/',
      'https://discorgento.com/en/podcast/',
      'https://discorgento.com/en/podcast/009-x/',
    ],
  );
  assert.equal(byType('Person').length, 2);
});

test('catalogProblems names every cross-file gap', () => {
  const problems = catalogProblems({
    episodes: [
      { slug: 'ok', hosts: ['a'], guests: ['g'] },
      { slug: 'Bad_Slug', hosts: ['nobody'], guests: ['ghost'] },
    ],
    notes: ['ok/pt-BR', 'ok/en', 'ok/es', 'Bad_Slug/pt-BR', 'orphan/en'],
    transcripts: ['ok'],
    guests: ['g'],
    hostRoster: ['a'],
    youtubeIds: ['x', 'x'],
  });
  assert.deepEqual(problems.sort(), [
    'Bad_Slug: guest "ghost" has no src/content/guests/ghost.json',
    'Bad_Slug: host "nobody" is not in src/lib/team.ts',
    'Bad_Slug: missing en.md',
    'Bad_Slug: missing es.md',
    'Bad_Slug: missing transcript.json',
    'Bad_Slug: the folder name must be a lowercase slug',
    'YouTube id x is catalogued more than once',
    'orphan/en.md has no episode.json',
  ]);
});

test('transcript import drops rolling caption repeats and groups paragraphs', () => {
  const vtt = `WEBVTT
Kind: captions
Language: pt

00:00:01.000 --> 00:00:03.000
fala<00:00:01.500><c> pessoal</c>

00:00:03.000 --> 00:00:03.010
fala pessoal

00:00:03.010 --> 00:00:05.000
fala pessoal
hoje<00:00:04.000><c> é</c><00:00:04.500><c> magento</c>

00:00:50.000 --> 00:00:52.000
outro<00:00:51.000><c> bloco</c>
`;
  assert.deepEqual(parseVtt(vtt), [
    [1, 'fala pessoal hoje é magento'],
    [50, 'outro bloco'],
  ]);
});

test('transcript corrections only replace whole words', () => {
  const fixes = [
    ['discor gento', 'discorgento'],
    ['vtex', 'VTEX'],
  ];
  assert.equal(
    applyCorrections('o discor gento e a vtex, não vtexlab', fixes),
    'o discorgento e a VTEX, não vtexlab',
  );
});

test('llms.txt lists every episode and links the full file', () => {
  const episode = {
    title: 'Headless',
    tag: '#009',
    url: 'https://discorgento.com/podcast/009-x/',
    published: '2023-10-10T22:30:07Z',
    description: 'O que é headless.',
    people: ['Raul Sakai'],
    summary: 'Resumo.',
    keyPoints: ['Ponto.'],
    faq: [{ question: 'O que é?', answer: 'Isso.' }],
  };
  const index = llmsIndex([episode]);
  assert.match(index, /^# discorgento\n\n> /);
  assert.ok(
    index.includes(
      '- [#009 · Headless](https://discorgento.com/podcast/009-x/): O que é headless.',
    ),
  );
  assert.ok(index.includes('https://discorgento.com/llms-full.txt'));
  const full = llmsFull([episode]);
  assert.ok(full.includes('## #009 · Headless'));
  assert.ok(full.includes('**O que é?**\n\nIsso.'));
});

// ---------------------------------------------------------------------------
// The real catalog on disk. The content collection schema validates each file
// at build; these are the cross-file rules, checked fast in CI without a build.
// ---------------------------------------------------------------------------

const DIR = resolve(process.cwd(), 'src/content/episodes');
const slugs = readdirSync(DIR, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);
const read = (slug, file) =>
  JSON.parse(readFileSync(resolve(DIR, slug, file), 'utf8'));

test('the catalog on disk is consistent', () => {
  const episodes = slugs.map((slug) => ({
    slug,
    ...read(slug, 'episode.json'),
  }));
  const guestsDir = resolve(process.cwd(), 'src/content/guests');
  const problems = catalogProblems({
    episodes: episodes.map((e) => ({
      slug: e.slug,
      hosts: e.hosts ?? [],
      guests: e.guests ?? [],
    })),
    notes: slugs.flatMap((slug) =>
      LOCALES.filter((l) => existsSync(resolve(DIR, slug, `${l}.md`))).map(
        (l) => `${slug}/${l}`,
      ),
    ),
    transcripts: slugs.filter((slug) =>
      existsSync(resolve(DIR, slug, 'transcript.json')),
    ),
    guests: readdirSync(guestsDir).map((f) => f.replace(/\.json$/, '')),
    hostRoster: team.map((member) => member.slug),
    youtubeIds: episodes.map((e) => e.youtubeId),
  });
  assert.deepEqual(problems, []);
});

test('every catalogued episode has its titles, chapters and a transcript in range', () => {
  for (const slug of slugs) {
    const episode = read(slug, 'episode.json');
    for (const locale of LOCALES) {
      assert.ok(
        episode.title[locale]?.trim(),
        `${slug}: empty ${locale} title`,
      );
    }
    for (const chapter of episode.chapters) {
      for (const locale of LOCALES) {
        assert.ok(
          chapter.title[locale]?.trim(),
          `${slug}: chapter at ${chapter.start}s has no ${locale} title`,
        );
      }
    }
    const transcript = read(slug, 'transcript.json');
    assert.equal(
      transcript.language,
      episode.language,
      `${slug}: transcript language`,
    );
    const last = transcript.segments.at(-1)?.[0] ?? 0;
    assert.ok(
      last < episode.duration,
      `${slug}: transcript runs past the video`,
    );
  }
});

test('the index the Worker sees matches the catalog', () => {
  const index = readEpisodeIndex();
  assert.equal(index.length, slugs.length);
  for (const entry of index) {
    for (const locale of LOCALES) {
      assert.ok(
        entry.description[locale] !== entry.title[locale],
        `${entry.slug}: ${locale}.md description is missing or unparseable`,
      );
    }
  }
});
