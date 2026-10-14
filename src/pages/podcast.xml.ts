import type { APIRoute } from 'astro';
import { useTranslations } from '~/lib/i18n';
import { getLatestVideos, getSnapshotVideos } from '~/lib/youtube';

// RSS 2.0 feed for the podcast, served on demand by the Worker like the episode
// islands: a new episode shows up without a redeploy. The YouTube fetch is
// edge-cached (cf.cacheTtl in youtube.ts), so this does not hammer the feed.
export const prerender = false;

const SITE = 'https://discorgento.com';

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export const GET: APIRoute = async () => {
  const t = useTranslations('pt-BR');
  const fetched = await getLatestVideos();
  const videos = fetched.length ? fetched : getSnapshotVideos();

  const items = videos
    .map((video) => {
      const pubDate = new Date(video.published).toUTCString();
      return [
        '    <item>',
        `      <title>${escapeXml(video.title)}</title>`,
        `      <link>${escapeXml(video.url)}</link>`,
        `      <guid isPermaLink="true">${escapeXml(video.url)}</guid>`,
        `      <pubDate>${pubDate}</pubDate>`,
        `      <description>${escapeXml(video.title)}</description>`,
        `      <media:thumbnail url="https://i.ytimg.com/vi/${video.id}/mqdefault.jpg" />`,
        '    </item>',
      ].join('\n');
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>${escapeXml(t('site.title'))}</title>
    <link>${SITE}/</link>
    <description>${escapeXml(t('podcast.desc'))}</description>
    <language>pt-BR</language>
    <atom:link href="${SITE}/podcast.xml" rel="self" type="application/rss+xml" />
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      // Edge-cached to match the YouTube fetch's cf.cacheTtl: readers poll the
      // feed, so this keeps a burst from turning into a burst of upstream hits.
      'Cache-Control': 'public, max-age=0, s-maxage=1800',
    },
  });
};
