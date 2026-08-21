// lib.mjs — META-377 shared loading and grouping.
//
// Implements ANALYSIS-PLAN §3-§6 verbatim. Every grouping rule here was frozen
// at commit f09a1c96ce7c9c868adc65ef7ed8fbb42d1d3a0d, before any conditioned
// recurrence rate was computed.
//
// Nothing in this file reclassifies a path, invents a label, or derives a
// variable outside D1-D7. It reads META-375's recorded fields and groups them.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export const M375 = 'docs/evidence/meta-375';

export const BASES = [
  'syncpack-pin', 'syncpack-b100', 'syncpack-b250',
  'formatjs-pin', 'formatjs-b100', 'formatjs-b250',
  'polylith-pin', 'polylith-b100', 'polylith-b250',
];

// Six bases with a non-empty frozen held-out window. Pin bases have zero
// held-out transactions by definition (META-375 PREREGISTRATION §13).
export const HELD_OUT_BASES = BASES.filter((b) => !b.endsWith('-pin'));
export const PIN_BASES = BASES.filter((b) => b.endsWith('-pin'));

// ANALYSIS-PLAN §4 D5: META-375's frozen age buckets, reused exactly.
export const AGE_BUCKETS = ['0-24', '25-99', '100-249', '250-499'];

// ANALYSIS-PLAN §4 D7: META-375's exposure taxonomy, E1-E5 in PREREGISTRATION
// §12 order. Not extended, not renamed, not reordered.
export const EXPOSURE_CLASSES = [
  ['E1', 'manifest-lock'],
  ['E2', 'stem'],
  ['E3', 'same-dir'],
  ['E4', 'static-edge'],
  ['E5', 'generated-marker'],
];

// --- Grouping rules (ANALYSIS-PLAN §4) -------------------------------------

// D3. Co-change is symmetric, so the pair carries no direction. Lexical sort is
// a canonicalization for grouping only; it implies no priority between the two
// endpoints. The two role-label strings are META-375's own.
export const rolePair = (r) =>
  [r.roleA.role, r.roleB.role].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)).join('↔');

// D4. Exactly three states from META-375's existing booleans.
export const existenceState = (r) =>
  r.existsA && r.existsB ? 'BOTH_CURRENT' : (r.existsA || r.existsB) ? 'ONE_ABSENT' : 'BOTH_ABSENT';

// D5. META-375's frozen buckets on the recorded delta position. `none` is
// retained for a relationship with no most-recent-support record.
export function ageBucket(r) {
  const d = r.mostRecentSupport?.deltaPos;
  if (d == null) return 'none';
  if (d <= 24) return '0-24';
  if (d <= 99) return '25-99';
  if (d <= 249) return '100-249';
  if (d <= 499) return '250-499';
  throw new Error(`age ${d} exceeds the frozen bucket range (max 499)`);
}

// D6. The exact X/Y string. 2/2 is never equated with 5/5; no normalized
// persistence score is introduced.
export const persistence = (r) =>
  `${r.subwindowPresence.filter(Boolean).length}/${r.subwindowPresence.length}`;

// D7. Exposure is multi-label: a relationship is never forced into one
// exclusive category. Each class yields three strata and the per-class UNKNOWN
// state is preserved exactly as META-375 recorded it, never coerced to false.
export function exposureStrata(r) {
  const out = [];
  for (const [code, key] of EXPOSURE_CLASSES) {
    const v = r.exposure[key];
    out.push(v === 'UNKNOWN' ? `${code} UNKNOWN` : v === true ? `has ${code}` : `no ${code}`);
  }
  out.push(r.noPreregisteredExposure ? 'no preregistered exposure' : 'has some preregistered exposure');
  return out;
}

// --- Loading ---------------------------------------------------------------

/**
 * Load the frozen relationships.
 *
 * `withOutcome: false` strips the held-out outcome entirely, so a caller
 * physically cannot read it. Phase 3 (denominator audit) uses that mode: the
 * grouping tables are built with no access to recurrence.
 */
export function load(dir = M375, { withOutcome = true } = {}) {
  const rows = [];
  for (const basis of BASES) {
    const j = JSON.parse(readFileSync(join(dir, `runs/${basis}.characterization.json`), 'utf8'));
    const heldOutTx = j.heldOutWindow?.transactionsTotal ?? 0;
    for (const r of j.relationships) {
      const row = {
        basis,
        repo: basis.split('-')[0],
        hasHeldOutWindow: heldOutTx > 0,
        files: r.files,
        emitted: r.emitted === true,
        rank: r.rank,
        rolePair: rolePair(r),
        existence: existenceState(r),
        age: ageBucket(r),
        persistence: persistence(r),
        exposure: exposureStrata(r),
      };
      if (withOutcome) {
        row.overlapUsable = r.heldOut.overlapUsable === true;
        row.overlapAll = r.heldOut.overlapAll === true;
      }
      rows.push(row);
    }
  }
  return rows;
}

// --- Cells (ANALYSIS-PLAN §5-§6) -------------------------------------------

export const MIN_N = 10; // frozen comparability threshold, never lowered

export function classifyCell(emittedN, omittedN) {
  if (emittedN === 0 && omittedN === 0) return 'EMPTY';
  if (omittedN === 0) return 'EMITTED_ONLY';
  if (emittedN === 0) return 'OMITTED_ONLY';
  return emittedN >= MIN_N && omittedN >= MIN_N ? 'COMPARABLE' : 'SPARSE';
}

/**
 * Build cells for one dimension within one basis.
 * `strataOf` returns an array of stratum keys (multi-label for exposure).
 * `outcomeKey` null => denominators only, no outcome touched.
 */
export function buildCells(rows, strataOf, outcomeKey = null) {
  const cells = new Map();
  for (const row of rows) {
    for (const s of [strataOf(row)].flat()) {
      if (!cells.has(s)) {
        cells.set(s, { stratum: s, emittedN: 0, omittedN: 0, emittedX: 0, omittedX: 0 });
      }
      const c = cells.get(s);
      if (row.emitted) {
        c.emittedN++;
        if (outcomeKey && row[outcomeKey]) c.emittedX++;
      } else {
        c.omittedN++;
        if (outcomeKey && row[outcomeKey]) c.omittedX++;
      }
    }
  }
  for (const c of cells.values()) {
    c.class = classifyCell(c.emittedN, c.omittedN);
    if (outcomeKey) {
      c.emittedRate = c.emittedN ? c.emittedX / c.emittedN : null;
      c.omittedRate = c.omittedN ? c.omittedX / c.omittedN : null;
      c.rateDiff = c.emittedRate !== null && c.omittedRate !== null
        ? c.emittedRate - c.omittedRate : null;
    }
  }
  return [...cells.values()].sort((a, b) =>
    (a.stratum < b.stratum ? -1 : a.stratum > b.stratum ? 1 : 0));
}

// D1-D7 stratum accessors. D1/D2 are the stratification axes, not conditioned
// cells (ANALYSIS-PLAN §4, §7).
export const DIMENSIONS = [
  { id: 'D3', name: 'endpoint-role pair', of: (r) => r.rolePair },
  { id: 'D4', name: 'endpoint-existence state', of: (r) => r.existence },
  { id: 'D5', name: 'age bucket', of: (r) => r.age },
  { id: 'D6', name: 'persistence X/Y', of: (r) => r.persistence },
  { id: 'D7', name: 'current-tree exposure', of: (r) => r.exposure },
];

// ANALYSIS-PLAN §8. Exactly three joint views, frozen before any result.
export const JOINT_VIEWS = [
  { id: 'J1', name: 'endpoint-role pair × age bucket', of: (r) => `${r.rolePair} | ${r.age}` },
  { id: 'J2', name: 'endpoint-role pair × endpoint-existence state', of: (r) => `${r.rolePair} | ${r.existence}` },
  { id: 'J3', name: 'age bucket × persistence X/Y', of: (r) => `${r.age} | ${r.persistence}` },
];

export const pct = (v) => (v === null ? '—' : `${(v * 100).toFixed(1)}%`);
export const signed = (v) => (v === null ? '—' : `${v >= 0 ? '+' : ''}${(v * 100).toFixed(1)}pp`);
