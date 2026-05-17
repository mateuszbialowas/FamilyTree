#!/usr/bin/env node
/**
 * Compose App Store marketing screenshots for iPad 13" Display (2064 × 2752):
 *   warm sepia gradient background
 *   + localized headline (Playfair Display)
 *   + localized subline (Lora)
 *   + flat (no bezel) app screenshot with rounded corners + drop shadow
 *
 * Reads:
 *   appstore-screenshots/<locale>/ipad/<screen>.png  (per-locale, from screenshots-ipad.sh)
 *   assets/marketing-strings/<locale>.json           (headline + subline per screen)
 *
 * Writes:
 *   appstore-marketing/<locale>/ipad/<screen>.png   (2064 × 2752, separate
 *                                                    folder so it doesn't
 *                                                    clash with iPhone outputs)
 *
 * On iPad we ship only one tree screenshot — the wide canvas fits the whole
 * pedigree at once, so the dual `tree` + `tree-rooted-at-ancestor` split
 * used for iPhone is unnecessary. We use the ancestor-rooted variant
 * (descendants fanning down from a great-grandfather) since it visually
 * shows the entire family in one frame.
 *
 * Usage:
 *   node scripts/marketing-screenshots-ipad.mjs           # all locales
 *   node scripts/marketing-screenshots-ipad.mjs en pl     # selected locales
 */
import sharp from 'sharp';
import TextToSVG from 'text-to-svg';
import { readdirSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const SHOTS_ROOT = join(ROOT, 'appstore-screenshots');
const STRINGS_ROOT = join(ROOT, 'assets/marketing-strings');
const OUT_ROOT = join(ROOT, 'appstore-marketing');

const W = 2064;
const H = 2752;

// Output filename → source iPad screenshot key → marketing-strings key.
// Outputs land in appstore-marketing/<locale>/ipad/<outName>.png so iPad
// assets sit in a sibling folder to iPhone ones rather than clashing.
// iPad tree is rooted at "me" (the user) showing their own ancestry —
// the `tree` headline ("Your roots. / Your story.") fits the content;
// the `tree-rooted-at-ancestor` copy ("From one couple — your whole
// family") is iPhone-only and tied to a different root.
const SCREENS = [
  { outName: 'tree',          source: 'tree',          stringsKey: 'tree' },
  { outName: 'list',          source: 'list',          stringsKey: 'list' },
  { outName: 'person-detail', source: 'person-detail', stringsKey: 'person-detail' },
  { outName: 'settings',      source: 'settings',      stringsKey: 'settings' },
];

const BG_TOP = '#FDF5E6';
const BG_MID = '#E8C9A0';
const BG_BOTTOM = '#C8956F';
const TEXT_PRIMARY = '#3E2723';
const TEXT_SUBLINE = '#8D6E63';

const FONT_HEADLINE = join(
  ROOT,
  'node_modules/@expo-google-fonts/playfair-display/700Bold/PlayfairDisplay_700Bold.ttf',
);
const FONT_SUBLINE = join(
  ROOT,
  'node_modules/@expo-google-fonts/lora/400Regular/Lora_400Regular.ttf',
);

const headlineFont = TextToSVG.loadSync(FONT_HEADLINE);
const sublineFont = TextToSVG.loadSync(FONT_SUBLINE);

function textPaths(font, text, { fontSize, fill, canvasWidth, lineHeight = 1.15 }) {
  const lines = text.split('\n');
  const lh = Math.round(fontSize * lineHeight);
  return lines
    .map((line, i) => {
      const m = font.getMetrics(line, { fontSize });
      const x = Math.round((canvasWidth - m.width) / 2);
      return font.getPath(line, {
        x,
        y: i * lh,
        fontSize,
        anchor: 'left top',
        attributes: { fill },
      });
    })
    .join('');
}

function measure(font, text, fontSize) {
  const lines = text.split('\n');
  let maxW = 0;
  for (const line of lines) {
    const m = font.getMetrics(line, { fontSize });
    if (m.width > maxW) maxW = m.width;
  }
  return { width: maxW, height: lines.length * Math.round(fontSize * 1.15) };
}

function fitFontSize(font, text, maxSize, maxWidth) {
  const probe = measure(font, text, maxSize);
  if (probe.width <= maxWidth) return maxSize;
  return Math.floor(maxSize * (maxWidth / probe.width));
}

async function compose({ locale, outName, headline, subline, sourcePath, outputPath }) {
  const bgSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${BG_TOP}"/>
          <stop offset="55%" stop-color="${BG_MID}"/>
          <stop offset="100%" stop-color="${BG_BOTTOM}"/>
        </linearGradient>
      </defs>
      <rect width="${W}" height="${H}" fill="url(#g)"/>
    </svg>
  `;

  const SIDE_MARGIN = 120;
  const safeWidth = W - SIDE_MARGIN * 2;
  const headlineSize = fitFontSize(headlineFont, headline, 120, safeWidth);
  const sublineSize = fitFontSize(sublineFont, subline, 48, safeWidth);
  const headlineDims = measure(headlineFont, headline, headlineSize);
  const sublineDims = measure(sublineFont, subline, sublineSize);

  const headlinePaths = textPaths(headlineFont, headline, {
    fontSize: headlineSize,
    fill: TEXT_PRIMARY,
    canvasWidth: W,
  });
  const sublinePaths = textPaths(sublineFont, subline, {
    fontSize: sublineSize,
    fill: TEXT_SUBLINE,
    canvasWidth: W,
  });

  const headlineTop = 180;
  const sublineTop = headlineTop + headlineDims.height + 40;
  const textSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
      <g transform="translate(0, ${headlineTop})">${headlinePaths}</g>
      <g transform="translate(0, ${sublineTop})">${sublinePaths}</g>
    </svg>
  `;

  const textBandBottom = sublineTop + sublineDims.height;
  const screenshotTop = textBandBottom + 80;
  const screenshotMaxH = H - screenshotTop - 100;

  const srcMeta = await sharp(sourcePath).metadata();
  const aspect = srcMeta.width / srcMeta.height;
  let screenshotH = screenshotMaxH;
  let screenshotW = Math.round(screenshotH * aspect);
  const maxAllowedW = W - 200;
  if (screenshotW > maxAllowedW) {
    screenshotW = maxAllowedW;
    screenshotH = Math.round(screenshotW / aspect);
  }
  const screenshotLeft = Math.round((W - screenshotW) / 2);

  const radius = Math.round(screenshotW * 0.04);
  const maskSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${screenshotW}" height="${screenshotH}">
      <rect x="0" y="0" width="${screenshotW}" height="${screenshotH}" rx="${radius}" ry="${radius}" fill="#fff"/>
    </svg>
  `;

  const screenshotBuf = await sharp(sourcePath)
    .resize(screenshotW, screenshotH, { fit: 'fill' })
    .composite([{ input: Buffer.from(maskSvg), blend: 'dest-in' }])
    .png()
    .toBuffer();

  const shadowPadding = 60;
  const shadowSvg = `
    <svg xmlns="http://www.w3.org/2000/svg"
         width="${screenshotW + shadowPadding * 2}"
         height="${screenshotH + shadowPadding * 2}">
      <defs>
        <filter id="b" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="35"/>
        </filter>
      </defs>
      <rect x="${shadowPadding}" y="${shadowPadding + 20}"
            width="${screenshotW}" height="${screenshotH}"
            rx="${radius}" ry="${radius}"
            fill="rgba(62,39,35,0.35)" filter="url(#b)"/>
    </svg>
  `;

  await sharp(Buffer.from(bgSvg))
    .composite([
      { input: Buffer.from(textSvg), top: 0, left: 0 },
      {
        input: Buffer.from(shadowSvg),
        top: screenshotTop - shadowPadding,
        left: screenshotLeft - shadowPadding,
      },
      { input: screenshotBuf, top: screenshotTop, left: screenshotLeft },
    ])
    .png({ compressionLevel: 9 })
    .toFile(outputPath);

  console.log(`  ${locale}/ipad/${outName}.png`);
}

async function main() {
  const requested = process.argv.slice(2);
  const locales = requested.length > 0
    ? requested
    : readdirSync(STRINGS_ROOT)
        .filter((f) => f.endsWith('.json'))
        .map((f) => f.replace(/\.json$/, ''));

  for (const locale of locales) {
    const stringsPath = join(STRINGS_ROOT, `${locale}.json`);
    if (!existsSync(stringsPath)) {
      console.warn(`skip ${locale}: no strings at ${stringsPath}`);
      continue;
    }
    const ipadDir = join(SHOTS_ROOT, locale, 'ipad');
    if (!existsSync(ipadDir)) {
      console.warn(`skip ${locale}: no iPad screenshots at ${ipadDir}`);
      continue;
    }

    const strings = JSON.parse(readFileSync(stringsPath, 'utf8'));
    const outDir = join(OUT_ROOT, locale, 'ipad');
    mkdirSync(outDir, { recursive: true });

    console.log(`${locale}:`);
    for (const screen of SCREENS) {
      const sourcePath = join(ipadDir, `${screen.source}.png`);
      if (!existsSync(sourcePath)) {
        console.warn(`  skip ${screen.outName}: no source at ${sourcePath}`);
        continue;
      }
      const copy = strings[screen.stringsKey];
      if (!copy) {
        console.warn(`  skip ${screen.outName}: missing strings entry "${screen.stringsKey}"`);
        continue;
      }
      await compose({
        locale,
        outName: screen.outName,
        headline: copy.headline,
        subline: copy.subline,
        sourcePath,
        outputPath: join(outDir, `${screen.outName}.png`),
      });
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
