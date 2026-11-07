// Turns a YouTube caption file into src/content/episodes/<slug>/transcript.json.
//
//   node scripts/import-transcript.mjs <slug> <captions.vtt> [corrections.json] [--manual]
//
// Get the captions with yt-dlp (run outside CI; YouTube rate-limits datacenter IPs):
//
//   uvx yt-dlp --skip-download --write-auto-subs --sub-langs pt-orig \
//     --sub-format vtt -o '%(id)s.%(ext)s' -- <youtubeId>
//
// Auto captions repeat every line across rolling cues and carry inline word
// timings; this keeps each spoken line once and groups the lines into ~45 s
// paragraphs, each with its start time, so the page can render a readable
// transcript whose timestamps seek the player.
//
// `corrections.json` is an optional array of ["wrong", "right"] pairs for names
// and terms the captions mangle ("discor gento" → "discorgento"). They are
// applied in order, to whole words only, so a pair can never rewrite part of
// a longer word. Keep it to unambiguous proper nouns: the page already labels
// the text as automatic, and a wrong "fix" is worse than an honest typo.

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const PARAGRAPH_SECONDS = 45;
const CUE = /^(\d+):(\d\d):(\d\d)\.\d+ --> /;

/** Parse a VTT file into [[startSeconds, text], ...] paragraphs. */
export function parseVtt(vtt) {
  const lines = [];
  let start = 0;
  let previous = '';
  for (const raw of vtt.split(/\r?\n/)) {
    const cue = CUE.exec(raw);
    if (cue) {
      start = Number(cue[1]) * 3600 + Number(cue[2]) * 60 + Number(cue[3]);
      continue;
    }
    if (!raw.trim() || /^(WEBVTT|Kind:|Language:)/.test(raw)) continue;
    // Lines with inline <timing> tags are the newly spoken ones; a rolling cue
    // repeats the previous line without tags. Manual subtitles have no tags at
    // all, so for those only exact repeats are dropped.
    const timed = raw.includes('<');
    const text = raw
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!text || text === previous) continue;
    if (!timed && lines.slice(-3).some(([, t]) => t === text)) continue;
    lines.push([start, text]);
    previous = text;
  }

  const paragraphs = [];
  for (const [at, text] of lines) {
    const last = paragraphs.at(-1);
    if (!last || at - last[0] >= PARAGRAPH_SECONDS) paragraphs.push([at, text]);
    else last[1] += ` ${text}`;
  }
  return paragraphs;
}

const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Apply ["wrong", "right"] pairs to whole words only, in order. */
export function applyCorrections(text, corrections) {
  return corrections.reduce(
    (out, [wrong, right]) =>
      out.replace(
        new RegExp(
          `(?<![\\p{L}\\p{N}])${escapeRegExp(wrong)}(?![\\p{L}\\p{N}])`,
          'gu',
        ),
        right,
      ),
    text,
  );
}

function main() {
  const args = process.argv.slice(2).filter((a) => a !== '--manual');
  const manual = process.argv.includes('--manual');
  const [slug, vttPath, correctionsPath] = args;
  if (!slug || !vttPath) {
    console.error(
      'usage: node scripts/import-transcript.mjs <slug> <captions.vtt> [corrections.json] [--manual]',
    );
    process.exit(1);
  }
  const dir = resolve(process.cwd(), 'src/content/episodes', slug);
  const episodeFile = resolve(dir, 'episode.json');
  if (!existsSync(episodeFile)) {
    console.error(`no ${episodeFile}; create the episode folder first`);
    process.exit(1);
  }
  const { language } = JSON.parse(readFileSync(episodeFile, 'utf8'));
  const corrections = correctionsPath
    ? JSON.parse(readFileSync(correctionsPath, 'utf8'))
    : [];
  const segments = parseVtt(readFileSync(vttPath, 'utf8')).map(
    ([start, text]) => [start, applyCorrections(text, corrections)],
  );

  // One segment per line keeps the diff of a re-import readable.
  const body = segments.map((segment) => `    ${JSON.stringify(segment)}`);
  writeFileSync(
    resolve(dir, 'transcript.json'),
    `{\n  "source": "${manual ? 'manual' : 'youtube-auto-captions'}",\n  "language": "${language}",\n  "segments": [\n${body.join(',\n')}\n  ]\n}\n`,
  );
  const words = segments.reduce((n, [, t]) => n + t.split(' ').length, 0);
  console.log(`${slug}: ${segments.length} paragraphs, ${words} words`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
