// Generates the social share card served as og:image.
//
// Runs as a pre-build step of `npm run build`; by hand:
//
//   node scripts/gen-og.mjs
//
// It is a script rather than a one-off because the card has hard requirements
// that are invisible until a link is actually pasted somewhere: 1200x630 (the
// ratio every platform crops to), and small enough that a preview does not cost
// half a megabyte on the reader's connection.
//
// The design lives in scripts/assets/og-card.svg: the same layout as the
// LinkedIn banners (halftone ground, lockup, "we want YOU for our community!",
// the domain and the PODCAST · COMUNIDADE · TECNOLOGIA eyebrow). Every glyph in
// it is already a path. sharp renders SVG with librsvg, which ignores
// @font-face data URIs and falls back to a system font, so live <text> would
// ship as DejaVu and differ between this machine and CI. Outlining once keeps
// the output identical everywhere, at the cost of the copy not being editable
// as text: to change a word, regenerate the SVG from the brand fonts (Fraunces
// 600, Geist Mono) rather than hand-editing paths.
//
// The SVG lives in scripts/assets/, not public/: it is a build input only, and
// anything under public/ is copied into dist/client and deployed.

import { readFileSync, renameSync } from 'node:fs';
import { resolve } from 'node:path';
import sharp from 'sharp';

const ROOT = process.cwd();
const CARD = resolve(ROOT, 'scripts/assets/og-card.svg');
const OUT = resolve(ROOT, 'public/img/og.jpg');

const W = 1200;
const H = 630;

const main = async () => {
  await sharp(readFileSync(CARD))
    .jpeg({
      quality: 88,
      progressive: true,
      chromaSubsampling: '4:2:0',
      mozjpeg: true,
    })
    .toFile(`${OUT}.tmp`)
    .then(() => renameSync(`${OUT}.tmp`, OUT));

  const bytes = readFileSync(OUT);
  const { width, height } = await sharp(OUT).metadata();
  console.log(
    `wrote public/img/og.jpg  ${width}x${height}  ${(bytes.length / 1024).toFixed(1)} kB`,
  );
  if (width !== W || height !== H) {
    console.error(`expected ${W}x${H}`);
    process.exitCode = 1;
  }
};

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
