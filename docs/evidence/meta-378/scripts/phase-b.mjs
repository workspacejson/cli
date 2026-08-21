// phase-b.mjs -- META-378 Phase B. The ONLY stage permitted to read the
// held-out recurrence outcome.
//
// Computes the held-out transaction ledger per basis, applies both frozen
// transaction filters on SEPARATE keys, evaluates the R1 and R2 confirmatory
// rules exactly as frozen in PREREGISTRATION sections 16-18, and emits the
// composite disposition.
//
// The cohort, bases, grouping, thresholds, and disposition arithmetic were all
// frozen and committed before this script produced any number:
//   preregistration  c95f7f9001bc80453af39da784d894e984b6ff87
//   phase A / audit  4505ba9001cfd3c1ef3e4e6a480a8393257f89a7
//
// Usage: node phase-b.mjs <workDir>
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const WORK = process.argv[2];
if (!WORK) { console.error('usage: node phase-b.mjs <workDir>'); process.exit(2); }

const MIN_N = 10;                                              // section 15
const AGE_BUCKETS = ['0-24', '25-99', '100-249', '250-499'];   // section 13
const EXISTENCE = ['BOTH_CURRENT', 'ONE_ABSENT', 'BOTH_ABSENT'];

const a = JSON.parse(readFileSync('docs/evidence/meta-378/raw/phase-a.json', 'utf8'));
const cohort = JSON.parse(readFileSync('docs/evidence/meta-378/raw/cohort.json', 'utf8'));

const dirOf = new Map();
for (const s of Object.values(cohort.strata)) dirOf.set(s.selected.full_name, s.selected.dir);
const pinOf = new Map();
for (const s of Object.values(cohort.strata)) pinOf.set(s.selected.full_name, s.selected.bases.pin);

const git = (cwd, ...args) =>
  execFileSync('git', args, { cwd, encoding: 'utf8', maxBuffer: 1 << 28 });

// section 14 held-out transaction rule, carried VERBATIM from META-375
// characterize.mjs. Not re-derived, not retuned.
function ledger(repoDir, basisSha, pinSha, isPin) {
  const shas = isPin
    ? []
    : git(repoDir, 'rev-list', '--first-parent', '--reverse', `${basisSha}..${pinSha}`)
      .trim().split('\n').filter(Boolean);
  const transactions = [];
  for (const sha of shas) {
    const subject = git(repoDir, 'log', '-1', '--format=%s', sha).trim();
    const parents = git(repoDir, 'rev-list', '--parents', '-n', '1', sha).trim().split(' ').slice(1);
    const parent = parents[0];
    const raw = parent
      ? git(repoDir, 'diff-tree', '-r', '--name-status', '-M50%', '--no-commit-id', parent, sha).trim()
      : '';
    const files = raw ? raw.split('\n').map((l) => { const t = l.split('\t'); return t[t.length - 1]; }) : [];
    const s = subject.toLowerCase();
    const isRelease =
      /^(chore\(release\)|release[:(]|chore: release)/.test(s) ||
      /^v?\d+\.\d+\.\d+/.test(s) ||
      (/^chore/.test(s) && /\brelease\b/.test(s));
    const isRevert = /^revert/.test(s);
    const isDep =
      /^(chore|fix|build)\(deps(-dev)?\)/.test(s) ||
      /^(chore|build): (update|bump) /.test(s) ||
      /\b(bump|update)\b.*\b(to v?\d|dependency|dependencies|lockfile)\b/.test(s);
    transactions.push({
      sha, subject,
      mergeOnFirstParent: parents.length > 1,
      bulk: files.length > 50,
      release: isRelease,
      revert: isRevert,
      dependency: isDep,
      nFiles: files.length,
      fileSet: new Set(files),
    });
  }
  const usable = transactions.filter(
    (t) => !t.mergeOnFirstParent && !t.bulk && !t.release && !t.revert && !t.dependency);
  const nonMerge = transactions.filter((t) => !t.mergeOnFirstParent);
  return { transactions, usable, nonMerge };
}

// ---- Phase B: attach outcomes on SEPARATE keys (section 14) ----
const rows = [];
const ledgers = {};
for (const [label, b] of Object.entries(a.bases)) {
  const dir = dirOf.get(b.repo);
  const lg = ledger(dir, b.basis, pinOf.get(b.repo), b.isPin);
  ledgers[label] = {
    repo: b.repo,
    isPin: b.isPin,
    transactionsTotal: lg.transactions.length,
    merge: lg.transactions.filter((t) => t.mergeOnFirstParent).length,
    bulk: lg.transactions.filter((t) => t.bulk).length,
    release: lg.transactions.filter((t) => t.release).length,
    revert: lg.transactions.filter((t) => t.revert).length,
    dependency: lg.transactions.filter((t) => t.dependency).length,
    usable: lg.usable.length,
    nonMerge: lg.nonMerge.length,
  };
  for (const r of b.relationships) {
    const [x, y] = r.files;
    rows.push({
      basis: label,
      repo: b.repo,
      language: b.language,
      isPin: b.isPin,
      emitted: r.emitted,
      existence: r.existence,
      age: r.age,
      // Two filters, two keys, never conflated.
      overlapUsable: lg.usable.some((t) => t.fileSet.has(x) && t.fileSet.has(y)),
      overlapAll: lg.nonMerge.some((t) => t.fileSet.has(x) && t.fileSet.has(y)),
    });
  }
  console.log(`${label}: tx=${lg.transactions.length} usable=${lg.usable.length} nonMerge=${lg.nonMerge.length}`);
}

const HELD = [...new Set(rows.filter((r) => !r.isPin).map((r) => r.basis))].sort();

const classify = (e, o) =>
  e === 0 && o === 0 ? 'EMPTY' : o === 0 ? 'EMITTED_ONLY' : e === 0 ? 'OMITTED_ONLY'
    : (e >= MIN_N && o >= MIN_N ? 'COMPARABLE' : 'SPARSE');

function cell(sub, key) {
  const e = sub.filter((r) => r.emitted);
  const o = sub.filter((r) => !r.emitted);
  const eX = e.filter((r) => r[key]).length;
  const oX = o.filter((r) => r[key]).length;
  return {
    emittedX: eX, emittedN: e.length, omittedX: oX, omittedN: o.length,
    emittedRate: e.length ? eX / e.length : null,
    omittedRate: o.length ? oX / o.length : null,
    rateDiff: e.length && o.length ? eX / e.length - oX / o.length : null,
    class: classify(e.length, o.length),
  };
}

function analyse(key) {
  const out = { outcome: key, marginal: {}, R1: {}, R2: {} };

  for (const basis of HELD) {
    const sub = rows.filter((r) => r.basis === basis);
    out.marginal[basis] = cell(sub, key);

    out.R1[basis] = Object.fromEntries(
      EXISTENCE.map((s) => [s, cell(sub.filter((r) => r.existence === s), key)]));
    out.R2[basis] = Object.fromEntries(
      AGE_BUCKETS.map((s) => [s, cell(sub.filter((r) => r.age === s), key)]));
  }

  // ---- section 16 R1 rule ----
  const r1cells = [];
  for (const basis of HELD) {
    const c = out.R1[basis].BOTH_CURRENT;
    if (c.class !== 'COMPARABLE') continue;
    const dCond = c.rateDiff;
    const dUncond = out.marginal[basis].rateDiff;
    r1cells.push({
      basis, repo: rows.find((r) => r.basis === basis).repo,
      ...c, dCond, dUncond,
      reversal: dCond < 0,
      attenuation: dCond < dUncond,
    });
  }
  const K = r1cells.length;
  const Rv = r1cells.filter((c) => c.reversal).length;
  const At = r1cells.filter((c) => c.attenuation).length;
  let r1;
  if (K < 4) r1 = { disposition: 'R1_INDETERMINATE', why: `K=${K} < 4 (branch 1)` };
  else if (Rv / K >= 1 / 3 && At / K >= 1 / 2)
    r1 = { disposition: 'R1_REPLICATED', why: `Rv/K=${(Rv / K).toFixed(3)}>=0.333 and At/K=${(At / K).toFixed(3)}>=0.5 (branch 2)` };
  else if (Rv === 0 && At / K < 1 / 2)
    r1 = { disposition: 'R1_NOT_REPLICATED', why: `Rv=0 and At/K=${(At / K).toFixed(3)}<0.5 (branch 3)` };
  else
    r1 = { disposition: 'R1_INDETERMINATE', why: `K=${K}, Rv/K=${(Rv / K).toFixed(3)}, At/K=${(At / K).toFixed(3)} — no branch 2 or 3 condition met (branch 4)` };
  out.R1arithmetic = { K, Rv, At, ratios: { 'Rv/K': K ? Rv / K : null, 'At/K': K ? At / K : null }, cells: r1cells, ...r1 };

  // ---- section 17 R2 rule ----
  const r2cells = [];
  for (const basis of HELD) {
    for (const bucket of AGE_BUCKETS) {
      const c = out.R2[basis][bucket];
      if (c.class !== 'COMPARABLE') continue;
      r2cells.push({ basis, repo: rows.find((r) => r.basis === basis).repo, bucket, ...c });
    }
  }
  const C2 = r2cells.length;
  const P2 = r2cells.filter((c) => c.rateDiff > 0).length;
  const Z2 = r2cells.filter((c) => c.rateDiff === 0).length;
  const N2 = r2cells.filter((c) => c.rateDiff < 0).length;
  let r2;
  if (C2 < 8) r2 = { disposition: 'R2_INDETERMINATE', why: `C2=${C2} < 8 (branch 1)` };
  else if (N2 >= P2) r2 = { disposition: 'R2_REPLICATED', why: `N2=${N2} >= P2=${P2} (branch 2)` };
  else if (P2 / C2 >= 2 / 3) r2 = { disposition: 'R2_NOT_REPLICATED', why: `P2/C2=${(P2 / C2).toFixed(3)}>=0.667 (branch 3)` };
  else r2 = { disposition: 'R2_INDETERMINATE', why: `C2=${C2}, P2=${P2}, N2=${N2}, P2/C2=${(P2 / C2).toFixed(3)} — no branch 2 or 3 condition met (branch 4)` };
  out.R2arithmetic = { C2, P2, Z2, N2, cells: r2cells, ...r2 };

  // ---- section 18 composite ----
  const d1 = out.R1arithmetic.disposition;
  const d2 = out.R2arithmetic.disposition;
  out.composite =
    d1.endsWith('INDETERMINATE') || d2.endsWith('INDETERMINATE') ? 'INSUFFICIENT_REPLICATION_SUPPORT'
      : d1 === 'R1_REPLICATED' && d2 === 'R2_REPLICATED' ? 'BOTH_PATTERNS_REPLICATE'
        : d1 === 'R1_REPLICATED' && d2 === 'R2_NOT_REPLICATED' ? 'ENDPOINT_ONLY_REPLICATES'
          : d2 === 'R2_REPLICATED' && d1 === 'R1_NOT_REPLICATED' ? 'AGE_ONLY_REPLICATES'
            : 'NEITHER_PATTERN_REPLICATES';
  return out;
}

const primary = analyse('overlapUsable');
const secondary = analyse('overlapAll');

writeFileSync('docs/evidence/meta-378/raw/ledgers.json', `${JSON.stringify(ledgers, null, 2)}\n`);
writeFileSync('docs/evidence/meta-378/tables/results.overlapUsable.json', `${JSON.stringify(primary, null, 2)}\n`);
writeFileSync('docs/evidence/meta-378/tables/results.overlapAll.json', `${JSON.stringify(secondary, null, 2)}\n`);

for (const [name, o] of [['PRIMARY overlapUsable', primary], ['SECONDARY overlapAll', secondary]]) {
  console.log(`\n===== ${name} =====`);
  console.log('per-basis marginal (unconditioned):');
  for (const b of HELD) {
    const m = o.marginal[b];
    console.log(`  ${b.padEnd(20)} emitted ${m.emittedX}/${m.emittedN} (${(m.emittedRate * 100).toFixed(1)}%)  omitted ${m.omittedX}/${m.omittedN} (${(m.omittedRate * 100).toFixed(1)}%)  ${(m.rateDiff * 100).toFixed(1)}pp`);
  }
  console.log(`R1: K=${o.R1arithmetic.K} Rv=${o.R1arithmetic.Rv} At=${o.R1arithmetic.At} -> ${o.R1arithmetic.disposition}`);
  console.log(`    ${o.R1arithmetic.why}`);
  console.log(`R2: C2=${o.R2arithmetic.C2} P2=${o.R2arithmetic.P2} Z2=${o.R2arithmetic.Z2} N2=${o.R2arithmetic.N2} -> ${o.R2arithmetic.disposition}`);
  console.log(`    ${o.R2arithmetic.why}`);
  console.log(`COMPOSITE: ${o.composite}`);
}
