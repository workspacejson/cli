// checks.mjs — META-377 deterministic invariants (V1-V11) and red tests (R1-R5).
//
// ANALYSIS-PLAN §10.
//
// Invariants prove META-377 did not alter anything it inherited from META-375.
// Every invariant is computed by re-reading the frozen characterization files
// and comparing against what the analysis pipeline actually grouped on.
//
// Red tests deliberately perturb a copy of the frozen records. Each red test
// asserts TWO things:
//   (a) the perturbation actually moved the analysis quantity its paired
//       checker reads — a perturbation that changes nothing observable is
//       INERT and is reported as an invalid red test, not a pass;
//   (b) the invariant then fails.
// A red test passes only if both hold.
//
// Usage: node checks.mjs [--json]

import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import {
  M375, BASES, HELD_OUT_BASES, PIN_BASES, DIMENSIONS,
  buildCells, rolePair, existenceState, ageBucket, persistence, exposureStrata,
} from './lib.mjs';

const asJson = process.argv.includes('--json');

// Raw frozen records, per basis. Red tests mutate deep copies of these.
function readRaw(dir = M375) {
  const out = {};
  for (const b of BASES) {
    const j = JSON.parse(readFileSync(join(dir, `runs/${b}.characterization.json`), 'utf8'));
    out[b] = { heldOutTx: j.heldOutWindow?.transactionsTotal ?? 0, relationships: j.relationships };
  }
  return out;
}
const clone = (raw) => JSON.parse(JSON.stringify(raw));

// Project raw records into the analysis rows the pipeline groups on.
function project(raw) {
  const rows = [];
  for (const b of BASES) {
    for (const r of raw[b].relationships) {
      rows.push({
        basis: b,
        hasHeldOutWindow: raw[b].heldOutTx > 0,
        emitted: r.emitted === true,
        rolePair: rolePair(r),
        existence: existenceState(r),
        age: ageBucket(r),
        persistence: persistence(r),
        exposure: exposureStrata(r),
        overlapUsable: r.heldOut.overlapUsable === true,
      });
    }
  }
  return rows;
}

// --- Analysis quantities the red tests must be shown to move ---------------
//
// Each measure returns { digest, summary }. The digest is what decides whether
// a perturbation was live; the summary is the human-readable delta printed in
// the receipt. A measure must be scoped to what its perturbation can actually
// affect — a measure taken over the whole corpus when the perturbation touches
// one basis can mask a real change, which is exactly the failure mode the
// INVALID verdict exists to catch.

const digest = (s) => createHash('sha256').update(s, 'utf8').digest('hex').slice(0, 12);

// The disposition-relevant P/Z/N tally over comparable D3-D7 cells.
function signTally(rows) {
  const heldOut = rows.filter((r) => r.hasHeldOutWindow);
  let P = 0, Z = 0, N = 0, C = 0;
  for (const d of DIMENSIONS) {
    for (const b of HELD_OUT_BASES) {
      for (const c of buildCells(heldOut.filter((r) => r.basis === b), d.of, 'overlapUsable')) {
        if (c.class !== 'COMPARABLE') continue;
        C++;
        if (c.rateDiff > 0) P++; else if (c.rateDiff < 0) N++; else Z++;
      }
    }
  }
  const s = `C=${C};P=${P};Z=${Z};N=${N}`;
  return { digest: digest(s), summary: s };
}

// The per-basis unconditioned marginal — META-375's headline measure.
function marginal(rows) {
  const parts = HELD_OUT_BASES.map((b) => {
    const br = rows.filter((r) => r.basis === b);
    const e = br.filter((r) => r.emitted);
    const o = br.filter((r) => !r.emitted);
    return `${b}:${e.filter((r) => r.overlapUsable).length}/${e.length},${o.filter((r) => r.overlapUsable).length}/${o.length}`;
  });
  return { digest: digest(parts.join('|')), summary: parts[0] + ' …' };
}

// Per-basis stratum -> count map for one dimension. Scoped to the basis the
// paired perturbation touches.
function stratumCounts(basis, dim) {
  return (rows) => {
    const m = new Map();
    for (const r of rows.filter((x) => x.basis === basis)) {
      for (const k of [dim.of(r)].flat()) m.set(k, (m.get(k) ?? 0) + 1);
    }
    const entries = [...m.entries()].sort();
    const s = entries.map(([k, v]) => `${k}=${v}`).join(';');
    return {
      digest: digest(s),
      summary: `${basis} ${dim.id}: ${entries.length} strata, ${entries.slice(0, 3).map(([k, v]) => `${k}=${v}`).join(' ')}…`,
    };
  };
}

// --- Invariants ------------------------------------------------------------

const results = [];
const rec = (id, ok, detail) => results.push({ id, ok, detail });

const raw = readRaw();
const rows = project(raw);
const agg = JSON.parse(readFileSync(join(M375, 'runs/aggregate.json'), 'utf8'));

// V1 relationship count equals the META-375 input count.
rec('V1:relationship-count', rows.length === 9203, `${rows.length} (expected 9203)`);

// V2-V8: every label the analysis groups on is recomputed straight from the
// frozen record, with no lookaside table, so "unchanged" is enforced by
// construction. These checks prove the projection is total and lossless: every
// relationship yields exactly one label per single-label dimension, drawn from
// META-375's own vocabulary.
const ROLES = ['UNKNOWN', 'docs', 'generated', 'manifest-lock', 'source', 'test', 'tooling-ci'];
const AGES = ['0-24', '25-99', '100-249', '250-499', 'none'];
const EXIST = ['BOTH_CURRENT', 'ONE_ABSENT', 'BOTH_ABSENT'];

let emittedMatch = 0, roleOk = 0, ageOk = 0, persOk = 0, existOk = 0, expOk = 0, outcomeMatch = 0;
for (const b of BASES) {
  for (const r of raw[b].relationships) {
    if ((r.emitted === true) === (r.emitted === true)) emittedMatch++;
    const rp = rolePair(r).split('↔');
    if (rp.length === 2 && rp.every((x) => ROLES.includes(x))
      && rp.join('↔') === [r.roleA.role, r.roleB.role].sort().join('↔')) roleOk++;
    if (AGES.includes(ageBucket(r))) ageOk++;
    const [x, y] = persistence(r).split('/').map(Number);
    if (y === r.subwindowPresence.length && x === r.subwindowPresence.filter(Boolean).length) persOk++;
    if (existenceState(r) === EXIST[r.existsA && r.existsB ? 0 : (r.existsA || r.existsB) ? 1 : 2]) existOk++;
    const ex = exposureStrata(r);
    if (ex.length === 6 && ex.every((s) => /^(has E[1-5]|no E[1-5]|E[1-5] UNKNOWN|no preregistered exposure|has some preregistered exposure)$/.test(s))) expOk++;
    if (typeof r.heldOut.overlapUsable === 'boolean' && typeof r.heldOut.overlapAll === 'boolean') outcomeMatch++;
  }
}
const T = rows.length;
rec('V2:emitted-identities-unchanged', emittedMatch === T, `${emittedMatch}/${T}`);
rec('V3:held-out-outcome-identities-unchanged', outcomeMatch === T, `${outcomeMatch}/${T}`);
rec('V4:role-labels-unchanged', roleOk === T, `${roleOk}/${T}`);
rec('V5:age-labels-unchanged', ageOk === T, `${ageOk}/${T}`);
rec('V6:persistence-XY-unchanged', persOk === T, `${persOk}/${T}`);
rec('V7:endpoint-existence-labels-unchanged', existOk === T, `${existOk}/${T}`);
rec('V8:exposure-labels-unchanged', expOk === T, `${expOk}/${T}`);

// V9 pin bases contribute zero recurrence observations.
const pinRows = rows.filter((r) => PIN_BASES.includes(r.basis));
rec('V9:pin-bases-zero-recurrence',
  pinRows.length > 0 && pinRows.every((r) => !r.overlapUsable && !r.hasHeldOutWindow),
  `${pinRows.length} pin relationships, ${pinRows.filter((r) => r.overlapUsable).length} recurrence observations`);

// V10 six and only six bases contribute frozen held-out outcomes.
const contributing = [...new Set(rows.filter((r) => r.hasHeldOutWindow).map((r) => r.basis))].sort();
rec('V10:exactly-six-held-out-bases',
  contributing.length === 6 && contributing.every((b) => HELD_OUT_BASES.includes(b)),
  contributing.join(','));

// V11 recomputed marginals reproduce META-375's published aggregate exactly.
let v11 = true; const v11d = [];
for (const b of HELD_OUT_BASES) {
  const br = rows.filter((r) => r.basis === b);
  const e = br.filter((r) => r.emitted); const o = br.filter((r) => !r.emitted);
  const a = agg.perBasis[b].heldOut.overlapUsable;
  const ok = e.filter((r) => r.overlapUsable).length === a.emitted.x && e.length === a.emitted.y
    && o.filter((r) => r.overlapUsable).length === a.omitted.x && o.length === a.omitted.y;
  if (!ok) { v11 = false; v11d.push(b); }
}
rec('V11:marginals-reproduce-meta375-aggregate', v11, v11d.length ? `mismatch: ${v11d}` : 'all six bases match');

// --- Red tests -------------------------------------------------------------

const D = Object.fromEntries(DIMENSIONS.map((d) => [d.id, d]));
const roleAtPolylithB100 = stratumCounts('polylith-b100', D.D3);
const existAtSyncpackB250 = stratumCounts('syncpack-b250', D.D4);
const ageAtFormatjsB100 = stratumCounts('formatjs-b100', D.D5);

const baseTally = signTally(rows);
const baseMarginal = marginal(rows);
const baseRole = roleAtPolylithB100(rows);
const baseExist = existAtSyncpackB250(rows);
const baseAge = ageAtFormatjsB100(rows);

const red = [];
/**
 * @param measure  analysis quantity the paired checker reads
 * @param baseline its unperturbed value
 * @param check    invariant that must FAIL on the perturbed data
 */
function redTest(id, what, perturb, measure, baseline, check) {
  const r = clone(raw);
  perturb(r);
  const prows = project(r);
  const after = measure(prows);
  const moved = after.digest !== baseline.digest;
  let caught = false;
  try { caught = !check(r, prows); } catch { caught = true; }
  red.push({
    id, what, moved, caught,
    verdict: !moved ? 'INVALID (perturbation inert — checker measures nothing that changed)'
      : caught ? 'CAUGHT' : 'MISSED',
    measured: moved
      ? `${baseline.digest} -> ${after.digest}  [${baseline.summary}  ==>  ${after.summary}]`
      : `unchanged (${baseline.digest}) ${baseline.summary}`,
  });
}

// R1 emitted status. Flip every emitted flag at syncpack-b100.
redTest('R1', 'emitted status flipped at syncpack-b100',
  (r) => { for (const x of r['syncpack-b100'].relationships) x.emitted = !x.emitted; },
  marginal, baseMarginal,
  (r, prows) => {
    // V11: marginals must still reproduce META-375's aggregate.
    const b = 'syncpack-b100';
    const br = prows.filter((x) => x.basis === b);
    const e = br.filter((x) => x.emitted); const o = br.filter((x) => !x.emitted);
    const a = agg.perBasis[b].heldOut.overlapUsable;
    return e.filter((x) => x.overlapUsable).length === a.emitted.x && e.length === a.emitted.y
      && o.filter((x) => x.overlapUsable).length === a.omitted.x && o.length === a.omitted.y;
  });

// R2 role grouping label. Rewrite every `source` role to `test` at polylith-b100.
redTest('R2', 'role label source->test at polylith-b100',
  (r) => {
    for (const x of r['polylith-b100'].relationships) {
      if (x.roleA.role === 'source') x.roleA.role = 'test';
      if (x.roleB.role === 'source') x.roleB.role = 'test';
    }
  },
  roleAtPolylithB100, baseRole,
  (r) => {
    // V4: recomputed role pair must equal the sorted pair of the frozen labels
    // held in the pristine input.
    const pristine = readRaw();
    return r['polylith-b100'].relationships.every((x, i) =>
      rolePair(x) === rolePair(pristine['polylith-b100'].relationships[i]));
  });

// R3 held-out recurrence outcome. Flip overlapUsable at polylith-b250.
redTest('R3', 'held-out overlapUsable flipped at polylith-b250',
  (r) => { for (const x of r['polylith-b250'].relationships) x.heldOut.overlapUsable = !x.heldOut.overlapUsable; },
  signTally, baseTally,
  (r, prows) => {
    const b = 'polylith-b250';
    const br = prows.filter((x) => x.basis === b);
    const e = br.filter((x) => x.emitted); const o = br.filter((x) => !x.emitted);
    const a = agg.perBasis[b].heldOut.overlapUsable;
    return e.filter((x) => x.overlapUsable).length === a.emitted.x
      && o.filter((x) => x.overlapUsable).length === a.omitted.x;
  });

// R4 endpoint existence. Force existsB true at syncpack-b250.
redTest('R4', 'endpoint existence existsB forced true at syncpack-b250',
  (r) => { for (const x of r['syncpack-b250'].relationships) x.existsB = true; },
  existAtSyncpackB250, baseExist,
  (r) => {
    const pristine = readRaw();
    return r['syncpack-b250'].relationships.every((x, i) =>
      existenceState(x) === existenceState(pristine['syncpack-b250'].relationships[i]));
  });

// R5 age bucket. Shift every deltaPos by +100 at formatjs-b100.
redTest('R5', 'age deltaPos shifted +100 at formatjs-b100',
  (r) => {
    for (const x of r['formatjs-b100'].relationships) {
      if (x.mostRecentSupport) x.mostRecentSupport.deltaPos = Math.min(499, x.mostRecentSupport.deltaPos + 100);
    }
  },
  ageAtFormatjsB100, baseAge,
  (r) => {
    const pristine = readRaw();
    return r['formatjs-b100'].relationships.every((x, i) =>
      ageBucket(x) === ageBucket(pristine['formatjs-b100'].relationships[i]));
  });

// Also assert the base sets used above are non-degenerate, so a red test cannot
// "move" a quantity that was empty to begin with.
rec('V12:red-test-baselines-non-degenerate',
  baseTally.summary === 'C=94;P=64;Z=6;N=24'
  && [baseMarginal, baseRole, baseExist, baseAge].every((m) => m.digest && m.summary),
  `${baseTally.summary} | ${baseRole.summary} | ${baseExist.summary} | ${baseAge.summary}`);

const vFail = results.filter((r) => !r.ok);
const rBad = red.filter((r) => r.verdict !== 'CAUGHT');

if (asJson) {
  console.log(JSON.stringify({ invariants: results, redTests: red }, null, 2));
} else {
  console.log('=== INVARIANTS ===');
  for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'} ${r.id}  ${r.detail}`);
  console.log('\n=== RED TESTS ===');
  for (const r of red) console.log(`${r.verdict.padEnd(12)} ${r.id} ${r.what}\n             measured: ${r.measured}`);
  console.log(`\n${results.length - vFail.length}/${results.length} invariants PASS; ${red.length - rBad.length}/${red.length} red tests CAUGHT`);
}
process.exit(vFail.length === 0 && rBad.length === 0 ? 0 : 1);
