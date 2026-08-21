// checks.mjs -- META-378 deterministic invariants (A1-A10) and red tests (X1-X7).
//
// Invariants prove the replication obeyed its own preregistration.
//
// Red tests deliberately perturb a copy of the frozen data. Each asserts TWO
// things and passes only if both hold:
//   (a) the perturbation actually MOVED the quantity its paired checker
//       inspects -- an inert perturbation is reported INVALID, never PASS;
//   (b) the invariant then FAILS.
//
// Usage: node checks.mjs [--json]
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

const asJson = process.argv.includes('--json');

const R = (p) => JSON.parse(readFileSync(`docs/evidence/meta-378/${p}`, 'utf8'));
const universe = R('raw/universe.json');
const ranked = R('raw/ranked-order.json');
const cohort = R('raw/cohort.json');
const phaseA = R('raw/phase-a.json');
const audit = R('tables/denominators.json');
const primary = R('tables/results.overlapUsable.json');
const secondary = R('tables/results.overlapAll.json');

const SEED = 'META-378/OQ-14/replication/v1';
const MINER_TREE = '1ab4f087a39f4526d49484e7260b080443d217f9';
const CAP = 50;
const MIN_N = 10;
const AGE_BUCKETS = ['0-24', '25-99', '100-249', '250-499'];

// The nine forbidden discovery observations (PREREGISTRATION section 3).
const DISCOVERY_REPOS = ['formatjs/formatjs', 'JamieMason/syncpack', 'polyfy/polylith'];
const DISCOVERY_BASES = DISCOVERY_REPOS.flatMap((r) => {
  const s = r.split('/')[1].toLowerCase();
  return ['pin', 'b100', 'b250'].map((k) => `${s}-${k}`);
});
const DISCOVERY_BASIS_SHAS = [
  '27c29bf9a40a50dac232a159b8790dbd14732c57', 'f3f07cd92a7ffb8e4686187aaa09dc3669f001da',
  '50031ffe85c20ac46491c0afd0a43704893daac0', '958d30689ac24b60623258630242330bd6d0264b',
  '233a0b37265ff278bc96ece91f8c2bbfcaeeb280', 'e59665142b309955cdf5a6a83e522f9e92457c36',
  '68dab9868274c8044817983c2424fbdbd616a456', '801e7afa6af14fcd86d4bccfa2c2f58fb199fb13',
  '23c976ba040ab904414e2dea02aac11ad98af155',
];

const results = [];
const rec = (id, ok, detail) => results.push({ id, ok, detail });

// ---------------- Invariants ----------------

// A1. ZERO confirmation rows originate from the nine discovery bases.
const confirmationRepos = [...new Set(Object.values(phaseA.bases).map((b) => b.repo))];
const confirmationShas = Object.values(phaseA.bases).map((b) => b.basis);
const confirmationLabels = Object.keys(phaseA.bases);
rec('A1:no-discovery-repository',
  confirmationRepos.every((r) => !DISCOVERY_REPOS.includes(r)),
  `${confirmationRepos.length} repos: ${confirmationRepos.join(', ')}`);
rec('A1b:no-discovery-basis-sha',
  confirmationShas.every((s) => !DISCOVERY_BASIS_SHAS.includes(s)),
  `${confirmationShas.length} basis SHAs checked against the 9 frozen discovery SHAs`);
rec('A1c:no-discovery-basis-label',
  confirmationLabels.every((l) => !DISCOVERY_BASES.includes(l)),
  confirmationLabels.join(','));

// A2. Cohort selection reproduces from the frozen universe + seed + rule.
const key = (n) => createHash('sha256').update(`${SEED}:${n}`, 'utf8').digest('hex');
let a2ok = true; const a2d = [];
for (const [lang, s] of Object.entries(ranked.strata)) {
  const recomputed = s.rankedOrder.map((c) => key(c.full_name));
  const stored = s.rankedOrder.map((c) => c.orderKey);
  const sorted = [...recomputed].sort();
  if (JSON.stringify(recomputed) !== JSON.stringify(stored)) { a2ok = false; a2d.push(`${lang}: orderKey mismatch`); }
  if (JSON.stringify(recomputed) !== JSON.stringify(sorted)) { a2ok = false; a2d.push(`${lang}: order not ascending`); }
  // the selected repository must be the rank recorded in the cohort
  const sel = cohort.strata[lang].selected;
  if (s.rankedOrder[sel.rank - 1]?.full_name !== sel.full_name) { a2ok = false; a2d.push(`${lang}: rank mismatch`); }
}
rec('A2:selection-reproducible-from-seed', a2ok, a2d.length ? a2d.join('; ') : 'all 5 strata reproduce');

// A2b. Eligibility is decidable from the committed snapshot alone.
const inUniverse = (lang, name) => universe.strata[lang].items.some((i) => i.full_name === name);
rec('A2b:selected-present-in-universe-snapshot',
  Object.entries(cohort.strata).every(([lang, s]) => inUniverse(lang, s.selected.full_name)),
  'every selected repository is in its stratum snapshot');

// A3. No entity replaced for a non-mechanical reason; every skip is a V1-V3 failure.
let a3ok = true; const a3d = [];
for (const [lang, s] of Object.entries(cohort.strata)) {
  for (const a of s.attempts) {
    if (a.status === 'SELECTED') continue;
    if (!/^V[123] /.test(a.error ?? '')) { a3ok = false; a3d.push(`${lang}/${a.full_name}: "${a.error}"`); }
  }
}
const skips = Object.values(cohort.strata).flatMap((s) => s.attempts.filter((a) => a.status !== 'SELECTED'));
rec('A3:replacement-only-mechanical', a3ok,
  a3d.length ? a3d.join('; ') : `${skips.length} skips, all V1-V3 mechanical failures`);

// A4. Miner identity matches the preregistration pin.
const minerTree = execFileSync('git', ['rev-parse', 'HEAD:packages/mining-core'], { encoding: 'utf8' }).trim();
rec('A4:miner-identity', minerTree === MINER_TREE, `${minerTree} (expected ${MINER_TREE})`);

// A5. Emitted status follows the frozen ranking exactly: rank <= 50, and the
// rank order itself obeys support DESC / occurrences ASC / files lexical.
let a5ok = true; const a5d = [];
for (const [label, b] of Object.entries(phaseA.bases)) {
  const rs = b.relationships;
  for (let i = 0; i < rs.length; i++) {
    if (rs[i].rank !== i + 1) { a5ok = false; a5d.push(`${label}: rank not dense at ${i}`); break; }
    if (rs[i].emitted !== (i + 1 <= CAP)) { a5ok = false; a5d.push(`${label}: emitted != rank<=${CAP} at ${i}`); break; }
    if (i > 0) {
      const x = rs[i - 1]; const y = rs[i];
      const ok = x.support > y.support
        || (x.support === y.support && x.occurrences < y.occurrences)
        || (x.support === y.support && x.occurrences === y.occurrences && x.files[0] < y.files[0])
        || (x.support === y.support && x.occurrences === y.occurrences && x.files[0] === y.files[0] && x.files[1] <= y.files[1]);
      if (!ok) { a5ok = false; a5d.push(`${label}: ranking violated at ${i}`); break; }
    }
  }
  if (b.emitted !== Math.min(CAP, rs.length)) { a5ok = false; a5d.push(`${label}: emitted count ${b.emitted}`); }
}
rec('A5:emitted-follows-frozen-ranking', a5ok, a5d.length ? a5d.slice(0, 3).join('; ') : `${Object.keys(phaseA.bases).length} bases`);

// A6. Endpoint existence matches the frozen rule from its own booleans.
let a6 = 0, a6bad = 0;
for (const b of Object.values(phaseA.bases)) {
  for (const r of b.relationships) {
    a6++;
    const want = r.existsA && r.existsB ? 'BOTH_CURRENT' : (r.existsA || r.existsB) ? 'ONE_ABSENT' : 'BOTH_ABSENT';
    if (r.existence !== want) a6bad++;
  }
}
rec('A6:endpoint-existence-matches-rule', a6bad === 0, `${a6 - a6bad}/${a6}`);

// A7. Age bucket matches the exact recorded age.
let a7 = 0, a7bad = 0;
const bucketOf = (d) => d == null ? 'none' : d <= 24 ? '0-24' : d <= 99 ? '25-99' : d <= 249 ? '100-249' : '250-499';
for (const b of Object.values(phaseA.bases)) {
  for (const r of b.relationships) {
    a7++;
    if (r.age !== bucketOf(r.ageDeltaPos)) a7bad++;
    if (r.ageDeltaPos != null && (r.ageDeltaPos < 0 || r.ageDeltaPos > 499)) a7bad++;
  }
}
rec('A7:age-bucket-matches-exact-age', a7bad === 0, `${a7 - a7bad}/${a7}, buckets ${AGE_BUCKETS.join('|')}`);

// A8. Primary and secondary transaction filters are not conflated: they are
// computed on separate keys and must differ somewhere in the corpus while
// sharing identical denominators.
const pm = primary.marginal; const sm = secondary.marginal;
const sameDenoms = Object.keys(pm).every((b) =>
  pm[b].emittedN === sm[b].emittedN && pm[b].omittedN === sm[b].omittedN);
const differSomewhere = Object.keys(pm).some((b) =>
  pm[b].emittedX !== sm[b].emittedX || pm[b].omittedX !== sm[b].omittedX);
rec('A8:filters-not-conflated', sameDenoms && differSomewhere,
  `identical denominators=${sameDenoms}, numerators differ somewhere=${differSomewhere}`);
rec('A8b:usable-subset-of-nonmerge',
  Object.values(R('raw/ledgers.json')).every((l) => l.usable <= l.nonMerge),
  'usable <= nonMerge at every basis');

// A9. Outcome data absent from the pre-outcome selection/audit stage.
const preOutcome = JSON.stringify({ universe, ranked, cohort, phaseA, audit });
const leaked = ['overlapUsable', 'overlapAll', 'heldOut'].filter((k) => preOutcome.includes(`"${k}"`));
rec('A9:outcome-absent-from-phase-a', leaked.length === 0,
  leaked.length ? `leaked: ${leaked.join(',')}` : 'no outcome key in universe/ranked/cohort/phase-a/audit');

// A10. Selected denominators are preserved unchanged through the analysis.
let a10ok = true; const a10d = [];
for (const [label, b] of Object.entries(phaseA.bases)) {
  const au = audit.bases[label];
  if (au.qualifying !== b.qualifying || au.emitted !== b.emitted || au.omitted !== b.omitted) {
    a10ok = false; a10d.push(`${label}: audit != phaseA`);
  }
  if (b.isPin) continue;
  const m = primary.marginal[label];
  if (m.emittedN !== b.emitted || m.omittedN !== b.omitted) { a10ok = false; a10d.push(`${label}: primary != phaseA`); }
  const s = secondary.marginal[label];
  if (s.emittedN !== b.emitted || s.omittedN !== b.omitted) { a10ok = false; a10d.push(`${label}: secondary != phaseA`); }
  // D4 and D5 partitions must each sum back to the full population.
  const d4 = ['BOTH_CURRENT', 'ONE_ABSENT', 'BOTH_ABSENT']
    .reduce((s2, k) => s2 + primary.R1[label][k].emittedN + primary.R1[label][k].omittedN, 0);
  const d5 = AGE_BUCKETS
    .reduce((s2, k) => s2 + primary.R2[label][k].emittedN + primary.R2[label][k].omittedN, 0);
  if (d4 !== b.qualifying) { a10ok = false; a10d.push(`${label}: D4 partition ${d4} != ${b.qualifying}`); }
  if (d5 !== b.qualifying) { a10ok = false; a10d.push(`${label}: D5 partition ${d5} != ${b.qualifying}`); }
}
rec('A10:denominators-preserved', a10ok, a10d.length ? a10d.slice(0, 3).join('; ') : 'phaseA == audit == primary == secondary, partitions total');

// A11. Pin bases contribute zero recurrence observations.
const pinLabels = Object.entries(phaseA.bases).filter(([, b]) => b.isPin).map(([l]) => l);
rec('A11:pin-bases-zero-recurrence',
  pinLabels.length === 5 && pinLabels.every((l) => !(l in primary.marginal) && !(l in secondary.marginal)),
  `${pinLabels.length} pin bases, none in the recurrence marginal`);

// ---------------- Red tests ----------------

const clone = (o) => JSON.parse(JSON.stringify(o));
const digest = (s) => createHash('sha256').update(JSON.stringify(s), 'utf8').digest('hex').slice(0, 12);

const red = [];
function redTest(id, what, measure, check, perturb) {
  const base = clone({ phaseA, cohort, primary, secondary });
  const before = measure(base);
  const after = clone(base);
  perturb(after);
  const afterVal = measure(after);
  const moved = digest(before) !== digest(afterVal);
  let caught = false;
  try { caught = !check(after); } catch { caught = true; }
  red.push({
    id, what, moved, caught,
    verdict: !moved ? 'INVALID (perturbation inert -- checker measures nothing that changed)'
      : caught ? 'CAUGHT' : 'MISSED',
    measured: moved ? `${digest(before)} -> ${digest(afterVal)}  [${JSON.stringify(before).slice(0, 90)} ==> ${JSON.stringify(afterVal).slice(0, 90)}]`
      : `unchanged (${digest(before)})`,
  });
}

// X1. A forbidden META-375 discovery basis is injected into the confirmation set.
redTest('X1', 'discovery basis syncpack-b100 injected into the confirmation set',
  (s) => Object.values(s.phaseA.bases).map((b) => b.repo).sort(),
  (s) => Object.values(s.phaseA.bases).every((b) => !DISCOVERY_REPOS.includes(b.repo))
    && Object.values(s.phaseA.bases).every((b) => !DISCOVERY_BASIS_SHAS.includes(b.basis)),
  (s) => {
    s.phaseA.bases['syncpack-b100'] = {
      label: 'syncpack-b100', repo: 'JamieMason/syncpack', language: 'Rust',
      basis: '233a0b37265ff278bc96ece91f8c2bbfcaeeb280', isPin: false, basisKind: 'b100',
      qualifying: 568, emitted: 50, omitted: 518, relationships: [],
    };
  });

// X2. Cohort membership: a selected repository is swapped for another.
redTest('X2', 'cohort membership swapped (Rust selection replaced)',
  (s) => Object.entries(s.cohort.strata).map(([l, x]) => `${l}:${x.selected.full_name}`),
  (s) => Object.entries(s.cohort.strata).every(([lang, x]) =>
    ranked.strata[lang].rankedOrder[x.selected.rank - 1]?.full_name === x.selected.full_name),
  (s) => { s.cohort.strata.Rust.selected.full_name = 'someone/else'; });

// X3. Emitted status flipped at one basis.
redTest('X3', 'emitted status flipped at rustos-b250',
  (s) => s.phaseA.bases['rustos-b250'].relationships.map((r) => r.emitted),
  (s) => {
    const rs = s.phaseA.bases['rustos-b250'].relationships;
    return rs.every((r, i) => r.emitted === (i + 1 <= CAP));
  },
  (s) => { for (const r of s.phaseA.bases['rustos-b250'].relationships) r.emitted = !r.emitted; });

// X4. Endpoint-existence state corrupted. The perturbation relabels the D4
// stratum -- which is what R1 groups on -- to R1's primary state, so it both
// moves the measured grouping and breaks consistency with the underlying
// existsA/existsB booleans the label is derived from.
redTest('X4', 'existence state relabelled to BOTH_CURRENT at fabric-b250',
  (s) => s.phaseA.bases['fabric-b250'].relationships.map((r) => r.existence),
  (s) => s.phaseA.bases['fabric-b250'].relationships.every((r) =>
    r.existence === (r.existsA && r.existsB ? 'BOTH_CURRENT' : (r.existsA || r.existsB) ? 'ONE_ABSENT' : 'BOTH_ABSENT')),
  (s) => { for (const r of s.phaseA.bases['fabric-b250'].relationships) r.existence = 'BOTH_CURRENT'; });

// X5. Age bucket corrupted relative to its exact age.
redTest('X5', 'age bucket relabelled at scikitimage-b100',
  (s) => s.phaseA.bases['scikitimage-b100'].relationships.map((r) => r.age),
  (s) => s.phaseA.bases['scikitimage-b100'].relationships.every((r) => r.age === bucketOf(r.ageDeltaPos)),
  (s) => { for (const r of s.phaseA.bases['scikitimage-b100'].relationships) r.age = '0-24'; });

// X6. Held-out outcome perturbed -- must move the R2 disposition arithmetic.
redTest('X6', 'held-out numerators zeroed at fabric-b250 (primary)',
  (s) => AGE_BUCKETS.map((k) => {
    const c = s.primary.R2['fabric-b250'][k];
    return `${k}:${c.emittedX}/${c.emittedN},${c.omittedX}/${c.omittedN}`;
  }),
  (s) => {
    // The R2 comparable-cell tally must still equal the committed arithmetic.
    let P = 0, Z = 0, N = 0, C = 0;
    for (const b of Object.keys(s.primary.R2)) {
      for (const k of AGE_BUCKETS) {
        const c = s.primary.R2[b][k];
        if (c.class !== 'COMPARABLE') continue;
        C++;
        const d = c.emittedX / c.emittedN - c.omittedX / c.omittedN;
        if (d > 0) P++; else if (d < 0) N++; else Z++;
      }
    }
    const A = primary.R2arithmetic;
    return C === A.C2 && P === A.P2 && Z === A.Z2 && N === A.N2;
  },
  (s) => { for (const k of AGE_BUCKETS) { s.primary.R2['fabric-b250'][k].emittedX = 0; s.primary.R2['fabric-b250'][k].omittedX = 0; } });

// X7. Primary/secondary transaction-filter identity: the secondary result is
// substituted for the primary.
redTest('X7', 'secondary overlapAll substituted for the primary result',
  (s) => [s.primary.composite, s.primary.R1arithmetic.disposition, s.primary.R2arithmetic.disposition,
    s.primary.R1arithmetic.Rv, s.primary.R2arithmetic.P2],
  (s) => s.primary.outcome === 'overlapUsable'
    && s.secondary.outcome === 'overlapAll'
    && s.primary.composite === primary.composite
    && s.primary.R1arithmetic.Rv === primary.R1arithmetic.Rv
    && s.primary.R2arithmetic.P2 === primary.R2arithmetic.P2,
  (s) => { s.primary = clone(s.secondary); });

const vFail = results.filter((r) => !r.ok);
const rBad = red.filter((r) => r.verdict !== 'CAUGHT');

if (asJson) {
  console.log(JSON.stringify({ invariants: results, redTests: red }, null, 2));
} else {
  console.log('=== INVARIANTS ===');
  for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'} ${r.id}  ${r.detail}`);
  console.log('\n=== RED TESTS ===');
  for (const r of red) console.log(`${r.verdict.padEnd(12)} ${r.id} ${r.what}\n             ${r.measured.slice(0, 200)}`);
  console.log(`\n${results.length - vFail.length}/${results.length} invariants PASS; ${red.length - rBad.length}/${red.length} red tests CAUGHT`);
}
process.exit(vFail.length === 0 && rBad.length === 0 ? 0 : 1);
