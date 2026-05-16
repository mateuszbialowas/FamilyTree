#!/usr/bin/env node
/**
 * Copy the iPhone-framed screenshots from
 *   appstore-screenshots/<locale>/framed/*.png
 * into
 *   docs/public/screenshots/<locale>/
 *
 * The docs site references these images via the locale path
 * (`/screenshots/<locale>/tree.png` etc.) so each language's docs
 * page shows screenshots taken in that language.
 *
 * Run after `./scripts/screenshots.sh` to keep the docs in sync with
 * the latest Maestro captures.
 */
import { existsSync, mkdirSync, readdirSync, copyFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const SRC_ROOT = join(ROOT, 'appstore-screenshots');
const DEST_ROOT = join(ROOT, 'docs/public/screenshots');

const LOCALES = ['pl', 'en', 'de', 'nl', 'no', 'sv', 'da'];

let totalCopied = 0;
let totalRemoved = 0;

for (const locale of LOCALES) {
  const srcDir = join(SRC_ROOT, locale, 'framed');
  const destDir = join(DEST_ROOT, locale);

  if (!existsSync(srcDir)) {
    console.warn(`skip ${locale}: no source at ${srcDir}`);
    continue;
  }

  mkdirSync(destDir, { recursive: true });

  // Remove stale destination files so renames in the maestro flow
  // (e.g. tree-zoomed-out.png → tree-rooted-at-ancestor.png) don't
  // leave orphans.
  for (const file of readdirSync(destDir)) {
    if (file.endsWith('.png')) {
      rmSync(join(destDir, file));
      totalRemoved++;
    }
  }

  const files = readdirSync(srcDir).filter((f) => f.endsWith('.png'));
  for (const file of files) {
    copyFileSync(join(srcDir, file), join(destDir, file));
    totalCopied++;
  }
  console.log(`  ${locale}: ${files.length} files`);
}

console.log(`\nDone. Copied ${totalCopied}, removed ${totalRemoved} stale.`);
