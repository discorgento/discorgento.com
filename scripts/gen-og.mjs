// Generates the social share card served as og:image.
//
// Run it after changing the brand palette, the logo or the wordmark:
//
//   node scripts/gen-og.mjs
//
// It is a script rather than a one-off because the card has hard requirements
// that are invisible until a link is actually pasted somewhere: 1200x630 (the
// ratio every platform crops to), and small enough that a preview does not cost
// half a megabyte on the reader's connection.
//
// The previous og:image was public/img/bg-website-fhd.png: 1920x1080, 581 kB,
// and a near-flat dark texture with no text or logo in it — sharing a link
// produced an almost-black rectangle. Most of that weight was PNG failing to
// compress film grain, so this composites the same texture as a backdrop,
// darkens it, and lays the mark and wordmark on top.

import { readFileSync, renameSync } from 'node:fs';
import { resolve } from 'node:path';
import sharp from 'sharp';

const ROOT = process.cwd();
const TEXTURE = resolve(ROOT, 'public/img/bg-website-fhd.png');
const LOGO = resolve(ROOT, 'public/img/logo.svg');
const OUT = resolve(ROOT, 'public/img/og.jpg');

const W = 1200;
const H = 630;

// From src/styles/global.css @theme. Kept as literals because this runs outside
// Vite and cannot read the stylesheet.
const BG = '#0e0c0a';
const BRAND = '#ec6737'; // --color-brand-500, official primary
const INK = '#fde8e0'; // --color-brand-100

const font = (path) =>
  readFileSync(resolve(ROOT, 'node_modules/@fontsource-variable', path)).toString('base64');

const OUTFIT = font('outfit/files/outfit-latin-wght-normal.woff2');
const MONO = font('jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2');
const logoData =
  'data:image/svg+xml;base64,' + readFileSync(LOGO).toString('base64');

const overlay = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <style>
    @font-face{font-family:Outfit;src:url(data:font/woff2;base64,${OUTFIT}) format("woff2");font-weight:100 900}
    @font-face{font-family:Mono;src:url(data:font/woff2;base64,${MONO}) format("woff2");font-weight:100 800}
  </style>
  <rect width="${W}" height="${H}" fill="${BG}" opacity="0.55"/>
  <rect x="0" y="0" width="${W}" height="10" fill="${BRAND}"/>
  <rect x="0" y="${H - 10}" width="${W}" height="10" fill="${BRAND}"/>
  <image href="${logoData}" x="96" y="185" width="260" height="260"/>
  <text x="410" y="300" font-family="Outfit" font-weight="800" font-size="104"
        letter-spacing="-3" fill="${INK}">discorgento</text>
  <text x="414" y="368" font-family="Mono" font-weight="500" font-size="30"
        letter-spacing="7" fill="${BRAND}">DISCORGENTO.COM</text>
  <rect x="410" y="404" width="560" height="3" fill="${BRAND}" opacity="0.45"/>
  <text x="414" y="462" font-family="Mono" font-weight="400" font-size="26"
        letter-spacing="2" fill="${INK}" opacity="0.72">MAGENTO · PHP · JAVASCRIPT · E-COMMERCE</text>
</svg>`;

const main = async () => {
  const backdrop = await sharp(TEXTURE)
    .resize(W, H, { fit: 'cover', position: 'centre' })
    // Grain at full strength is what made the PNG 581 kB. Keep the texture as a
    // hint, not as the subject.
    .modulate({ brightness: 0.5, saturation: 0.85 })
    .modulate({ brightness: 0.92 })
    .toBuffer();

  await sharp(backdrop)
    .composite([{ input: Buffer.from(overlay), top: 0, left: 0 }])
    .flatten({ background: BG })
    .jpeg({ quality: 88, progressive: true, chromaSubsampling: '4:2:0', mozjpeg: true })
    .toFile(`${OUT}.tmp`)
    .then(() => renameSync(`${OUT}.tmp`, OUT));

  const bytes = readFileSync(OUT);
  const { width, height } = await sharp(OUT).metadata();
  console.log(`wrote public/img/og.jpg  ${width}x${height}  ${(bytes.length / 1024).toFixed(1)} kB`);
  if (width !== W || height !== H) {
    console.error(`expected ${W}x${H}`);
    process.exitCode = 1;
  }
};

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});