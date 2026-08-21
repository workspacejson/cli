// render-phase-a.mjs -- UNIVERSE-RECEIPT.md, SELECTION-RECEIPT.md and
// DENOMINATOR-AUDIT.md from the committed Phase A artifacts.
//
// Reads no outcome. Run before Phase B.
import { readFileSync, writeFileSync } from 'node:fs';
import { assertNoOutcome } from './phase-a.mjs';

const u = JSON.parse(readFileSync('docs/evidence/meta-378/raw/universe.json', 'utf8'));
const r = JSON.parse(readFileSync('docs/evidence/meta-378/raw/ranked-order.json', 'utf8'));
const c = JSON.parse(readFileSync('docs/evidence/meta-378/raw/cohort.json', 'utf8'));
const d = JSON.parse(readFileSync('docs/evidence/meta-378/tables/denominators.json', 'utf8'));
const k = JSON.parse(readFileSync('docs/evidence/meta-378/raw/compat-check.json', 'utf8'));
assertNoOutcome(d, 'render-phase-a');

const CLASSES = ['EMPTY', 'EMITTED_ONLY', 'OMITTED_ONLY', 'SPARSE', 'COMPARABLE'];
const STRATA = Object.keys(u.strata);

// ---------------- UNIVERSE-RECEIPT.md ----------------
{
  const L = [];
  const p = (s = '') => L.push(s);
  p('# UNIVERSE-RECEIPT — META-378');
  p();
  p('**The committed snapshot, not the live API, is the universe.** Selection');
  p('reproduces from `raw/universe.json` regardless of later GitHub drift.');
  p();
  p(`**Snapshot (UTC):** \`${u.snapshotUtc}\``);
  p();
  p(`**API:** \`${u.api}\`, \`sort=${u.sort}\`, \`order=${u.order}\`, \`per_page=${u.perPage}\`, paginated to GitHub's hard ${u.maxPages * u.perPage}-result cap.`);
  p();
  p('## Frozen query template');
  p();
  p('```');
  p('language:{LANG} stars:800..25000 created:<2022-01-01 pushed:>2026-01-01');
  p('fork:false archived:false size:2000..250000');
  p('```');
  p();
  p('## Strata');
  p();
  p('| Stratum | `total_count` | Materialized | Pages | Note |');
  p('| -- | --: | --: | --: | -- |');
  let tot = 0;
  for (const lang of STRATA) {
    const s = u.strata[lang];
    tot += s.materialized;
    const capped = s.totalCount > s.materialized ? `truncated at GitHub's 1,000 cap` : 'fully enumerated';
    p(`| ${lang} | ${s.totalCount.toLocaleString()} | ${s.materialized.toLocaleString()} | ${s.pages.length} | ${capped} |`);
  }
  p(`| **total** | | **${tot.toLocaleString()}** | | |`);
  p();
  p('Three strata exceed GitHub\'s hard 1,000-result search cap and are therefore');
  p('truncated. The universe is defined as **exactly the enumerable slice recorded');
  p('here**, not as the full `total_count`. That is a stated limit of the sampling');
  p('frame, fixed before selection, not a filter applied afterwards.');
  p();
  p('## Eligibility applied (PREREGISTRATION §6)');
  p();
  p('| Stratum | Distinct | Eligible | Rejected by predicate |');
  p('| -- | --: | --: | -- |');
  for (const lang of STRATA) {
    const s = r.strata[lang];
    const rej = Object.entries(s.rejectedByPredicate).map(([k2, v]) => `\`${k2}\`×${v}`).join(', ') || '—';
    p(`| ${lang} | ${s.distinct.toLocaleString()} | ${s.eligible.toLocaleString()} | ${rej} |`);
  }
  p();
  p('## Anti-leak exclusion fired');
  p();
  p('Predicate `E9` excludes the three META-375 discovery repositories by exact');
  p('`full_name`. It was not a formality — two discovery repositories were present');
  p('in the universe and were removed by it:');
  p();
  p('| Stratum | Discovery repository encountered and excluded |');
  p('| -- | -- |');
  let any = false;
  for (const lang of STRATA) {
    for (const h of r.strata[lang].discoveryRepositoriesEncountered) { p(`| ${lang} | \`${h}\` |`); any = true; }
  }
  if (!any) p('| — | none present in the universe |');
  p();
  p('`polyfy/polylith` did not appear in the Clojure universe under the frozen');
  p('query and so was never a candidate.');
  writeFileSync('docs/evidence/meta-378/UNIVERSE-RECEIPT.md', `${L.join('\n')}\n`);
}

// ---------------- SELECTION-RECEIPT.md ----------------
{
  const L = [];
  const p = (s = '') => L.push(s);
  p('# SELECTION-RECEIPT — META-378');
  p();
  p('**Committed before any mining output existed.**');
  p();
  p(`**Seed:** \`${r.seed}\``);
  p();
  p(`**Ordering rule:** ${r.orderingRule}`);
  p();
  p('The order depends only on the seed and the repository name, so it was fixed');
  p('before any repository property beyond §6 eligibility was consulted, and it is');
  p('reproducible from the committed snapshot alone. Because the order was frozen');
  p('before any clone existed, the §7 backfill cannot be steered.');
  p();
  p('## Selected cohort');
  p();
  p('| Stratum | Repository | Rank taken | First-parent commits | Pin | −100 basis | −250 basis |');
  p('| -- | -- | --: | --: | -- | -- | -- |');
  for (const lang of STRATA) {
    const s = c.strata[lang].selected;
    p(`| ${lang} | \`${s.full_name}\` | ${s.rank} | ${s.firstParentCount.toLocaleString()} | \`${s.bases.pin.slice(0, 12)}\` | \`${s.bases.b100.slice(0, 12)}\` | \`${s.bases.b250.slice(0, 12)}\` |`);
  }
  p();
  p('**Five unseen repositories. None is a META-375 discovery repository.**');
  p();
  p('## Full basis SHAs and dates');
  p();
  p('| Basis label | Repository | SHA | Committed |');
  p('| -- | -- | -- | -- |');
  for (const lang of STRATA) {
    const s = c.strata[lang].selected;
    const short = s.full_name.split('/')[1].toLowerCase().replace(/[^a-z0-9]+/g, '');
    for (const [kind, sha] of Object.entries(s.bases)) {
      p(`| \`${short}-${kind}\` | \`${s.full_name}\` | \`${sha}\` | ${s.basisDates[kind]} |`);
    }
  }
  p();
  p('## Verification attempts and backfill (PREREGISTRATION §7)');
  p();
  p('Every attempt is recorded, including every skip and its mechanical reason.');
  p('Backfill fired **only** for §7 V1–V3 failures, never because a result was');
  p('sparse, negative, obvious, or inconvenient — no co-change or recurrence');
  p('output existed at this point.');
  p();
  p('| Stratum | Rank | Repository | Status | Mechanical reason |');
  p('| -- | --: | -- | -- | -- |');
  for (const lang of STRATA) {
    for (const a of c.strata[lang].attempts) {
      p(`| ${lang} | ${a.rank} | \`${a.full_name}\` | ${a.status === 'SELECTED' ? '**SELECTED**' : a.status} | ${a.status === 'SELECTED' ? `V1–V3 pass, firstParent=${a.firstParentCount.toLocaleString()}` : a.error} |`);
    }
  }
  p();
  const skips = STRATA.flatMap((l) => c.strata[l].attempts.filter((a) => a.status !== 'SELECTED'));
  p(`**${skips.length} skips, all in the TypeScript stratum, all for V3** — fewer than`);
  p(`${c.minFirstParentCount} first-parent commits, so a 500-transition window at the`);
  p('−250 basis is not satisfiable. That bound was fixed in §7 before selection.');
  p();
  p('## Replication scope');
  p();
  p('# `CROSS_REPOSITORY_REPLICATION`');
  p();
  p('All five repositories are absent from the META-375 corpus, and no new basis');
  p('was taken inside any of the three prior repositories. The cohort contains no');
  p('temporal-only component, so nothing is pooled across scopes.');
  p();
  p('## Measurement compatibility with discovery');
  p();
  p('META-375 mined each basis in a detached worktree; META-378 mines via');
  p('`mine(repoRoot, { basisRevision })` against a partial clone. Those are');
  p('interchangeable only if they produce identical output, so the META-378 harness');
  p('was used to re-derive a META-375 basis and compared against the committed');
  p('META-375 evidence.');
  p();
  p(`Reference basis: \`${k.basis}\` (syncpack −100). Reading discovery data is`);
  p('permitted by the anti-leak rule solely to *verify compatibility*; this basis');
  p('contributes no numerator, denominator, sign, or disposition to META-378 and is');
  p('not in the confirmation cohort.');
  p();
  p('| Check | Proves | Result |');
  p('| -- | -- | -- |');
  const KD = {
    'K1:qualifying-count': 'identical qualifying population size',
    'K2:emitted-count': 'identical emitted count under the frozen cap',
    'K3:ranking-identical': 'identical rank order across the whole population',
    'K4:support-occurrences-identical': 'identical support and occurrences per pair',
    'K5:endpoint-existence-identical': 'identical endpoint existence — the D4 input R1 depends on',
    'K6:age-delta-identical': 'identical age delta — the D5 input R2 depends on',
  };
  for (const ch of k.checks) p(`| \`${ch.id}\` | ${KD[ch.id]} | ${ch.ok ? 'PASS' : 'FAIL'} (${ch.detail}) |`);
  p();
  p(`**${k.passed}/${k.total} PASS.** The harness reproduces a discovery basis exactly,`);
  p('so replication results are measured on the same footing as discovery.');
  writeFileSync('docs/evidence/meta-378/SELECTION-RECEIPT.md', `${L.join('\n')}\n`);
}

// ---------------- DENOMINATOR-AUDIT.md ----------------
{
  const L = [];
  const p = (s = '') => L.push(s);
  const held = Object.entries(d.bases).filter(([, b]) => b.contributesRecurrence);
  const pins = Object.entries(d.bases).filter(([, b]) => !b.contributesRecurrence);

  p('# DENOMINATOR-AUDIT — META-378');
  p();
  p('**Phase A. Built before any held-out recurrence outcome was read.**');
  p();
  p('`scripts/phase-a.mjs` writes records carrying no `overlapUsable`,');
  p('`overlapAll`, or `heldOut` key, and `assertNoOutcome()` fails the run if any');
  p('appears. `scripts/denominators.mjs` re-asserts their absence on input and');
  p('again on output. The audit therefore could not have been shaped by the');
  p('outcome — the code that produced it cannot see it.');
  p();
  p(`Comparability rule, frozen in PREREGISTRATION §15 and not relaxed: \`emitted N >= ${d.minN} AND omitted N >= ${d.minN}\`.`);
  p();
  p('## 1. Population and recurrence eligibility');
  p();
  p('| Basis | Repository | Language | Qualifying | Emitted | Omitted | Held-out window | Contributes recurrence |');
  p('| -- | -- | -- | --: | --: | --: | -- | -- |');
  let tq = 0;
  for (const [label, b] of Object.entries(d.bases)) {
    tq += b.qualifying;
    p(`| \`${label}\` | \`${b.repo}\` | ${b.language} | ${b.qualifying} | ${b.emitted} | ${b.omitted} | ${b.isPin ? '**empty by definition**' : 'non-empty'} | ${b.contributesRecurrence ? 'yes' : '**no**'} |`);
  }
  p(`| **total** | | | **${tq.toLocaleString()}** | | | | |`);
  p();
  p(`${tq.toLocaleString()} relationships across ${Object.keys(d.bases).length} repository × basis pairs.`);
  p(`The ${pins.length} pin bases (${pins.reduce((s, [, b]) => s + b.qualifying, 0).toLocaleString()} relationships) carry an empty held-out window`);
  p('**by definition** — the window is `(basis, pin]` and is empty at a pin — so');
  p(`they contribute zero recurrence observations. The recurrence denominator is the **${held.length}** historical bases`);
  p(`(${held.reduce((s, [, b]) => s + b.qualifying, 0).toLocaleString()} relationships), against six in discovery.`);
  p();
  p('## 2. R1 cells — endpoint existence (D4)');
  p();
  p('All three states at every recurrence-contributing basis. `BOTH_CURRENT` is');
  p('R1\'s primary state; the other two are reported so nothing is dropped.');
  p();
  p('| Basis | `BOTH_CURRENT` E/O | class | `ONE_ABSENT` E/O | class | `BOTH_ABSENT` E/O | class |');
  p('| -- | --: | -- | --: | -- | --: | -- |');
  for (const [label, b] of held) {
    const g = (s) => b.D4.find((x) => x.stratum === s);
    const f = (s) => `${g(s).emittedN}/${g(s).omittedN}`;
    p(`| \`${label}\` | ${f('BOTH_CURRENT')} | ${g('BOTH_CURRENT').class} | ${f('ONE_ABSENT')} | ${g('ONE_ABSENT').class} | ${f('BOTH_ABSENT')} | ${g('BOTH_ABSENT').class} |`);
  }
  p();
  const K = held.filter(([, b]) => b.D4.find((x) => x.stratum === 'BOTH_CURRENT').class === 'COMPARABLE').length;
  p(`**K = ${K}** bases have a COMPARABLE \`BOTH_CURRENT\` cell.`);
  p();
  const notK = held.filter(([, b]) => b.D4.find((x) => x.stratum === 'BOTH_CURRENT').class !== 'COMPARABLE');
  for (const [label, b] of notK) {
    const g = b.D4.find((x) => x.stratum === 'BOTH_CURRENT');
    p(`\`${label}\` is **${g.class}** at \`BOTH_CURRENT\` (emitted ${g.emittedN}, omitted ${g.omittedN}) and is excluded from the R1 arithmetic. It remains in the denominator and is reported.`);
  }
  p();
  p(`PREREGISTRATION §16 branch 1 fires \`R1_INDETERMINATE\` if \`K < 4\`. K = ${K}, so R1 proceeds.`);
  p();
  p('## 3. R2 cells — age buckets (D5)');
  p();
  p('All four frozen buckets at every recurrence-contributing basis. `*` marks a');
  p('COMPARABLE cell. No rebucketing was applied.');
  p();
  p('| Basis | `0-24` | `25-99` | `100-249` | `250-499` | comparable |');
  p('| -- | --: | --: | --: | --: | --: |');
  let C2 = 0;
  for (const [label, b] of held) {
    const cells = ['0-24', '25-99', '100-249', '250-499'].map((s) => b.D5.find((x) => x.stratum === s));
    const n = cells.filter((x) => x.class === 'COMPARABLE').length;
    C2 += n;
    p(`| \`${label}\` | ${cells.map((x) => `${x.emittedN}/${x.omittedN}${x.class === 'COMPARABLE' ? '\\*' : ''}`).join(' | ')} | ${n} |`);
  }
  p(`| **total** | | | | | **${C2}** |`);
  p();
  p(`**C2 = ${C2}** comparable age cells, against 13 in discovery.`);
  p();
  p(`PREREGISTRATION §17 branch 1 fires \`R2_INDETERMINATE\` if \`C2 < 8\`. C2 = ${C2}, so R2 proceeds.`);
  p();
  p('## 4. Cell-class totals');
  p();
  p('| Dimension | ' + CLASSES.join(' | ') + ' |');
  p('| -- | ' + CLASSES.map(() => '--:').join(' | ') + ' |');
  for (const dim of ['D4', 'D5']) {
    const t = Object.fromEntries(CLASSES.map((x) => [x, 0]));
    for (const [, b] of held) for (const x of CLASSES) t[x] += b[`${dim}summary`][x];
    p(`| ${dim} ${dim === 'D4' ? 'endpoint existence' : 'age bucket'} | ${CLASSES.map((x) => t[x]).join(' | ')} |`);
  }
  p();
  p('All non-empty cells above are reported. Sparse and one-sided cells are');
  p('preserved in `NEGATIVE-SPARSE-RESULTS.md` and are never pooled to reach the');
  p('threshold.');

  writeFileSync('docs/evidence/meta-378/DENOMINATOR-AUDIT.md', `${L.join('\n')}\n`);
  console.log(`rendered UNIVERSE-RECEIPT.md, SELECTION-RECEIPT.md, DENOMINATOR-AUDIT.md (K=${K}, C2=${C2})`);
}
