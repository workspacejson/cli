// dump.mjs — full qualifying-population dump at a preregistered basis.
//
// Re-runs mine -> score -> select through the digest-pinned
// @workspacejson/mining-core tarball (resolved `file:` in the scratch run
// directory; this script must be executed from a copy inside that directory
// so bare imports resolve there). Emits every qualifying pair with its
// global rank under the frozen ranking rule, plus per-pair recency and
// subwindow presence derived from scored events only.
//
// Usage: node dump.mjs <label> <worktreeAtBasis> <outDir>
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { mine, score, select, compareUtf8 } from '@workspacejson/mining-core';

const [label, repoRoot, outDir] = process.argv.slice(2);
if (!label || !repoRoot || !outDir) {
  console.error('usage: node dump.mjs <label> <worktreeAtBasis> <outDir>');
  process.exit(2);
}

const observations = await mine(repoRoot);
const scored = score(observations);
const selection = select(scored, { minSupport: 3 });

// Frozen ranking rule, replicated verbatim for the full population.
// Verified against `select` by checks C2/C3/C4 in checks.mjs.
const ranked = [...scored.pairs].sort(
  (x, y) =>
    y.support - x.support ||
    x.occurrences - y.occurrences ||
    compareUtf8(x.files[0], y.files[0]) ||
    compareUtf8(x.files[1], y.files[1]),
);

const excluded = new Set(scored.exclusions.excludedCommits);
const scoredEvents = observations.events.filter((e) => !excluded.has(e.commit));
const origin = observations.events.length > 0 ? observations.events.length - 1 : 0;

const pairKey = (a, b) =>
  compareUtf8(a, b) <= 0 ? `${a} ${b}` : `${b} ${a}`;
const qualifying = new Set(ranked.map((p) => pairKey(p.files[0], p.files[1])));

// For each scored event, record which qualifying pairs it supports.
const positionsByPair = new Map();
for (const e of scoredEvents) {
  const fs = e.files;
  for (let i = 0; i < fs.length; i++) {
    for (let j = i + 1; j < fs.length; j++) {
      const k = pairKey(fs[i], fs[j]);
      if (qualifying.has(k)) {
        let arr = positionsByPair.get(k);
        if (!arr) positionsByPair.set(k, (arr = []));
        arr.push(e.position);
      }
    }
  }
}

const pairs = ranked.map((p, i) => {
  const positions = (positionsByPair.get(pairKey(p.files[0], p.files[1])) ?? []).sort(
    (x, y) => x - y,
  );
  const deltas = positions.map((pos) => origin - pos);
  const eventByPosition = new Map(observations.events.map((e) => [e.position, e.commit]));
  const subwindows = [false, false, false, false, false];
  for (const d of deltas) {
    if (d >= 0 && d <= 499) subwindows[Math.floor(d / 100)] = true;
  }
  return {
    rank: i + 1,
    files: [...p.files],
    support: p.support,
    occurrences: p.occurrences,
    emitted: i < 50,
    mostRecentSupport:
      positions.length > 0
        ? { commit: eventByPosition.get(positions[positions.length - 1]), deltaPos: deltas[deltas.length - 1] }
        : null,
    firstSupport:
      positions.length > 0
        ? { commit: eventByPosition.get(positions[0]), deltaPos: deltas[0] }
        : null,
    subwindowPresence: subwindows,
    scoredSupportingEvents: positions.length,
  };
});

writeFileSync(
  join(outDir, `${label}.dump.json`),
  JSON.stringify(
    {
      l0DumpVersion: 1,
      label,
      basisWindow: observations.basisWindow ?? null,
      completeness: {
        mine: observations.completeness,
        score: scored.completeness,
        selection: selection.completeness,
      },
      excludedCommits: scored.exclusions.excludedCommits,
      decayOriginPosition: origin,
      extractedEvents: observations.events.length,
      scoredEventCount: scoredEvents.length,
      selectionReceipt: selection.receipt,
      emittedPairs: selection.pairs.map((p) => ({
        files: [...p.files],
        support: p.support,
        occurrences: p.occurrences,
      })),
      pairs,
    },
    null,
    1,
  ) + '\n',
);
console.log(
  `${label}: qualifying=${pairs.length} emitted=${selection.receipt.pairsEmitted} ` +
    `extracted=${observations.basisWindow?.extractedTransitions} scoredEvents=${scoredEvents.length}`,
);
