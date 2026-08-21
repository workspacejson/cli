// denominators.mjs — META-377 Phase 3 denominator audit.
//
// ANALYSIS-PLAN §5. Builds every grouping table for all nine bases WITHOUT
// reading or aggregating the held-out overlap outcome: `load()` is called with
// `withOutcome: false`, so the outcome fields do not exist on the rows this
// script can see. The audit therefore cannot be steered by the outcome.
//
// Usage: node denominators.mjs [--json]

import { writeFileSync } from 'node:fs';
import {
  load, M375, BASES, HELD_OUT_BASES, PIN_BASES,
  DIMENSIONS, JOINT_VIEWS, buildCells, MIN_N,
} from './lib.mjs';

const rows = load(M375, { withOutcome: false });

if (rows.some((r) => 'overlapUsable' in r || 'overlapAll' in r)) {
  throw new Error('denominator audit must not have access to the held-out outcome');
}

const CLASSES = ['EMPTY', 'EMITTED_ONLY', 'OMITTED_ONLY', 'SPARSE', 'COMPARABLE'];

const audit = { minN: MIN_N, perBasis: {}, joint: {}, population: {} };

// Population: all nine bases (pin bases included — they are part of the
// population characterization even though they carry no recurrence outcome).
for (const basis of BASES) {
  const br = rows.filter((r) => r.basis === basis);
  audit.population[basis] = {
    qualifying: br.length,
    emitted: br.filter((r) => r.emitted).length,
    omitted: br.filter((r) => !r.emitted).length,
    hasHeldOutWindow: br[0].hasHeldOutWindow,
    contributesRecurrence: br[0].hasHeldOutWindow,
  };
}

for (const dim of DIMENSIONS) {
  audit.perBasis[dim.id] = { name: dim.name, bases: {} };
  for (const basis of BASES) {
    const cells = buildCells(rows.filter((r) => r.basis === basis), dim.of);
    const summary = Object.fromEntries(CLASSES.map((c) => [c, cells.filter((x) => x.class === c).length]));
    audit.perBasis[dim.id].bases[basis] = { cells, summary };
  }
}

for (const jv of JOINT_VIEWS) {
  audit.joint[jv.id] = { name: jv.name, bases: {} };
  for (const basis of BASES) {
    const cells = buildCells(rows.filter((r) => r.basis === basis), jv.of);
    const summary = Object.fromEntries(CLASSES.map((c) => [c, cells.filter((x) => x.class === c).length]));
    audit.joint[jv.id].bases[basis] = { cells, summary };
  }
}

writeFileSync('docs/evidence/meta-377/tables/denominators.json', `${JSON.stringify(audit, null, 2)}\n`);

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(audit, null, 2));
} else {
  console.log(`minN=${MIN_N}  rows=${rows.length}  (outcome NOT loaded)`);
  console.log(`recurrence-contributing bases: ${HELD_OUT_BASES.length} (${HELD_OUT_BASES.join(', ')})`);
  console.log(`pin bases contributing zero recurrence: ${PIN_BASES.join(', ')}`);
  for (const dim of DIMENSIONS) {
    const t = Object.fromEntries(CLASSES.map((c) => [c, 0]));
    let ho = 0;
    for (const basis of BASES) {
      for (const c of CLASSES) t[c] += audit.perBasis[dim.id].bases[basis].summary[c];
      if (HELD_OUT_BASES.includes(basis)) ho += audit.perBasis[dim.id].bases[basis].summary.COMPARABLE;
    }
    console.log(`${dim.id} ${dim.name}: ${CLASSES.map((c) => `${c}=${t[c]}`).join(' ')} | COMPARABLE@heldout=${ho}`);
  }
  for (const jv of JOINT_VIEWS) {
    const t = Object.fromEntries(CLASSES.map((c) => [c, 0]));
    let ho = 0;
    for (const basis of BASES) {
      for (const c of CLASSES) t[c] += audit.joint[jv.id].bases[basis].summary[c];
      if (HELD_OUT_BASES.includes(basis)) ho += audit.joint[jv.id].bases[basis].summary.COMPARABLE;
    }
    console.log(`${jv.id} ${jv.name}: ${CLASSES.map((c) => `${c}=${t[c]}`).join(' ')} | COMPARABLE@heldout=${ho}`);
  }
}
