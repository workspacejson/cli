#!/usr/bin/env bash
# rerun.sh -- reproduce every META-378 result.
#
# Selection reproduces from the COMMITTED raw/universe.json without touching the
# GitHub API. Mining needs clones of the five cohort repositories at the frozen
# basis SHAs; they are cloned here if absent.
#
# Re-materializing the universe from the live API is a separate opt-in step
# (scripts/universe.mjs) and will NOT reproduce the snapshot, because GitHub
# result sets drift. That is exactly why the snapshot is committed.
#
# Run from the repository root.
set -euo pipefail

WORK="${1:-}"
if [ -z "$WORK" ]; then
  echo "usage: bash docs/evidence/meta-378/rerun.sh <workDir>" >&2
  exit 2
fi
mkdir -p "$WORK"

HERE="docs/evidence/meta-378"

echo "== Build the pinned miner =="
pnpm --filter @workspacejson/mining-core build >/dev/null
echo "mining-core tree: $(git rev-parse HEAD:packages/mining-core)"
echo "expected        : 1ab4f087a39f4526d49484e7260b080443d217f9"

echo
echo "== Selection from the committed universe snapshot (metadata only) =="
node "$HERE/scripts/select-cohort.mjs"

echo
echo "== Clone cohort repositories at the frozen bases (topology only) =="
node -e '
const c = require("./docs/evidence/meta-378/raw/cohort.json");
for (const s of Object.values(c.strata)) console.log(s.selected.full_name);
' | while read -r repo; do
  slug="${repo/\//__}"
  if [ ! -d "$WORK/$slug" ]; then
    echo "cloning $repo"
    git clone --no-checkout --filter=blob:none "https://github.com/$repo.git" "$WORK/$slug" 2>&1 | tail -1
  else
    echo "present  $repo"
  fi
done

echo
echo "== Verification + basis resolution (section 7, section 10) =="
node "$HERE/scripts/verify-and-freeze.mjs" "$WORK"

echo
echo "== Phase A: mine and characterize (outcome NOT read) =="
node "$HERE/scripts/phase-a.mjs" "$WORK"

echo
echo "== Phase A: denominator audit (outcome NOT read) =="
node "$HERE/scripts/denominators.mjs"

echo
echo "== Measurement compatibility against a META-375 basis =="
if [ ! -d "$WORK/compat_syncpack" ]; then
  git clone --no-checkout --filter=blob:none https://github.com/JamieMason/syncpack.git "$WORK/compat_syncpack" 2>&1 | tail -1
fi
node "$HERE/scripts/compat-check.mjs" "$WORK/compat_syncpack" > "$HERE/raw/compat-check.json"
node -e '
const s = require("fs").readFileSync("docs/evidence/meta-378/raw/compat-check.json","utf8");
const j = JSON.parse(s.slice(s.indexOf("{")));
require("fs").writeFileSync("docs/evidence/meta-378/raw/compat-check.json", JSON.stringify(j,null,2)+"\n");
console.log(`compatibility: ${j.passed}/${j.total} PASS`);
'

echo
echo "== Render Phase A receipts =="
node "$HERE/scripts/render-phase-a.mjs"

echo
echo "== Phase B: held-out outcome, primary and secondary =="
node "$HERE/scripts/phase-b.mjs" "$WORK"

echo
echo "== Render results =="
node "$HERE/scripts/render-results.mjs"

echo
echo "== Validation: invariants and red tests =="
node "$HERE/scripts/checks.mjs"

echo
echo "== Manifest =="
node "$HERE/scripts/manifest.mjs"
