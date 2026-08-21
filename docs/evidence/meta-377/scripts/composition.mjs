// composition.mjs — META-377 Phase 6 composition test.
//
// The composition question is whether the emitted and omitted populations
// occupy the same descriptive strata. If they do not, an aggregate difference
// can arise from stratum mix rather than from within-stratum separation.
//
// This uses only the allowed dimensions D3-D7 and only META-375's recorded
// labels. It adds no explanatory variable.
//
// Usage: node composition.mjs

import { writeFileSync } from 'node:fs';
import { load, M375, HELD_OUT_BASES, DIMENSIONS } from './lib.mjs';

const rows = load(M375).filter((r) => r.hasHeldOutWindow);
const out = { outcome: 'overlapUsable', perBasis: {} };

for (const basis of HELD_OUT_BASES) {
  const br = rows.filter((r) => r.basis === basis);
  const emitted = br.filter((r) => r.emitted);
  const omitted = br.filter((r) => !r.emitted);
  out.perBasis[basis] = { emittedN: emitted.length, omittedN: omitted.length, dimensions: {} };

  for (const dim of DIMENSIONS) {
    const strata = new Map();
    const add = (key, row) => {
      if (!strata.has(key)) strata.set(key, { stratum: key, emittedN: 0, omittedN: 0, emittedX: 0, omittedX: 0 });
      const c = strata.get(key);
      if (row.emitted) { c.emittedN++; if (row.overlapUsable) c.emittedX++; }
      else { c.omittedN++; if (row.overlapUsable) c.omittedX++; }
    };
    for (const row of br) for (const k of [dim.of(row)].flat()) add(k, row);

    const cells = [...strata.values()].map((c) => ({
      ...c,
      emittedShare: c.emittedN / emitted.length,
      omittedShare: c.omittedN / omitted.length,
      shareGap: c.emittedN / emitted.length - c.omittedN / omitted.length,
    })).sort((a, b) => Math.abs(b.shareGap) - Math.abs(a.shareGap));

    // Total variation distance between the emitted and omitted stratum mixes.
    // Only meaningful for single-label dimensions; exposure (D7) is multi-label
    // so its shares do not sum to 1 and TVD is reported as null.
    const singleLabel = dim.id !== 'D7';
    const tvd = singleLabel
      ? cells.reduce((s, c) => s + Math.abs(c.shareGap), 0) / 2
      : null;

    out.perBasis[basis].dimensions[dim.id] = { name: dim.name, multiLabel: !singleLabel, tvd, cells };
  }
}

writeFileSync('docs/evidence/meta-377/tables/composition.json', `${JSON.stringify(out, null, 2)}\n`);

console.log('Total variation distance between emitted and omitted stratum mixes');
console.log('(0 = identical composition, 1 = disjoint). D7 is multi-label; TVD n/a.\n');
const single = DIMENSIONS.filter((d) => d.id !== 'D7');
console.log(`| Basis | ${single.map((d) => d.id).join(' | ')} |`);
for (const basis of HELD_OUT_BASES) {
  const v = single.map((d) => out.perBasis[basis].dimensions[d.id].tvd.toFixed(3));
  console.log(`| ${basis} | ${v.join(' | ')} |`);
}
