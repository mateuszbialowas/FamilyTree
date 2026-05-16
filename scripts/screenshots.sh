#!/usr/bin/env bash
# Capture localized App Store screenshots for all 7 supported locales.
#
# Usage: ./scripts/screenshots.sh [pl en de nl no sv da]
#
# Prereqs:
#   - iOS Simulator booted with the FamilyTree app installed
#     IMPORTANT: install a RELEASE build, not the default dev build.
#     The dev build shows a blue "Refreshing..." bridge indicator on
#     top of the screen after every `simctl openurl` (the Maestro flow
#     uses deep links for navigation), polluting the screenshots.
#       npx expo run:ios --configuration Release --device "iPhone 16 Pro Max"
#   - Maestro CLI on PATH (maestro --version)
#   - The app's bundle id matches com.mateuszbialowas.FamilyTree
#
# Output: appstore-screenshots/<locale>/{settings,list,person-detail,tree,...}.png
#
# Architecture note: the Maestro flow at .maestro/screenshots.yaml is
# fully id-based (testID literals like "tab-tree"). The only
# navigation variable that varies per run is APP_LOCALE, which decides
# which marketing-family JSON to import. Tab labels, marker texts,
# person names — none of that needs per-locale env vars anymore.

# Per-locale failures shouldn't abort the whole run, so no `-e`.
set -uo pipefail

cd "$(dirname "$0")/.."
ROOT="$(pwd)"

LOCALES=("$@")
if [ ${#LOCALES[@]} -eq 0 ]; then
  LOCALES=(pl en de nl no sv da)
fi

OUT_ROOT="$ROOT/appstore-screenshots"
mkdir -p "$OUT_ROOT"

# Used only for the per-locale "===" log header. Adds nothing to the flow.
declare -A LANG_LABEL=(
  [pl]="Polski"  [en]="English"     [de]="Deutsch"
  [nl]="Nederlands"  [no]="Norsk"
  [sv]="Svenska" [da]="Dansk"
)

SUCCEEDED=()
FAILED=()

for L in "${LOCALES[@]}"; do
  echo
  echo "=== $L (${LANG_LABEL[$L]}) ==="

  # Note: the env var is APP_LOCALE, NOT LANG — LANG is a POSIX shell var
  # (locale, e.g. en_US.UTF-8) and would shadow the Maestro -e override.
  if maestro test -e APP_LOCALE="$L" .maestro/screenshots.yaml; then
    : # success — fall through to copy screenshots
  else
    echo "FAIL: maestro flow exited non-zero for $L; continuing" >&2
    FAILED+=("$L")
    continue
  fi

  # Maestro 2.2.0 writes screenshots to <cwd>/screenshots/<lang>/ (relative
  # to where `maestro test` was invoked, which is the repo root here).
  RAW_DIR="$ROOT/screenshots/$L"
  if [ -d "$RAW_DIR" ] && compgen -G "$RAW_DIR/*.png" > /dev/null; then
    mkdir -p "$OUT_ROOT/$L"
    cp "$RAW_DIR"/*.png "$OUT_ROOT/$L/"
    rm -rf "$RAW_DIR"
    echo "Saved → $OUT_ROOT/$L/"
    SUCCEEDED+=("$L")
  else
    echo "WARN: no screenshots found for $L at $RAW_DIR" >&2
    FAILED+=("$L")
  fi
done

echo
echo "Done. Output: $OUT_ROOT"
echo "Succeeded (${#SUCCEEDED[@]}): ${SUCCEEDED[*]:-none}"
echo "Failed    (${#FAILED[@]}): ${FAILED[*]:-none}"

# Frame each successful locale's screenshots inside the iPhone mockup.
if [ ${#SUCCEEDED[@]} -gt 0 ]; then
  echo
  echo "Framing screenshots..."
  node "$ROOT/scripts/frame-screenshots.mjs" "${SUCCEEDED[@]}" || \
    echo "WARN: framing step failed (raw screenshots are still in $OUT_ROOT)" >&2

  echo
  echo "Composing App Store marketing images (1290 × 2796)..."
  node "$ROOT/scripts/marketing-screenshots.mjs" "${SUCCEEDED[@]}" || \
    echo "WARN: marketing-compose step failed (framed shots are still in $OUT_ROOT/<locale>/framed)" >&2
fi

[ ${#FAILED[@]} -eq 0 ] || exit 1
