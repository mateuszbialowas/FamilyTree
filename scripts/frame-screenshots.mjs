#!/usr/bin/env node
/**
 * Wrap each screenshot in `appstore-screenshots/<locale>/*.png` with the
 * iPhone frame at `assets/device-frames/iphone.png`, plus the dynamic-island
 * overlay at `assets/device-frames/iphone-notch.png`. Output goes to
 * `appstore-screenshots/<locale>/framed/*.png`.
 *
 * Usage:
 *   node scripts/frame-screenshots.mjs                  # all locales
 *   node scripts/frame-screenshots.mjs en pl            # specific locales
 *
 * The frame's inner screen rectangle is auto-detected by finding the solid
 * black region inside the bezel.
 */
import sharp from 'sharp';
import { readdirSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const FRAME_PATH = join(ROOT, 'assets/device-frames/iphone.png');
const NOTCH_PATH = join(ROOT, 'assets/device-frames/iphone-notch.png');
const SHOTS_ROOT = join(ROOT, 'appstore-screenshots');

// Output frame width in pixels. Source is 2478px so 1800 is a slight
// downscale, preserving detail without producing 5MB output PNGs.
const TARGET_FRAME_WIDTH = 1800;

// Dynamic-island offset from the top of the screen, as a fraction of the
// screen height. iPhone 16 Pro: ~11pt out of ~852pt = 1.3%.
const ISLAND_TOP_FRACTION = 0.013;

// Screen corner radius as a fraction of the screen width (iPhone 16 Pro is
// ~14% of width). Clips the screenshot so its square corners don't poke
// past the frame's rounded inner bezel.
const SCREEN_CORNER_FRACTION = 0.13;

// App background color — used to letterbox screenshots whose aspect ratio
// doesn't perfectly match the screen rect. Matches the app's own surface
// colour so any padding inside the bezel looks like a natural extension of
// the app rather than empty space.
const APP_BG = { r: 253, g: 245, b: 230, alpha: 1 }; // #FDF5E6

/**
 * Find the inner-screen rectangle by scanning for the solid black region
 * inside the bezel. The bezel is dark grey (RGB ~60), the screen is pure
 * black (RGB ~0), and outside the phone is transparent.
 */
async function detectScreenRect(framePath) {
  const img = sharp(framePath);
  const { width, height, channels } = await img.metadata();
  const raw = await img.ensureAlpha().raw().toBuffer();
  const isScreen = (x, y) => {
    const i = (y * width + x) * channels;
    if (raw[i + 3] < 200) return false; // transparent ⇒ outside phone
    return raw[i] + raw[i + 1] + raw[i + 2] < 30; // very dark ⇒ screen
  };
  const cx = (width / 2) | 0;
  const cy = (height / 2) | 0;

  let left = cx, right = cx, bottom = cy;
  while (left > 0 && isScreen(left - 1, cy)) left--;
  while (right < width - 1 && isScreen(right + 1, cy)) right++;
  while (bottom < height - 1 && isScreen(cx, bottom + 1)) bottom++;

  // Scan up from a column 10% inset from the left so any centered notch /
  // status-bar overlay can't stop the scan early.
  const safeX = left + Math.round((right - left) * 0.1);
  let top = cy;
  while (top > 0 && isScreen(safeX, top - 1)) top--;

  return { left, top, width: right - left + 1, height: bottom - top + 1, frameWidth: width, frameHeight: height };
}

async function frame(screenshotPath, framePath, notchPath, screenRect, outputPath) {
  const scale = TARGET_FRAME_WIDTH / screenRect.frameWidth;
  const targetH = Math.round(screenRect.frameHeight * scale);
  const screen = {
    left: Math.round(screenRect.left * scale),
    top: Math.round(screenRect.top * scale),
    width: Math.round(screenRect.width * scale),
    height: Math.round(screenRect.height * scale),
  };

  // Carve out the black screen pixels at SOURCE resolution before
  // resizing. The source frame has clean transitions (bezel RGB ~(60,58,56)
  // / screen RGB (0,0,0)). If we carve after resizing, lanczos resampling
  // blends bezel and screen RGB at the boundary into intermediate dark
  // values that read as a black hairline. Carving first — and replacing
  // screen RGB with the bezel colour so any post-resize alpha blending
  // interpolates between matching greys — produces a clean edge.
  const sourceRaw = await sharp(framePath).ensureAlpha().raw().toBuffer();
  const { width: srcW, height: srcH } = await sharp(framePath).metadata();
  const BEZEL_R = 60, BEZEL_G = 58, BEZEL_B = 56; // sampled from bezel core
  for (let i = 0; i < sourceRaw.length; i += 4) {
    if (sourceRaw[i] + sourceRaw[i + 1] + sourceRaw[i + 2] < 30) {
      sourceRaw[i] = BEZEL_R;
      sourceRaw[i + 1] = BEZEL_G;
      sourceRaw[i + 2] = BEZEL_B;
      sourceRaw[i + 3] = 0;
    }
  }
  const upscaledFrame = await sharp(sourceRaw, {
    raw: { width: srcW, height: srcH, channels: 4 },
  })
    .resize(TARGET_FRAME_WIDTH, targetH, { kernel: 'lanczos3' })
    .png()
    .toBuffer();

  // Scale the notch in proportion to the frame so its size matches.
  const notchMeta = await sharp(notchPath).metadata();
  const notchWidth = Math.round(notchMeta.width * scale);
  const notchHeight = Math.round(notchMeta.height * scale);
  const upscaledNotch = await sharp(notchPath)
    .resize(notchWidth, notchHeight, { kernel: 'lanczos3' })
    .png()
    .toBuffer();

  // Letterbox onto the cream app-background canvas so any aspect mismatch
  // looks like a natural extension of the app rather than an empty gap.
  const filled = await sharp(screenshotPath)
    .resize(screen.width, screen.height, { fit: 'contain', background: APP_BG })
    .flatten({ background: APP_BG })
    .png()
    .toBuffer();

  // Round the screenshot's corners to match the screen's rounded inner
  // bezel so the square corners don't poke past the bezel's curve.
  const cornerRadius = Math.round(screen.width * SCREEN_CORNER_FRACTION);
  const roundedMask = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${screen.width}" height="${screen.height}"><rect width="${screen.width}" height="${screen.height}" rx="${cornerRadius}" ry="${cornerRadius}" fill="white"/></svg>`,
  );
  const fitted = await sharp(filled)
    .composite([{ input: roundedMask, blend: 'dest-in' }])
    .png()
    .toBuffer();

  // Layer order:
  //   transparent base
  //   → screenshot (fills the screen rect)
  //   → frame (bezel masks any overflow)
  //   → notch (drawn over the screen content, like a real iPhone)
  const islandLeft = Math.round((TARGET_FRAME_WIDTH - notchWidth) / 2);
  const islandTop = screen.top + Math.round(screen.height * ISLAND_TOP_FRACTION);

  await sharp({
    create: {
      width: TARGET_FRAME_WIDTH,
      height: targetH,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      { input: fitted, top: screen.top, left: screen.left },
      { input: upscaledFrame, top: 0, left: 0 },
      { input: upscaledNotch, top: islandTop, left: islandLeft },
    ])
    .png({ compressionLevel: 9 })
    .toFile(outputPath);
}

async function main() {
  if (!existsSync(FRAME_PATH)) {
    console.error(`Missing frame at ${FRAME_PATH}`);
    process.exit(1);
  }
  if (!existsSync(NOTCH_PATH)) {
    console.error(`Missing notch at ${NOTCH_PATH}`);
    process.exit(1);
  }
  const screenRect = await detectScreenRect(FRAME_PATH);
  console.log(
    `Frame ${screenRect.frameWidth}×${screenRect.frameHeight}, screen at ` +
      `(${screenRect.left},${screenRect.top}) ${screenRect.width}×${screenRect.height}`,
  );

  const requested = process.argv.slice(2);
  const locales = requested.length > 0
    ? requested
    : readdirSync(SHOTS_ROOT).filter((name) => {
        const full = join(SHOTS_ROOT, name);
        return statSync(full).isDirectory() && name.length === 2;
      });

  for (const locale of locales) {
    const inDir = join(SHOTS_ROOT, locale);
    if (!existsSync(inDir)) {
      console.warn(`  skip ${locale}: no folder`);
      continue;
    }
    const outDir = join(inDir, 'framed');
    mkdirSync(outDir, { recursive: true });

    const files = readdirSync(inDir).filter((f) => f.endsWith('.png'));
    for (const file of files) {
      const out = join(outDir, file);
      await frame(join(inDir, file), FRAME_PATH, NOTCH_PATH, screenRect, out);
    }
    console.log(`  ${locale}: ${files.length} framed → ${outDir.replace(ROOT, '.')}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
