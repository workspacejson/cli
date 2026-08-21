// manifest.mjs -- MANIFEST.json for the META-378 evidence tree.
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, relative } from 'node:path';

const ROOT = 'docs/evidence/meta-378';
const SKIP = new Set(['MANIFEST.json']);

function walk(d, acc = []) {
  for (const e of readdirSync(d).sort()) {
    const p = join(d, e);
    if (statSync(p).isDirectory()) walk(p, acc);
    else acc.push(p);
  }
  return acc;
}

const files = walk(ROOT)
  .map((p) => relative(ROOT, p))
  .filter((p) => !SKIP.has(p))
  .sort()
  .map((p) => ({
    path: p,
    bytes: statSync(join(ROOT, p)).size,
    sha256: createHash('sha256').update(readFileSync(join(ROOT, p))).digest('hex'),
  }));

const P = JSON.parse(readFileSync(join(ROOT, 'tables/results.overlapUsable.json'), 'utf8'));
const S = JSON.parse(readFileSync(join(ROOT, 'tables/results.overlapAll.json'), 'utf8'));
const C = JSON.parse(readFileSync(join(ROOT, 'raw/cohort.json'), 'utf8'));
const A = JSON.parse(readFileSync(join(ROOT, 'raw/phase-a.json'), 'utf8'));
const K = JSON.parse(readFileSync(join(ROOT, 'raw/compat-check.json'), 'utf8'));

writeFileSync(join(ROOT, 'MANIFEST.json'), `${JSON.stringify({
  issue: 'META-378',
  question: 'Do the two strongest conditional patterns discovered in META-377 -- endpoint-existence dilution/reversal within BOTH_CURRENT and age-conditioned reversal -- reproduce on unseen historical bases and/or unseen repositories under a preregistered protocol?',
  fiberyQuestion: 'OQ-14',
  kind: 'confirmatory replication',
  replicationScope: 'CROSS_REPOSITORY_REPLICATION',
  inputs: {
    meta375: '0af756a18cf376ee5b7063a98ce63deb2ad97ff4',
    meta377: '59ca94a37b05f33d556e9fcd28bf6197648dff68',
    meta377Disposition: 'MIXED_CONDITIONAL_EFFECTS',
  },
  freeze: {
    preregistrationCommit: 'c95f7f9001bc80453af39da784d894e984b6ff87',
    phaseACommit: '4505ba9001cfd3c1ef3e4e6a480a8393257f89a7',
  },
  miner: {
    package: '@workspacejson/mining-core',
    treeSha: '1ab4f087a39f4526d49484e7260b080443d217f9',
    compatibleWithProducerPin: '031c3504a0977b8d90ac518c82a39a2f4ec741a9',
    windowTransitions: 500,
    minSupport: 3,
    cap: 50,
  },
  antiLeak: {
    discoveryRepositoriesExcluded: ['formatjs/formatjs', 'JamieMason/syncpack', 'polyfy/polylith'],
    excludedFromUniverseAtSelection: ['formatjs/formatjs', 'JamieMason/syncpack'],
    confirmationRepositories: [...new Set(Object.values(A.bases).map((b) => b.repo))],
    discoveryRowsInConfirmation: 0,
  },
  universe: { snapshotUtc: JSON.parse(readFileSync(join(ROOT, 'raw/universe.json'), 'utf8')).snapshotUtc, records: 3823, strata: 5 },
  seed: C.seed,
  cohort: Object.fromEntries(Object.entries(C.strata).map(([lang, s]) => [lang, {
    repository: s.selected.full_name,
    rankTaken: s.selected.rank,
    firstParentCount: s.selected.firstParentCount,
    bases: s.selected.bases,
  }])),
  population: {
    bases: Object.keys(A.bases).length,
    relationships: Object.values(A.bases).reduce((s, b) => s + b.qualifying, 0),
    recurrenceContributingBases: Object.values(A.bases).filter((b) => !b.isPin).length,
    recurrenceContributingRelationships: Object.values(A.bases).filter((b) => !b.isPin).reduce((s, b) => s + b.qualifying, 0),
    pinRelationshipsContributingZero: Object.values(A.bases).filter((b) => b.isPin).reduce((s, b) => s + b.qualifying, 0),
  },
  primaryOutcome: 'overlapUsable',
  result: {
    R1: { disposition: P.R1arithmetic.disposition, K: P.R1arithmetic.K, Rv: P.R1arithmetic.Rv, At: P.R1arithmetic.At, why: P.R1arithmetic.why },
    R2: { disposition: P.R2arithmetic.disposition, C2: P.R2arithmetic.C2, P2: P.R2arithmetic.P2, Z2: P.R2arithmetic.Z2, N2: P.R2arithmetic.N2, why: P.R2arithmetic.why },
    composite: P.composite,
  },
  secondaryOutcome: {
    outcome: 'overlapAll',
    R1: { disposition: S.R1arithmetic.disposition, K: S.R1arithmetic.K, Rv: S.R1arithmetic.Rv, At: S.R1arithmetic.At },
    R2: { disposition: S.R2arithmetic.disposition, C2: S.R2arithmetic.C2, P2: S.R2arithmetic.P2, Z2: S.R2arithmetic.Z2, N2: S.R2arithmetic.N2 },
    composite: S.composite,
    note: 'Secondary sensitivity only. Never substituted for the primary. The filter sensitivity persists out of sample but its direction does not.',
  },
  compatibilityCheck: { referenceBasis: K.basis, passed: K.passed, total: K.total },
  meta376: 'BLOCKED',
  rerun: 'bash docs/evidence/meta-378/rerun.sh <workDir>',
  files,
}, null, 2)}\n`);

console.log(`MANIFEST.json: ${files.length} files, composite=${P.composite}`);
