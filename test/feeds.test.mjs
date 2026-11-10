import assert from 'node:assert/strict';
import { test } from 'node:test';
import { numberFromTitle } from '~/lib/episodes';
import { parseSubstackFeed } from '~/lib/substack';
import {
  avifSrcset,
  formatEpDate,
  getSnapshotVideos,
  parseFeed,
  thumb,
  webpSrcset,
} from '~/lib/youtube';

const YOUTUBE_FEED = `<?xml version="1.0"?>
<feed>
  <title>discorgento</title>
  <entry>
    <yt:videoId>abc123</yt:videoId>
    <title>#010 - Fallback title</title>
    <published>2026-10-01T22:30:00+00:00</published>
    <media:group><media:title>#010 - Tom &amp; Jerry &#233;</media:title></media:group>
  </entry>
  <entry>
    <title>entry without a video id is skipped</title>
  </entry>
  <entry>
    <yt:videoId>def456</yt:videoId>
    <title>No media title</title>
    <published>2026-09-01T22:30:00+00:00</published>
  </entry>
</feed>`;

test('parseFeed reads id, title, date and url', () => {
  const videos = parseFeed(YOUTUBE_FEED);
  assert.equal(videos.length, 2);
  assert.deepEqual(videos[0], {
    id: 'abc123',
    title: '#010 - Tom & Jerry é',
    published: '2026-10-01T22:30:00+00:00',
    url: 'https://www.youtube.com/watch?v=abc123',
  });
  assert.equal(videos[1]?.title, 'No media title');
});

test('parseFeed returns nothing for a feed without entries', () => {
  assert.deepEqual(parseFeed('<feed></feed>'), []);
});

const SUBSTACK_FEED = `<rss><channel>
  <title>discorgento</title>
  <item>
    <title><![CDATA[IA no dia a dia: o que vale (& o que não)]]></title>
    <description><![CDATA[Subt&#237;tulo do post]]></description>
    <link>https://discorgento.substack.com/p/ia</link>
    <pubDate>Mon, 21 Sep 2026 12:00:00 GMT</pubDate>
    <dc:creator><![CDATA[jonatanaxe]]></dc:creator>
    <enclosure url="https://substackcdn.com/image/fetch/cover.png" length="0" type="image/jpeg"/>
  </item>
  <item>
    <title>Escaped &amp; plain</title>
    <description>Estamos t&#227;o ocupados</description>
    <link>https://discorgento.substack.com/p/plain</link>
    <pubDate>Mon, 14 Sep 2026 12:00:00 GMT</pubDate>
  </item>
  <item>
    <title>no link, skipped</title>
  </item>
</channel></rss>`;

test('parseSubstackFeed reads CDATA and escaped titles', () => {
  const posts = parseSubstackFeed(SUBSTACK_FEED);
  assert.equal(posts.length, 2);
  assert.equal(posts[0]?.title, 'IA no dia a dia: o que vale (& o que não)');
  assert.equal(posts[0]?.url, 'https://discorgento.substack.com/p/ia');
  assert.equal(posts[1]?.title, 'Escaped & plain');
});

test('parseSubstackFeed reads teaser, byline and cover', () => {
  const [first, second] = parseSubstackFeed(SUBSTACK_FEED);
  assert.equal(first?.description, 'Subtítulo do post');
  assert.equal(first?.creator, 'jonatanaxe');
  assert.equal(first?.image, 'https://substackcdn.com/image/fetch/cover.png');
  // Optional bits default to '' when the feed carries them for no item.
  assert.equal(second?.description, 'Estamos tão ocupados');
  assert.equal(second?.creator, '');
  assert.equal(second?.image, '');
});

test('numberFromTitle extracts the leading number', () => {
  assert.equal(numberFromTitle('#009 - E-Commerce Headless'), '009');
  assert.equal(numberFromTitle('Trailer #1'), null);
});

test('formatEpDate formats in UTC per locale', () => {
  // 23:30 UTC on the 10th stays the 10th whatever the machine timezone is.
  const iso = '2023-10-10T23:30:00+00:00';
  assert.match(formatEpDate(iso, 'pt-BR'), /^10 de out\.? de 2023$/);
  assert.equal(formatEpDate(iso, 'en'), 'Oct 10, 2023');
  assert.equal(formatEpDate('not a date', 'en'), '');
});

test('thumb serves the local copy and falls back to 16:9 YouTube variants', () => {
  assert.equal(thumb('full', 1024), '/img/episodes/full-1024.jpg?v=test');
  assert.equal(
    thumb('missing', 320),
    'https://i.ytimg.com/vi/missing/mqdefault.jpg',
  );
  // 640/1024 have no 16:9 YouTube variant of their own; never sddefault (4:3).
  assert.equal(
    thumb('missing', 640),
    'https://i.ytimg.com/vi/missing/maxresdefault.jpg',
  );
});

test('srcsets are all-or-nothing', () => {
  const sizes = [320, 640, 1024, 1280];
  assert.equal(
    webpSrcset('full', sizes),
    sizes.map((s) => `/img/episodes/full-${s}.webp?v=test ${s}w`).join(', '),
  );
  assert.equal(webpSrcset('partial', sizes), null);
  assert.equal(avifSrcset('partial', sizes), null);
  assert.equal(avifSrcset('missing', sizes), null);
});

test('the snapshot is the episode catalog, newest first', () => {
  const videos = getSnapshotVideos();
  assert.deepEqual(
    videos.map((v) => v.id),
    ['AAAAAAAAAAA', 'BBBBBBBBBBB'],
  );
  assert.equal(videos[0]?.url, 'https://www.youtube.com/watch?v=AAAAAAAAAAA');
});
