#!/usr/bin/env bash
# rerun.sh -- reproduce every META-289 result.
#
# Selection reproduces from the COMMITTED raw/universe.json without touching the
# GitHub API. The four cohort repositories are cloned here if absent.
#
# Re-materializing the universe from the live API is a separate opt-in step
# (scripts/universe.mjs) and will NOT reproduce the snapshot, because GitHub
# result sets drift. That is exactly why the snapshot is committed.
#
# Run from the repository root.
set -euo pipefail

WORK="${1:-}"
if [ -z "$WORK" ]; then
  echo "usage: bash docs/evidence/meta-289/rerun.sh <workDir>" >&2
  exit 2
fi
mkdir -p "$WORK"
export META289_WORK="$WORK"

HERE="docs/evidence/meta-289"

echo "== Selection from the committed universe snapshot (metadata only) =="
node "$HERE/scripts/select-cohort.mjs"

echo
echo "== Verification V1-V6 + backfill; clones the cohort (no outcome read) =="
node "$HERE/scripts/verify-cohort.mjs"

echo
echo "== Phase A: T0 suites and the three rankings (outcome NOT read) =="
node "$HERE/scripts/phase-a.mjs"

echo
echo "== Render Phase A receipts =="
node "$HERE/scripts/render-phase-a.mjs"

echo
echo "== Phase B: outcomes, metrics, disposition ladder =="
node "$HERE/scripts/phase-b.mjs"

echo
echo "== Validation: invariants I1-I11 and red tests RT1-RT7 =="
node "$HERE/scripts/checks.mjs"

echo
echo "== Render results =="
node "$HERE/scripts/render-results.mjs"
node "$HERE/scripts/render-report.mjs"

echo
echo "== Manifest =="
node "$HERE/scripts/manifest.mjs"
