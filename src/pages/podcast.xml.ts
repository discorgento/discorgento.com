import type { APIRoute } from 'astro';
import { mergeWithCatalog, toCard } from '~/lib/episodes';
import { useTranslations } from '~/lib/i18n';
import { getLatestVideos } from '~/lib/youtube';

// RSS 2.0 feed of the podcast episodes, served on demand by the Worker like the
// episode islands: a new episode shows up without a redeploy.
//
// This is a feed for readers, not a podcast-directory feed. The episodes are
// YouTube videos and there is no audio file to put in an <enclosure>, so Spotify
// and Apple would reject it; the audio lives on the Spotify show instead. Adding
// iTunes tags without an audio source would only produce an invalid podcast feed. The YouTube fetch is
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
  // getLatestVideos() already falls back to the catalog; merging adds the
  // archive the 15-item feed no longer carries.
  const videos = mergeWithCatalog(await getLatestVideos());

  const items = videos
    .map((video) => {
      const card = toCard(video, 'pt-BR');
      const title = card.number
        ? `#${card.number} · ${card.title}`
        : card.title;
      const link = card.external ? card.href : `${SITE}${card.href}`;
      const pubDate = new Date(video.published).toUTCString();
      return [
        '    <item>',
        `      <title>${escapeXml(title)}</title>`,
        `      <link>${escapeXml(link)}</link>`,
        // The guid stays the YouTube URL it has always been: changing it would
        // make every reader re-announce the whole archive as new items.
        `      <guid isPermaLink="true">${escapeXml(video.url)}</guid>`,
        `      <pubDate>${pubDate}</pubDate>`,
        `      <description>${escapeXml(title)}</description>`,
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
