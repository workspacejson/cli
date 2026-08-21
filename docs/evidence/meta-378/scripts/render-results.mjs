// render-results.mjs -- R1-ENDPOINT-EXISTENCE.md, R2-AGE.md,
// TRANSACTION-FILTER-SENSITIVITY.md, NEGATIVE-SPARSE-RESULTS.md.
import { readFileSync, writeFileSync } from 'node:fs';

const P = JSON.parse(readFileSync('docs/evidence/meta-378/tables/results.overlapUsable.json', 'utf8'));
const S = JSON.parse(readFileSync('docs/evidence/meta-378/tables/results.overlapAll.json', 'utf8'));
const A = JSON.parse(readFileSync('docs/evidence/meta-378/raw/phase-a.json', 'utf8'));
const L = JSON.parse(readFileSync('docs/evidence/meta-378/raw/ledgers.json', 'utf8'));

const HELD = Object.keys(P.marginal).sort();
const AGE = ['0-24', '25-99', '100-249', '250-499'];
const EX = ['BOTH_CURRENT', 'ONE_ABSENT', 'BOTH_ABSENT'];
const repoOf = (b) => A.bases[b].repo;
const pct = (v) => (v === null ? '—' : `${(v * 100).toFixed(1)}%`);
const pp = (v) => (v === null ? '—' : `${v >= 0 ? '+' : ''}${(v * 100).toFixed(1)}pp`);
const xn = (c) => `${c.emittedX}/${c.emittedN}`;
const on = (c) => `${c.omittedX}/${c.omittedN}`;

// ---------------- R1 ----------------
{
  const o = [];
  const p = (s = '') => o.push(s);
  p('# R1-ENDPOINT-EXISTENCE — META-378');
  p();
  p('**Confirmatory test of META-377\'s endpoint-existence dilution/reversal pattern.**');
  p();
  p('Discovery observed, within `BOTH_CURRENT`, a reversal at both syncpack bases');
  p('(`syncpack-b100` −10.2pp, `syncpack-b250` −30.7pp) while the other four bases');
  p('survived. The confirmatory question is whether conditioning on current');
  p('endpoint existence **attenuates, erases, or reverses** the emitted recurrence');
  p('advantage out of sample.');
  p();
  p('Primary outcome `overlapUsable`. Exact X/N retained behind every rate.');
  p('`d_uncond` is reported at every basis so attenuation is **observed rather than');
  p('inferred**.');
  p();
  p('## Comparable `BOTH_CURRENT` cells');
  p();
  p('| Basis | Repository | Emitted | rate | Omitted | rate | `d_cond` | `d_uncond` | reversal | attenuation |');
  p('| -- | -- | --: | --: | --: | --: | --: | --: | -- | -- |');
  for (const c of P.R1arithmetic.cells) {
    p(`| \`${c.basis}\` | \`${c.repo}\` | ${xn(c)} | ${pct(c.emittedRate)} | ${on(c)} | ${pct(c.omittedRate)} | **${pp(c.dCond)}** | ${pp(c.dUncond)} | ${c.reversal ? '**yes**' : 'no'} | ${c.attenuation ? '**yes**' : 'no'} |`);
  }
  p();
  const a = P.R1arithmetic;
  p(`**K = ${a.K}** comparable bases · **Rv = ${a.Rv}** reversals · **At = ${a.At}** attenuations.`);
  p(`\`Rv/K = ${(a.Rv / a.K).toFixed(3)}\` · \`At/K = ${(a.At / a.K).toFixed(3)}\``);
  p();
  p('## Non-comparable `BOTH_CURRENT` cells');
  p();
  p('Reported, never pooled, never deleted.');
  p();
  p('| Basis | Emitted N | Omitted N | Class |');
  p('| -- | --: | --: | -- |');
  let anyNC = false;
  for (const b of HELD) {
    const c = P.R1[b].BOTH_CURRENT;
    if (c.class === 'COMPARABLE') continue;
    anyNC = true;
    p(`| \`${b}\` | ${c.emittedN} | ${c.omittedN} | ${c.class} |`);
  }
  if (!anyNC) p('| — | | | none |');
  p();
  p('## All three existence states, every basis');
  p();
  p('| Basis | `BOTH_CURRENT` E / O | `ONE_ABSENT` E / O | `BOTH_ABSENT` E / O |');
  p('| -- | -- | -- | -- |');
  for (const b of HELD) {
    p(`| \`${b}\` | ${EX.map((s) => `${xn(P.R1[b][s])} / ${on(P.R1[b][s])}`).join(' | ')} |`);
  }
  p();
  p('## Disposition');
  p();
  p(`# \`${a.disposition}\``);
  p();
  p(`Rule: PREREGISTRATION §16, frozen at \`c95f7f9001bc80453af39da784d894e984b6ff87\`.`);
  p();
  p(`**Why:** ${a.why}`);
  p();
  p('Branch 1 (`K < 4`) did not fire — the replication carries more comparable');
  p('bases (9) than discovery had (6). Branch 2 required `Rv/K >= 1/3`, the rate');
  p('discovery itself showed; the replication produced **zero** reversals in nine');
  p('comparable bases. Branch 3 fired: no basis reversed and attenuation appeared at');
  p('only one of nine.');
  p();
  p('**Every comparable base shows the emitted advantage surviving conditioning on');
  p('endpoint existence**, several by a wide margin — `scikitimage-b250` +62.7pp,');
  p('`fabric-b250` +62.5pp, `scikitimage-b100` +36.1pp. In six of the nine bases the');
  p('conditioned difference is *larger* than the unconditioned one, in two it is');
  p('identical, and in one it is marginally smaller (`rustos-b100`, +10.4pp vs');
  p('+10.6pp) — the opposite of the dilution mechanism discovery proposed.');
  p();
  p('This is a **negative replication**, not a null result: the pattern was tested');
  p('with more support than it was discovered with, and it did not appear.');
  writeFileSync('docs/evidence/meta-378/R1-ENDPOINT-EXISTENCE.md', `${o.join('\n')}\n`);
}

// ---------------- R2 ----------------
{
  const o = [];
  const p = (s = '') => o.push(s);
  p('# R2-AGE — META-378');
  p();
  p('**Confirmatory test of META-377\'s age-conditioned reversal pattern.**');
  p();
  p('Discovery found D5 net negative — 5 positive, 1 tie, 7 negative across 13');
  p('comparable cells — with both syncpack bases reversing in every comparable age');
  p('cell and a largest reversal of −31.5pp. The confirmatory question is whether');
  p('the emitted advantage **continues to disappear or reverse** after comparing');
  p('like-aged relationships with like, out of sample.');
  p();
  p('Buckets are META-377\'s exactly. **No rebucketing was applied.** No decay');
  p('function is inferred, no recency weighting added, no age-normalized support');
  p('score created.');
  p();
  p('## Every populated age cell, all ten bases');
  p();
  p('`*` marks COMPARABLE. Sparse cells are shown, never pooled.');
  p();
  p('| Basis | Bucket | Emitted | Omitted | Emitted rate | Omitted rate | Diff | Class |');
  p('| -- | -- | --: | --: | --: | --: | --: | -- |');
  for (const b of HELD) {
    for (const k of AGE) {
      const c = P.R2[b][k];
      if (c.class === 'EMPTY') continue;
      p(`| \`${b}\` | \`${k}\`${c.class === 'COMPARABLE' ? ' \\*' : ''} | ${xn(c)} | ${on(c)} | ${c.emittedN ? pct(c.emittedRate) : '—'} | ${c.omittedN ? pct(c.omittedRate) : '—'} | ${c.class === 'COMPARABLE' ? `**${pp(c.rateDiff)}**` : '—'} | ${c.class} |`);
    }
  }
  p();
  const a = P.R2arithmetic;
  p(`**C2 = ${a.C2}** comparable cells · **P2 = ${a.P2}** emitted > omitted · **Z2 = ${a.Z2}** equal · **N2 = ${a.N2}** emitted < omitted.`);
  p(`\`P2/C2 = ${(a.P2 / a.C2).toFixed(3)}\``);
  p();
  p('## The two negative cells');
  p();
  p('| Basis | Bucket | Emitted | Omitted | Diff |');
  p('| -- | -- | --: | --: | --: |');
  for (const c of a.cells.filter((x) => x.rateDiff < 0)) {
    p(`| \`${c.basis}\` | \`${c.bucket}\` | ${xn(c)} (${pct(c.emittedRate)}) | ${on(c)} (${pct(c.omittedRate)}) | **${pp(c.rateDiff)}** |`);
  }
  p();
  p('Both are isolated: neither repository reverses in any other age bucket, and no');
  p('basis reverses in more than one.');
  p();
  p('## Disposition');
  p();
  p(`# \`${a.disposition}\``);
  p();
  p(`Rule: PREREGISTRATION §17, frozen at \`c95f7f9001bc80453af39da784d894e984b6ff87\`.`);
  p();
  p(`**Why:** ${a.why}`);
  p();
  p('Branch 1 (`C2 < 8`) did not fire — 16 comparable cells against discovery\'s 13.');
  p('Branch 2 required `N2 >= P2`; the replication produced 12 positive against 2');
  p('negative, the reverse of discovery\'s 5-versus-7. Branch 3 fired: the emitted');
  p('advantage reproduces positively in three quarters of comparable age strata.');
  p();
  p('Discovery\'s claim was that conditioning on age removes the advantage. Out of');
  p('sample the advantage **persists within like-aged strata**, in several cells');
  p('substantially — `scikitimage-b250` `25-99` +72.2pp, `fabric-b250` `0-24`');
  p('+41.2pp, `fabric-b100` `25-99` +33.3pp.');
  writeFileSync('docs/evidence/meta-378/R2-AGE.md', `${o.join('\n')}\n`);
}

// ---------------- Filter sensitivity ----------------
{
  const o = [];
  const p = (s = '') => o.push(s);
  p('# TRANSACTION-FILTER-SENSITIVITY — META-378');
  p();
  p('**Secondary. Never substituted for the primary.**');
  p();
  p('META-377 showed the held-out transaction filter can flip the disposition:');
  p('`overlapUsable` reached `MIXED_CONDITIONAL_EFFECTS` while `overlapAll` reached');
  p('`SEPARATION_SURVIVES_CONDITIONING`. META-378 measures whether **that');
  p('sensitivity itself persists out of sample**.');
  p();
  p('The identical cohort, bases, grouping, thresholds, and disposition rules were');
  p('re-run under `overlapAll` after all primary results were computed.');
  p();
  p('## Held-out ledgers');
  p();
  p('| Basis | Transactions | Merge | Bulk | Release | Revert | Dependency | Usable | Non-merge |');
  p('| -- | --: | --: | --: | --: | --: | --: | --: | --: |');
  for (const b of HELD) {
    const l = L[b];
    p(`| \`${b}\` | ${l.transactionsTotal} | ${l.merge} | ${l.bulk} | ${l.release} | ${l.revert} | ${l.dependency} | ${l.usable} | ${l.nonMerge} |`);
  }
  p();
  p('## Side-by-side dispositions');
  p();
  p('| | `overlapUsable` (PRIMARY) | `overlapAll` (secondary) |');
  p('| -- | -- | -- |');
  p(`| R1 | **${P.R1arithmetic.disposition}** | ${S.R1arithmetic.disposition} |`);
  p(`| R1 arithmetic | K=${P.R1arithmetic.K}, Rv=${P.R1arithmetic.Rv}, At=${P.R1arithmetic.At} | K=${S.R1arithmetic.K}, Rv=${S.R1arithmetic.Rv}, At=${S.R1arithmetic.At} |`);
  p(`| R2 | **${P.R2arithmetic.disposition}** | ${S.R2arithmetic.disposition} |`);
  p(`| R2 arithmetic | C2=${P.R2arithmetic.C2}, P2=${P.R2arithmetic.P2}, Z2=${P.R2arithmetic.Z2}, N2=${P.R2arithmetic.N2} | C2=${S.R2arithmetic.C2}, P2=${S.R2arithmetic.P2}, Z2=${S.R2arithmetic.Z2}, N2=${S.R2arithmetic.N2} |`);
  p(`| Composite | **${P.composite}** | ${S.composite} |`);
  p();
  p('## Required answers');
  p();
  p('**Is the direction unchanged?** Mostly, but not entirely. Under `overlapAll`');
  p('two comparable `BOTH_CURRENT` cells reverse where none reversed under the');
  p('primary, and the negative age cells rise from 2 to 4.');
  p();
  p('| Basis | Emitted | Omitted | `d_cond` | `d_uncond` |');
  p('| -- | --: | --: | --: | --: |');
  for (const c of S.R1arithmetic.cells.filter((x) => x.reversal)) {
    p(`| \`${c.basis}\` | ${xn(c)} (${pct(c.emittedRate)}) | ${on(c)} (${pct(c.omittedRate)}) | **${pp(c.dCond)}** | ${pp(c.dUncond)} |`);
  }
  p();
  p('**Does the magnitude change materially?** Yes. `overlapAll` admits bulk,');
  p('release, revert, and dependency transactions, which mechanically manufacture');
  p('co-touch. At `coretyped-b250` the omitted recurrence rate rises from 1.5% under');
  p('the primary to 72.3% under the secondary; at `fabric-b100` from 2.7% to 65.1%.');
  p('Those are not small shifts in a signal — they are a different measurement.');
  p();
  p(`**Does the R1 disposition change?** Yes: \`${P.R1arithmetic.disposition}\` → \`${S.R1arithmetic.disposition}\`.`);
  p();
  p(`**Does the R2 disposition change?** Yes: \`${P.R2arithmetic.disposition}\` → \`${S.R2arithmetic.disposition}\`.`);
  p();
  p(`**Does the overall composite change?** Yes: \`${P.composite}\` → \`${S.composite}\`.`);
  p();
  p('## What this means');
  p();
  p('**The filter sensitivity META-377 found does persist out of sample** — the');
  p('choice of transaction filter still changes the answer. But its *direction* does');
  p('not carry over. In discovery, `overlapAll` produced the stronger, cleaner');
  p('result (`SEPARATION_SURVIVES_CONDITIONING`). Here it produces the weaker one:');
  p('both components fall to `INDETERMINATE` and the composite becomes');
  p('`INSUFFICIENT_REPLICATION_SUPPORT`.');
  p();
  p('So the sensitivity is a **stable property of the measurement**, not a stable');
  p('property of the finding. That is an argument for keeping the two filters');
  p('permanently separate, and against ever reading whichever one happens to look');
  p('cleaner as the result.');
  p();
  p('The primary stands. `overlapUsable` was designated primary before any result');
  p('existed, and it is not displaced by a secondary view — in either direction.');
  writeFileSync('docs/evidence/meta-378/TRANSACTION-FILTER-SENSITIVITY.md', `${o.join('\n')}\n`);
}

// ---------------- Negative / sparse ----------------
{
  const o = [];
  const p = (s = '') => o.push(s);
  p('# NEGATIVE-SPARSE-RESULTS — META-378');
  p();
  p('Everything the disposition arithmetic could not use, preserved. Nothing here');
  p('was deleted, pooled, or backfilled to reach a threshold.');
  p();
  p('## 1. Bases excluded from the R1 arithmetic');
  p();
  p('| Basis | Repository | `BOTH_CURRENT` emitted | omitted | Class |');
  p('| -- | -- | --: | --: | -- |');
  let n1 = 0;
  for (const b of HELD) {
    const c = P.R1[b].BOTH_CURRENT;
    if (c.class === 'COMPARABLE') continue;
    n1++;
    p(`| \`${b}\` | \`${repoOf(b)}\` | ${c.emittedN} | ${c.omittedN} | ${c.class} |`);
  }
  if (!n1) p('| — | | | | none |');
  p();
  p('`coretyped-b100` carries just one emitted relationship whose endpoints both');
  p('still exist, against 51 omitted. Under the frozen threshold that cell cannot be');
  p('compared, so the basis contributes nothing to R1 and is not counted in K.');
  p();
  p('## 2. Age cells below the threshold');
  p();
  p('| Basis | Bucket | Emitted | Omitted | Class |');
  p('| -- | -- | --: | --: | -- |');
  let n2 = 0;
  for (const b of HELD) {
    for (const k of AGE) {
      const c = P.R2[b][k];
      if (c.class === 'COMPARABLE' || c.class === 'EMPTY') continue;
      n2++;
      p(`| \`${b}\` | \`${k}\` | ${c.emittedN} | ${c.omittedN} | ${c.class} |`);
    }
  }
  p();
  p(`**${n2} non-comparable age cells.** They remain in the population and in every`);
  p('denominator; they are excluded only from the comparable-cell tally that §17');
  p('operates on.');
  p();
  p('## 3. Zero-recurrence bases');
  p();
  p('| Basis | Emitted | Omitted | Note |');
  p('| -- | --: | --: | -- |');
  for (const b of HELD) {
    const m = P.marginal[b];
    if (m.emittedX + m.omittedX > 0) continue;
    p(`| \`${b}\` | ${xn(m)} | ${on(m)} | no held-out co-touch at all under the primary filter |`);
  }
  p();
  p('`hydrogen-b100` produced **zero** recurrence observations across 352');
  p('relationships. Its cells are real and comparable in denominator terms but carry');
  p('no signal in either direction; the `BOTH_CURRENT` and `100-249` cells contribute');
  p('an exact tie (`+0.0pp`) to the tallies rather than being dropped.');
  p();
  p('## 4. Pin bases');
  p();
  p('| Basis | Qualifying | Recurrence observations |');
  p('| -- | --: | --: |');
  for (const [label, b] of Object.entries(A.bases)) {
    if (!b.isPin) continue;
    p(`| \`${label}\` | ${b.qualifying} | 0 (window empty by definition) |`);
  }
  p();
  p('The five pin bases hold 1,958 relationships and contribute zero recurrence');
  p('observations, because the held-out window `(basis, pin]` is empty at a pin.');
  p('They remain in the population characterization.');
  p();
  p('## 5. Backfilled selection attempts');
  p();
  p('Recorded in `SELECTION-RECEIPT.md`: three TypeScript candidates were skipped,');
  p('all for the frozen §7 V3 first-parent-count bound, before any co-change output');
  p('existed. No entity was replaced for any other reason.');
  writeFileSync('docs/evidence/meta-378/NEGATIVE-SPARSE-RESULTS.md', `${o.join('\n')}\n`);
}

console.log('rendered R1-ENDPOINT-EXISTENCE.md, R2-AGE.md, TRANSACTION-FILTER-SENSITIVITY.md, NEGATIVE-SPARSE-RESULTS.md');
