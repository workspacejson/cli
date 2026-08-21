// render-results.mjs — ONE-DIMENSIONAL-RESULTS.md and JOINT-STRATA-RESULTS.md.
import { readFileSync, writeFileSync } from 'node:fs';
import { HELD_OUT_BASES, DIMENSIONS, JOINT_VIEWS, pct, signed } from './lib.mjs';

const P0 = JSON.parse(readFileSync('docs/evidence/meta-377/tables/conditioned.overlapUsable.json', 'utf8'));
const P1 = JSON.parse(readFileSync('docs/evidence/meta-377/tables/conditioned.overlapAll.json', 'utf8'));

const CLASS_NOTE = {
  EMITTED_ONLY: 'emitted only — no omitted counterpart',
  OMITTED_ONLY: 'omitted only — no emitted counterpart',
  SPARSE: 'sparse — below the frozen threshold',
};

function cellRows(cells) {
  const L = [];
  for (const c of cells) {
    if (c.class === 'COMPARABLE') {
      L.push(`| \`${c.stratum}\` | ${c.emittedX}/${c.emittedN} | ${pct(c.emittedRate)} | ${c.omittedX}/${c.omittedN} | ${pct(c.omittedRate)} | ${signed(c.rateDiff)} | COMPARABLE |`);
    } else {
      const e = c.emittedN ? `${c.emittedX}/${c.emittedN}` : '0/0';
      const o = c.omittedN ? `${c.omittedX}/${c.omittedN}` : '0/0';
      L.push(`| \`${c.stratum}\` | ${e} | ${c.emittedN ? pct(c.emittedRate) : '—'} | ${o} | ${c.omittedN ? pct(c.omittedRate) : '—'} | — | ${c.class} |`);
    }
  }
  return L;
}

const HEAD = '| Stratum | Emitted X/N | Emitted rate | Omitted X/N | Omitted rate | Diff | Class |';
const SEP = '| -- | --: | --: | --: | --: | --: | -- |';

function section(node, views, title, intro, file, extra = []) {
  const L = [];
  const p = (s = '') => L.push(s);
  p(`# ${title} — META-377`);
  p();
  intro.forEach(p);
  p();
  p('Primary outcome is `overlapUsable` — both endpoints appeared together in at');
  p('least one **usable** observed subsequent changed-file set under META-375\'s');
  p('frozen held-out transaction rule. This is an observational co-touch overlap.');
  p('It is not impact, dependency, required edit, correctness, or agent value.');
  p();
  p('Exact X/N is retained behind every rate. No p-value is computed; statistical');
  p('significance is not substituted for the denominators. Every non-empty cell is');
  p('shown, including sparse and one-sided ones. Bases are never pooled.');
  p();
  extra.forEach(p);
  if (extra.length) p();

  for (const v of views) {
    const d = node[v.id];
    p(`## ${v.id} — ${d.name}`);
    p();
    let c = 0, P = 0, Z = 0, N = 0;
    for (const b of HELD_OUT_BASES) { const x = d.bases[b]; c += x.comparable; P += x.P; Z += x.Z; N += x.N; }
    p(`Across the six held-out bases: **${c} comparable cells** — emitted > omitted in **${P}**, equal in **${Z}**, emitted < omitted in **${N}**.`);
    p();
    for (const b of HELD_OUT_BASES) {
      const x = d.bases[b];
      p(`### \`${b}\``);
      p();
      p(`comparable=${x.comparable} (P=${x.P} Z=${x.Z} N=${x.N}), other cells=${x.sparseOrUnavailable}`);
      p();
      p(HEAD); p(SEP);
      cellRows(x.cells).forEach(p);
      p();
    }
  }
  writeFileSync(`docs/evidence/meta-377/${file}`, `${L.join('\n')}\n`);
  return L.length;
}

// --- one-dimensional -------------------------------------------------------
const marginal = [];
marginal.push('## Reference point — D1/D2 per-basis marginal (unconditioned)');
marginal.push('');
marginal.push('This is META-375\'s headline measure, recomputed from the frozen records.');
marginal.push('Every conditioned cell below is read against it.');
marginal.push('');
marginal.push('| Basis | Emitted X/N | Emitted rate | Omitted X/N | Omitted rate | Diff |');
marginal.push('| -- | --: | --: | --: | --: | --: |');
for (const b of HELD_OUT_BASES) {
  const m = P0.marginal[b];
  marginal.push(`| \`${b}\` | ${m.emittedX}/${m.emittedN} | ${pct(m.emittedRate)} | ${m.omittedX}/${m.omittedN} | ${pct(m.omittedRate)} | ${signed(m.rateDiff)} |`);
}
marginal.push('');
marginal.push('Emitted exceeds omitted at **6 / 6** bases unconditioned. That is the');
marginal.push('separation META-377 tests.');

const n1 = section(
  P0.oneDimensional, DIMENSIONS,
  'ONE-DIMENSIONAL-RESULTS', [
    '**Phase 4.** The first results computed after the ANALYSIS-PLAN freeze',
    '(commit `f09a1c96ce7c9c868adc65ef7ed8fbb42d1d3a0d`) and the denominator audit',
    '(commit `b09ac06b35f5f0b0159ca29a67aeba10af7d0765`).',
  ], 'ONE-DIMENSIONAL-RESULTS.md', marginal);

// --- joint -----------------------------------------------------------------
const n2 = section(
  P0.joint, JOINT_VIEWS,
  'JOINT-STRATA-RESULTS', [
    '**Phase 5.** The three joint views were frozen in ANALYSIS-PLAN §8 before any',
    'recurrence result existed. No fourth combination was introduced.',
    '',
    'Joint views do **not** enter the §7 disposition arithmetic. They corroborate',
    'or contradict the one-dimensional finding, and any reversal is named here with',
    'its exact denominator.',
  ], 'JOINT-STRATA-RESULTS.md');

console.log(`ONE-DIMENSIONAL-RESULTS.md ${n1} lines; JOINT-STRATA-RESULTS.md ${n2} lines`);

// --- exception mining for the report ---------------------------------------
const rev = P0.disposition.cells.filter((c) => c.sign === '-')
  .sort((a, b) => a.rateDiff - b.rateDiff);
console.log('\n--- all 24 primary reversal cells (emitted < omitted), worst first ---');
for (const c of rev) {
  console.log(`${c.dim} ${c.basis} "${c.stratum}": emitted ${c.emittedX}/${c.emittedN} (${(c.emittedRate * 100).toFixed(1)}%) < omitted ${c.omittedX}/${c.omittedN} (${(c.omittedRate * 100).toFixed(1)}%)  ${(c.rateDiff * 100).toFixed(1)}pp`);
}
console.log('\n--- primary vs secondary disposition ---');
console.log(`overlapUsable (primary):   |C|=${P0.disposition.C} P=${P0.disposition.P} Z=${P0.disposition.Z} N=${P0.disposition.N} -> ${P0.disposition.disposition}`);
console.log(`overlapAll  (sensitivity): |C|=${P1.disposition.C} P=${P1.disposition.P} Z=${P1.disposition.Z} N=${P1.disposition.N} -> ${P1.disposition.disposition}`);
