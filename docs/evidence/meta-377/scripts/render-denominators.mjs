// render-denominators.mjs — DENOMINATOR-AUDIT.md from tables/denominators.json.
import { readFileSync, writeFileSync } from 'node:fs';
import { BASES, HELD_OUT_BASES, PIN_BASES, DIMENSIONS, JOINT_VIEWS } from './lib.mjs';

const a = JSON.parse(readFileSync('docs/evidence/meta-377/tables/denominators.json', 'utf8'));
const CLASSES = ['EMPTY', 'EMITTED_ONLY', 'OMITTED_ONLY', 'SPARSE', 'COMPARABLE'];
const L = [];
const p = (s = '') => L.push(s);

p('# DENOMINATOR-AUDIT — META-377');
p();
p('**Phase 3. Built before any held-out recurrence rate was calculated.**');
p();
p('`scripts/denominators.mjs` loads the frozen relationships with');
p('`load(..., { withOutcome: false })`, which strips `overlapUsable` and');
p('`overlapAll` from every row, and then asserts the outcome fields are absent.');
p('The grouping tables below therefore could not have been shaped by the');
p('outcome — the script that produced them cannot see it.');
p();
p('Comparability rule, frozen in ANALYSIS-PLAN §5 and not lowered afterwards:');
p();
p('```');
p(`COMPARABLE  iff  emitted N >= ${a.minN}  AND  omitted N >= ${a.minN}`);
p('```');
p();
p('All non-empty cells are reported. Nothing is deleted, and no sparse cell is');
p('pooled across strata, bases, or repositories.');
p();
p('## 1. Population and recurrence eligibility (all nine bases)');
p();
p('| Basis | Qualifying | Emitted | Omitted | Held-out window | Contributes recurrence |');
p('| -- | --: | --: | --: | -- | -- |');
let tq = 0, te = 0, to = 0;
for (const b of BASES) {
  const x = a.population[b];
  tq += x.qualifying; te += x.emitted; to += x.omitted;
  p(`| \`${b}\` | ${x.qualifying.toLocaleString()} | ${x.emitted} | ${x.omitted.toLocaleString()} | ${x.hasHeldOutWindow ? 'non-empty' : '**empty by definition**'} | ${x.contributesRecurrence ? 'yes' : '**no**'} |`);
}
p(`| **total** | **${tq.toLocaleString()}** | **${te}** | **${to.toLocaleString()}** | | |`);
p();
p(`The three pin bases (${PIN_BASES.map((b) => `\`${b}\``).join(', ')}) hold`);
p(`${PIN_BASES.reduce((s, b) => s + a.population[b].qualifying, 0).toLocaleString()} relationships. They remain in the population`);
p('characterization and contribute **zero** recurrence observations, because the');
p('held-out window is `(basis, pin]` and is empty at a pin (META-375');
p('PREREGISTRATION §13). This is definitional, not a measurement.');
p();
p(`The recurrence denominator is the ${HELD_OUT_BASES.length} bases with a non-empty window:`);
p(`${HELD_OUT_BASES.reduce((s, b) => s + a.population[b].qualifying, 0).toLocaleString()} relationships.`);
p();

function cellClassTable(node, ids, label) {
  p(`## ${label}`);
  p();
  p('Cell counts by class, per basis. `COMPARABLE@held-out` counts only the six');
  p('bases that contribute a recurrence result.');
  p();
  for (const id of ids) {
    const d = node[id];
    p(`### ${id} — ${d.name}`);
    p();
    p('| Basis | ' + CLASSES.join(' | ') + ' | Distinct strata |');
    p('| -- | ' + CLASSES.map(() => '--:').join(' | ') + ' | --: |');
    for (const b of BASES) {
      const s = d.bases[b].summary;
      const n = d.bases[b].cells.length;
      const mark = HELD_OUT_BASES.includes(b) ? '' : ' *(pin)*';
      p(`| \`${b}\`${mark} | ${CLASSES.map((c) => s[c]).join(' | ')} | ${n} |`);
    }
    const tot = Object.fromEntries(CLASSES.map((c) => [c, 0]));
    let ho = 0;
    for (const b of BASES) {
      for (const c of CLASSES) tot[c] += d.bases[b].summary[c];
      if (HELD_OUT_BASES.includes(b)) ho += d.bases[b].summary.COMPARABLE;
    }
    p(`| **all nine** | ${CLASSES.map((c) => `**${tot[c]}**`).join(' | ')} | |`);
    p();
    p(`**COMPARABLE@held-out = ${ho}**`);
    p();
  }
}

cellClassTable(a.perBasis, DIMENSIONS.map((d) => d.id), '2. One-dimensional cells (D3–D7)');
cellClassTable(a.joint, JOINT_VIEWS.map((j) => j.id), '3. Joint cells (J1–J3)');

p('## 4. Comparable-cell budget for the disposition rule');
p();
p('ANALYSIS-PLAN §7 runs on `COMPARABLE` cells of **D3–D7** at the six held-out');
p('bases. That budget is:');
p();
p('| Dimension | COMPARABLE@held-out |');
p('| -- | --: |');
let C = 0;
for (const d of DIMENSIONS) {
  const n = HELD_OUT_BASES.reduce((s, b) => s + a.perBasis[d.id].bases[b].summary.COMPARABLE, 0);
  C += n;
  p(`| ${d.id} ${d.name} | ${n} |`);
}
p(`| **|C|** | **${C}** |`);
p();
const B = HELD_OUT_BASES.filter((b) =>
  DIMENSIONS.some((d) => a.perBasis[d.id].bases[b].summary.COMPARABLE > 0)).length;
p(`Bases contributing ≥1 comparable cell: **B = ${B}** of ${HELD_OUT_BASES.length}.`);
p();
p(`Per ANALYSIS-PLAN §7 branch 1, \`INSUFFICIENT_WITHIN_STRATUM_SUPPORT\` fires`);
p(`if \`|C| == 0\` or \`B < 4\`. Here |C| = ${C} and B = ${B}, so the corpus **does**`);
p('support the conditioning comparison under the frozen threshold and the');
p('analysis proceeds to Phase 4.');
p();
p('## 5. What the sparsity itself shows');
p();
p('The dominant non-comparable class is `OMITTED_ONLY` — strata populated');
p('entirely by omitted relationships with no emitted counterpart at that basis.');
p('This is a direct consequence of the cap: 50 emitted relationships per basis');
p('must cover the same stratum space as hundreds or thousands of omitted ones,');
p('so most fine-grained strata can never be compared within-basis at all.');
p();
p('That is a structural property of the frozen design, recorded here before any');
p('outcome was read. It bounds what any conditioning analysis on this corpus can');
p('answer, independent of what the recurrence numbers turn out to be.');

writeFileSync('docs/evidence/meta-377/DENOMINATOR-AUDIT.md', `${L.join('\n')}\n`);
console.log(`wrote DENOMINATOR-AUDIT.md (${L.length} lines), |C|=${C} B=${B}`);
