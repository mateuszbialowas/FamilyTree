#!/usr/bin/env bash
# Capture localized App Store screenshots on an iPad simulator, for all 7
# supported locales. Same Maestro flow as the iPhone path — the simulator's
# active device decides the output dimensions.
#
# Usage: ./scripts/screenshots-ipad.sh [pl en de nl no sv da]
#
# Prereqs:
#   - iPad simulator booted with a RELEASE build of FamilyTree installed.
#     Target the same device for which you want App Store assets, e.g.:
#       xcrun simctl boot "iPad Pro 13-inch (M4)"
#       npx expo run:ios --configuration Release --device "iPad Pro 13-inch (M4)"
#     The iPad Pro 13" (M4) simulator natively renders at 2064×2752 — the
#     exact size required by the App Store "iPad 13" Display" slot.
#   - Maestro CLI on PATH (maestro --version)
#   - The app's bundle id matches com.mateuszbialowas.FamilyTree
#
# Output:
#   appstore-screenshots/<locale>/ipad/{tree,list,person-detail,...}.png
#   appstore-marketing/<locale>/ipad-{tree,list,...}.png      (composed)
#
# Why a separate script?
#   The iPhone screenshots.sh wraps shots in the iPhone bezel via
#   frame-screenshots.mjs; the iPad path skips framing entirely (clean look,
#   no iPad bezel asset shipped). Output of this script feeds directly into
#   marketing-screenshots-ipad.mjs.

set -uo pipefail

cd "$(dirname "$0")/.."
ROOT="$(pwd)"

LOCALES=("$@")
if [ ${#LOCALES[@]} -eq 0 ]; then
  LOCALES=(pl en de nl no sv da)
fi

OUT_ROOT="$ROOT/appstore-screenshots"
mkdir -p "$OUT_ROOT"

declare -A LANG_LABEL=(
  [pl]="Polski"  [en]="English"     [de]="Deutsch"
  [nl]="Nederlands"  [no]="Norsk"
  [sv]="Svenska" [da]="Dansk"
)

SUCCEEDED=()
FAILED=()

for L in "${LOCALES[@]}"; do
  echo
  echo "=== $L (${LANG_LABEL[$L]}) — iPad ==="

  if maestro test -e APP_LOCALE="$L" .maestro/screenshots-ipad.yaml; then
    : # success — fall through to copy
  else
    echo "FAIL: maestro flow exited non-zero for $L; continuing" >&2
    FAILED+=("$L")
    continue
  fi

  RAW_DIR="$ROOT/screenshots/$L"
  if [ -d "$RAW_DIR" ] && compgen -G "$RAW_DIR/*.png" > /dev/null; then
    mkdir -p "$OUT_ROOT/$L/ipad"
    cp "$RAW_DIR"/*.png "$OUT_ROOT/$L/ipad/"
    rm -rf "$RAW_DIR"
    echo "Saved → $OUT_ROOT/$L/ipad/"
    SUCCEEDED+=("$L")
  else
    echo "WARN: no screenshots found for $L at $RAW_DIR" >&2
    FAILED+=("$L")
  fi
done

echo
echo "Done capturing. Output: $OUT_ROOT/<locale>/ipad/"
echo "Succeeded (${#SUCCEEDED[@]}): ${SUCCEEDED[*]:-none}"
echo "Failed    (${#FAILED[@]}): ${FAILED[*]:-none}"

if [ ${#SUCCEEDED[@]} -gt 0 ]; then
  echo
  echo "Composing App Store iPad marketing images (2064 × 2752)..."
  node "$ROOT/scripts/marketing-screenshots-ipad.mjs" "${SUCCEEDED[@]}" || \
    echo "WARN: marketing-compose step failed (raw shots are still in $OUT_ROOT/<locale>/ipad/)" >&2
fi

[ ${#FAILED[@]} -eq 0 ] || exit 1
