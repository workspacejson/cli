#!/bin/sh
# rerun.sh — META-380 full reproduction.
#
# Preregistration : 5ccb7ff6dd7a59a276aa3d6aa372f3df3bf1505d  (binding)
# Pre-outcome     : 04557b2e3f33636e53fbfc5d7bd857315960083f  (frozen, no outcome data)
#
# Run from the repository root:  sh docs/evidence/meta-380/rerun.sh
#
# Phases A and B are deliberately separate. Phase A must be able to run to
# completion without any outcome file existing; Phase B is the first stage
# permitted to read the TEST-role changed files of an evaluation transaction.
set -eu

ROOT=$(git rev-parse --show-toplevel)
cd "$ROOT"
EV=docs/evidence/meta-380
CLONES=${META380_CLONES:-/tmp/meta-380-clones}

echo "==> toolchain"
node --version
git --version
node -e 'console.log("typescript", require("typescript").version)' 2>/dev/null \
  || node -e 'console.log("typescript", require("./node_modules/.pnpm/typescript@5.9.3/node_modules/typescript").version)'

# ---------------------------------------------------------------- Phase A
# Steps A1-A3 are metadata-only and rebuild the frozen universe, order and cohort.
# A1 contacts the GitHub API; the COMMITTED snapshot raw/universe.json is the
# universe of record, so A1 is skipped by default. Set META380_REFETCH=1 to
# re-materialize it (the live API will not reproduce a 2026-08-21 snapshot).
if [ "${META380_REFETCH:-0}" = "1" ]; then
  echo "==> A1 universe (live GitHub API — will NOT reproduce the frozen snapshot)"
  node $EV/scripts/universe.mjs
else
  echo "==> A1 universe: using committed snapshot raw/universe.json (frozen)"
fi

echo "==> A2 eligibility + seeded ordering (metadata only, no clone)"
node $EV/scripts/select-cohort.mjs

echo "==> A3 mechanical verification V1-V7 + cohort selection"
echo "    clones under: $CLONES"
META380_CLONES="$CLONES" node $EV/scripts/verify-cohort.mjs

echo "==> A4 pre-outcome ranking freeze (H, H-MAX, B0, B1, B2_STATIC/v1)"
echo "    this stage may NOT read the TEST-role changed files of any evaluation transaction"
node $EV/scripts/phase-a.mjs

# ---------------------------------------------------------------- Phase B
echo "==> B1 outcome extraction and scoring"
echo "    this is the FIRST stage permitted to read G(q)"
node $EV/scripts/phase-b.mjs

# ---------------------------------------------------------------- Validation
echo "==> V invariants and deliberate red tests"
echo "    every red test must change its measured quantity; an inert red test is INVALID, not PASS"
node $EV/scripts/checks.mjs

# ---------------------------------------------------------------- Evidence
echo "==> R durable evidence generation"
node $EV/scripts/report.mjs

echo
echo "==> disposition"
node -e 'const r=require("./docs/evidence/meta-380/raw/results.json");
console.log(`I=${r.I} P=${r.P} N=${r.N} -> ${r.rule} ${r.disposition}`);'
