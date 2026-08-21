// condition.mjs — META-377 Phase 4 (one-dimensional) and Phase 5 (joint).
//
// This is the first script permitted to read the frozen held-out overlap
// outcome. Every grouping rule, the comparability threshold, the three joint
// views, and the disposition rule were frozen at commit f09a1c96 before this
// script produced any number.
//
// Primary analysis is PER BASIS. Repositories and bases are never pooled to
// manufacture denominator support.
//
// Usage: node condition.mjs [--outcome overlapUsable|overlapAll]

import { writeFileSync } from 'node:fs';
import {
  load, M375, BASES, HELD_OUT_BASES, PIN_BASES,
  DIMENSIONS, JOINT_VIEWS, buildCells,
} from './lib.mjs';

const oi = process.argv.indexOf('--outcome');
const OUTCOME = oi >= 0 ? process.argv[oi + 1] : 'overlapUsable';
if (!['overlapUsable', 'overlapAll'].includes(OUTCOME)) throw new Error(`bad outcome ${OUTCOME}`);

const rows = load(M375, { withOutcome: true });

// Pin bases have an empty held-out window by definition and contribute no
// recurrence observation. Enforced, not assumed.
const pinRows = rows.filter((r) => PIN_BASES.includes(r.basis));
if (pinRows.some((r) => r.overlapUsable || r.overlapAll)) {
  throw new Error('a pin base carries a held-out overlap outcome; window must be empty');
}
const heldOut = rows.filter((r) => r.hasHeldOutWindow);
if (new Set(heldOut.map((r) => r.basis)).size !== 6) {
  throw new Error('expected exactly six bases with a frozen held-out window');
}

const sign = (d) => (d > 0 ? '+' : d < 0 ? '-' : '0');

function analyse(views, node) {
  for (const v of views) {
    node[v.id] = { name: v.name, bases: {} };
    for (const basis of HELD_OUT_BASES) {
      const cells = buildCells(heldOut.filter((r) => r.basis === basis), v.of, OUTCOME);
      const comparable = cells.filter((c) => c.class === 'COMPARABLE');
      node[v.id].bases[basis] = {
        cells,
        comparable: comparable.length,
        P: comparable.filter((c) => c.rateDiff > 0).length,
        Z: comparable.filter((c) => c.rateDiff === 0).length,
        N: comparable.filter((c) => c.rateDiff < 0).length,
        sparseOrUnavailable: cells.filter((c) => c.class !== 'COMPARABLE').length,
      };
    }
  }
}

const out = { outcome: OUTCOME, marginal: {}, oneDimensional: {}, joint: {} };

// D1/D2 reference point: the per-basis unconditioned marginal. This is
// META-375's headline measure, recomputed here from the frozen records.
for (const basis of HELD_OUT_BASES) {
  const br = heldOut.filter((r) => r.basis === basis);
  const e = br.filter((r) => r.emitted);
  const o = br.filter((r) => !r.emitted);
  const eX = e.filter((r) => r[OUTCOME]).length;
  const oX = o.filter((r) => r[OUTCOME]).length;
  out.marginal[basis] = {
    emittedX: eX, emittedN: e.length, omittedX: oX, omittedN: o.length,
    emittedRate: eX / e.length, omittedRate: oX / o.length,
    rateDiff: eX / e.length - oX / o.length,
  };
}

analyse(DIMENSIONS, out.oneDimensional);
analyse(JOINT_VIEWS, out.joint);

// --- ANALYSIS-PLAN §7 disposition rule, applied mechanically ---------------
// Operates only on COMPARABLE cells of D3-D7 at the six held-out bases.
const C = [];
for (const d of DIMENSIONS) {
  for (const basis of HELD_OUT_BASES) {
    for (const c of out.oneDimensional[d.id].bases[basis].cells) {
      if (c.class === 'COMPARABLE') C.push({ dim: d.id, basis, ...c, sign: sign(c.rateDiff) });
    }
  }
}
const P = C.filter((c) => c.sign === '+').length;
const Z = C.filter((c) => c.sign === '0').length;
const N = C.filter((c) => c.sign === '-').length;
const perBasis = {};
for (const basis of HELD_OUT_BASES) {
  const cc = C.filter((c) => c.basis === basis);
  perBasis[basis] = {
    comparable: cc.length,
    P: cc.filter((c) => c.sign === '+').length,
    Z: cc.filter((c) => c.sign === '0').length,
    N: cc.filter((c) => c.sign === '-').length,
  };
}
const B = HELD_OUT_BASES.filter((b) => perBasis[b].comparable > 0).length;

let disposition, why;
if (C.length === 0 || B < 4) {
  disposition = 'INSUFFICIENT_WITHIN_STRATUM_SUPPORT';
  why = `|C|=${C.length}, B=${B} (branch 1: |C|==0 or B<4)`;
} else if (
  P / C.length >= 2 / 3 &&
  N / C.length <= 1 / 6 &&
  HELD_OUT_BASES.every((b) => perBasis[b].comparable === 0 || perBasis[b].P >= perBasis[b].N)
) {
  disposition = 'SEPARATION_SURVIVES_CONDITIONING';
  why = `P/|C|=${(P / C.length).toFixed(3)}>=0.667, N/|C|=${(N / C.length).toFixed(3)}<=0.167, no basis net-negative (branch 2)`;
} else if (P / C.length <= 1 / 2 && (P - N) / C.length <= 1 / 6) {
  disposition = 'SEPARATION_EXPLAINED_BY_COMPOSITION';
  why = `P/|C|=${(P / C.length).toFixed(3)}<=0.5, (P-N)/|C|=${((P - N) / C.length).toFixed(3)}<=0.167 (branch 3)`;
} else {
  disposition = 'MIXED_CONDITIONAL_EFFECTS';
  why = `P/|C|=${(P / C.length).toFixed(3)}, N/|C|=${(N / C.length).toFixed(3)}, (P-N)/|C|=${((P - N) / C.length).toFixed(3)} — no branch 2 or 3 condition met (branch 4, fallback)`;
}

out.disposition = {
  rule: 'ANALYSIS-PLAN §7',
  scope: 'COMPARABLE cells of D3–D7 at the six held-out bases',
  C: C.length, P, Z, N, B,
  perBasis,
  ratios: {
    'P/|C|': P / C.length,
    'N/|C|': N / C.length,
    '(P-N)/|C|': (P - N) / C.length,
  },
  disposition,
  why,
  cells: C,
};

writeFileSync(
  `docs/evidence/meta-377/tables/conditioned.${OUTCOME}.json`,
  `${JSON.stringify(out, null, 2)}\n`,
);

console.log(`outcome=${OUTCOME}`);
console.log('--- per-basis marginal (D1/D2 reference point) ---');
for (const [b, m] of Object.entries(out.marginal)) {
  console.log(`${b}: emitted ${m.emittedX}/${m.emittedN} (${(m.emittedRate * 100).toFixed(1)}%) vs omitted ${m.omittedX}/${m.omittedN} (${(m.omittedRate * 100).toFixed(1)}%)  diff ${(m.rateDiff * 100).toFixed(1)}pp`);
}
console.log('--- one-dimensional comparable-cell signs ---');
for (const d of DIMENSIONS) {
  const cc = C.filter((c) => c.dim === d.id);
  console.log(`${d.id} ${d.name}: comparable=${cc.length} P=${cc.filter((c) => c.sign === '+').length} Z=${cc.filter((c) => c.sign === '0').length} N=${cc.filter((c) => c.sign === '-').length}`);
}
console.log('--- per basis ---');
for (const [b, v] of Object.entries(perBasis)) console.log(`${b}: C=${v.comparable} P=${v.P} Z=${v.Z} N=${v.N}`);
console.log('--- joint ---');
for (const j of JOINT_VIEWS) {
  let c = 0, p = 0, z = 0, n = 0;
  for (const b of HELD_OUT_BASES) { const x = out.joint[j.id].bases[b]; c += x.comparable; p += x.P; z += x.Z; n += x.N; }
  console.log(`${j.id} ${j.name}: comparable=${c} P=${p} Z=${z} N=${n}`);
}
console.log(`\n|C|=${C.length} P=${P} Z=${Z} N=${N} B=${B}`);
console.log(`DISPOSITION: ${disposition}`);
console.log(`WHY: ${why}`);
