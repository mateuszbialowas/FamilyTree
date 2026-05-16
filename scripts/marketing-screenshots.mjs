#!/usr/bin/env node
/**
 * Compose App Store marketing screenshots (1290 × 2796, iPhone 6.7"):
 *   warm sepia gradient background
 *   + localized headline (Playfair Display)
 *   + localized subline (Lora)
 *   + iPhone-framed app screenshot centered below
 *
 * Reads:
 *   appstore-screenshots/<locale>/framed/<screen>.png  (from frame-screenshots.mjs)
 *   assets/marketing-strings/<locale>.json             (headline + subline per screen)
 *
 * Writes:
 *   appstore-marketing/<locale>/<screen>.png  (1290 × 2796)
 *
 * Usage:
 *   node scripts/marketing-screenshots.mjs              # all locales
 *   node scripts/marketing-screenshots.mjs en pl        # selected locales
 */
import sharp from 'sharp';
import TextToSVG from 'text-to-svg';
import { readdirSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const SHOTS_ROOT = join(ROOT, 'appstore-screenshots');
const STRINGS_ROOT = join(ROOT, 'assets/marketing-strings');
const OUT_ROOT = join(ROOT, 'appstore-marketing');

const W = 1290;
const H = 2796;

// Five screens that map to the five marketing-strings keys.
const SCREENS = ['tree', 'list', 'person-detail', 'tree-rooted-at-ancestor', 'settings'];

// FamilyTree palette (matches src/theme/colors.ts surface/background tones).
const BG_TOP = '#FDF5E6';     // cream (app background)
const BG_MID = '#E8C9A0';     // warm sand
const BG_BOTTOM = '#C8956F';  // burnt sienna
const TEXT_PRIMARY = '#3E2723';   // dark brown (theme text)
const TEXT_SUBLINE = '#8D6E63';   // muted brown (theme textMuted)

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

/**
 * Render multi-line text where EACH line is independently centered
 * within `canvasWidth`. Anchoring all lines to the same x (the widest
 * line's left edge) leaves shorter lines visually flush-left inside
 * the headline block, which reads as a typesetting mistake even
 * though the block as a whole is centered.
 */
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

/**
 * Return the largest fontSize ≤ `maxSize` such that every line of
 * `text` fits within `maxWidth`. Width scales linearly with font size,
 * so we compute the per-pixel scale once at `maxSize` and back-solve.
 */
function fitFontSize(font, text, maxSize, maxWidth) {
  const probe = measure(font, text, maxSize);
  if (probe.width <= maxWidth) return maxSize;
  return Math.floor(maxSize * (maxWidth / probe.width));
}

async function compose({ locale, screen, headline, subline, framedPath, outputPath }) {
  // 1. Gradient background as SVG.
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

  // 2. Text block as SVG (Playfair headline + Lora subline rendered to paths).
  //
  // Headline/subline sizes are upper bounds — if the longest line would
  // overflow the safe inner width (canvas minus side margin), we shrink
  // proportionally so no character ever clips. This is a "fit-to-box"
  // approach: copy can vary in length across locales and we never have
  // to manually re-tune sizes per language.
  const SIDE_MARGIN = 60;
  const safeWidth = W - SIDE_MARGIN * 2;
  const headlineSize = fitFontSize(headlineFont, headline, 116, safeWidth);
  const sublineSize = fitFontSize(sublineFont, subline, 46, safeWidth);
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

  // Vertical layout: top padding 200px, headline, 50px gap, subline.
  const headlineTop = 200;
  const sublineTop = headlineTop + headlineDims.height + 50;

  const textSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
      <g transform="translate(0, ${headlineTop})">${headlinePaths}</g>
      <g transform="translate(0, ${sublineTop})">${sublinePaths}</g>
    </svg>
  `;

  // 3. Phone — fit width to ~78% of canvas, centered below text.
  const phoneMeta = await sharp(framedPath).metadata();
  const phoneW = Math.round(W * 0.78);
  const phoneH = Math.round((phoneMeta.height / phoneMeta.width) * phoneW);
  const phone = await sharp(framedPath)
    .resize(phoneW, phoneH, { fit: 'inside' })
    .png()
    .toBuffer();

  const phoneTop = sublineTop + sublineDims.height + 110;
  const phoneLeft = Math.round((W - phoneW) / 2);

  // 4. Composite.
  await sharp(Buffer.from(bgSvg))
    .composite([
      { input: Buffer.from(textSvg), top: 0, left: 0 },
      { input: phone, top: phoneTop, left: phoneLeft },
    ])
    .png({ compressionLevel: 9 })
    .toFile(outputPath);

  console.log(`  ${locale}/${screen}.png`);
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
    const framedDir = join(SHOTS_ROOT, locale, 'framed');
    if (!existsSync(framedDir)) {
      console.warn(`skip ${locale}: no framed screenshots at ${framedDir}`);
      continue;
    }

    const strings = JSON.parse(readFileSync(stringsPath, 'utf8'));
    const outDir = join(OUT_ROOT, locale);
    mkdirSync(outDir, { recursive: true });

    console.log(`${locale}:`);
    for (const screen of SCREENS) {
      const framedPath = join(framedDir, `${screen}.png`);
      if (!existsSync(framedPath)) {
        console.warn(`  skip ${screen}: no framed source at ${framedPath}`);
        continue;
      }
      const copy = strings[screen];
      if (!copy) {
        console.warn(`  skip ${screen}: missing strings entry`);
        continue;
      }
      await compose({
        locale,
        screen,
        headline: copy.headline,
        subline: copy.subline,
        framedPath,
        outputPath: join(outDir, `${screen}.png`),
      });
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
