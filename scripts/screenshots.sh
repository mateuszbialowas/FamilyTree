#!/usr/bin/env bash
# Capture localized App Store screenshots for all 8 supported locales.
#
# Usage: ./scripts/screenshots.sh [pl en de he nl no sv da]
#
# Prereqs:
#   - iOS Simulator booted with the FamilyTree app installed
#   - Maestro CLI on PATH (maestro --version)
#   - The app's bundle id matches com.mateuszbialowas.FamilyTree
#
# Output: appstore-screenshots/<locale>/{settings,list,person-detail,tree}.png

# Per-locale failures shouldn't abort the whole run, so no `-e`.
set -uo pipefail

cd "$(dirname "$0")/.."
ROOT="$(pwd)"

LOCALES=("$@")
if [ ${#LOCALES[@]} -eq 0 ]; then
  LOCALES=(pl en de he nl no sv da)
fi

OUT_ROOT="$ROOT/appstore-screenshots"
mkdir -p "$OUT_ROOT"

# Per-locale label overrides used by .maestro/screenshots.yaml.
# Match the strings in src/i18n/<lang>.ts: nav.tab*, settings.importJson, settings.importConfirmCta.
declare -A TAB_TREE=(
  [pl]="Drzewo"      [en]="Tree"     [de]="Baum"   [he]="אילן"
  [nl]="Boom"        [no]="Tre"      [sv]="Träd"   [da]="Træ"
)
declare -A TAB_LIST=(
  [pl]="Lista"       [en]="List"     [de]="Liste"  [he]="רשימה"
  [nl]="Lijst"       [no]="Liste"    [sv]="Lista"  [da]="Liste"
)
declare -A TAB_SETTINGS=(
  [pl]="Ustawienia"  [en]="Settings"      [de]="Einstellungen"  [he]="הגדרות"
  [nl]="Instellingen" [no]="Innstillinger" [sv]="Inställningar" [da]="Indstillinger"
)
declare -A LANG_LABEL=(
  [pl]="Polski"  [en]="English"     [de]="Deutsch"
  [he]="עברית"   [nl]="Nederlands"  [no]="Norsk"
  [sv]="Svenska" [da]="Dansk"
)

SUCCEEDED=()
FAILED=()

for L in "${LOCALES[@]}"; do
  echo
  echo "=== $L (${LANG_LABEL[$L]}) ==="

  # Run the Maestro flow with locale-specific env. The flow uses the
  # family-tree://load-sample/<locale> deep link (see FamilyContext.tsx)
  # which switches the language and loads the bundled sample family —
  # no file picker, no simctl push.
  # Note: the env var is APP_LOCALE, NOT LANG — LANG is a POSIX shell var
  # (locale, e.g. en_US.UTF-8) and would shadow the Maestro -e override.
  if maestro test \
    -e APP_LOCALE="$L" \
    -e TAB_TREE="${TAB_TREE[$L]}" \
    -e TAB_LIST="${TAB_LIST[$L]}" \
    -e TAB_SETTINGS="${TAB_SETTINGS[$L]}" \
    .maestro/screenshots.yaml; then
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
[ ${#FAILED[@]} -eq 0 ] || exit 1
