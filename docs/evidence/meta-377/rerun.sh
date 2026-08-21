#!/usr/bin/env bash
# rerun.sh — reproduce every META-377 result from the frozen META-375 evidence.
#
# Deterministic: reads only committed JSON, performs no network access, runs no
# miner, and writes only under docs/evidence/meta-377/.
#
# Run from the repository root.
set -euo pipefail

HERE="docs/evidence/meta-377"
M375="docs/evidence/meta-375"

echo "== Phase 1: input gate =="
node "$HERE/scripts/verify-input.mjs" "$M375"

echo
echo "== Phase 3: denominator audit (outcome NOT read) =="
node "$HERE/scripts/denominators.mjs"
node "$HERE/scripts/render-denominators.mjs"

echo
echo "== Phase 4/5: conditioning, primary outcome =="
node "$HERE/scripts/condition.mjs" --outcome overlapUsable

echo
echo "== Phase 4/5: conditioning, preregistered sensitivity outcome =="
node "$HERE/scripts/condition.mjs" --outcome overlapAll

echo
echo "== Phase 6: composition test =="
node "$HERE/scripts/composition.mjs"

echo
echo "== Render results =="
node "$HERE/scripts/render-results.mjs"

echo
echo "== Validation: invariants and red tests =="
node "$HERE/scripts/checks.mjs"

echo
echo "== Manifest =="
node "$HERE/scripts/manifest.mjs"
