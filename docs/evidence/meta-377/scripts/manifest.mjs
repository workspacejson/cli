// manifest.mjs — MANIFEST.json for the META-377 evidence tree.
// Records SHA-256 for every committed META-377 artifact plus the pinned
// META-375 input SHA, so the tree can be verified without a git checkout.
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, relative } from 'node:path';

const ROOT = 'docs/evidence/meta-377';
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

const conditioned = JSON.parse(readFileSync(join(ROOT, 'tables/conditioned.overlapUsable.json'), 'utf8'));
const sensitivity = JSON.parse(readFileSync(join(ROOT, 'tables/conditioned.overlapAll.json'), 'utf8'));

writeFileSync(join(ROOT, 'MANIFEST.json'), `${JSON.stringify({
  issue: 'META-377',
  question: 'Does the current global top-50 held-out recurrence advantage survive when relationships are conditioned on descriptive characteristics observable at T0?',
  fiberyQuestion: 'OQ-13',
  input: {
    meta375GitHubSha: '0af756a18cf376ee5b7063a98ce63deb2ad97ff4',
    meta375TreeSha: '3394365c1fa7581b61fdcf5c1ba1c1d08d91b7e3',
    relationships: 9203,
    bases: 9,
    heldOutBases: 6,
    pinBasesContributingRecurrence: 0,
  },
  freeze: {
    analysisPlanCommit: 'f09a1c96ce7c9c868adc65ef7ed8fbb42d1d3a0d',
    denominatorAuditCommit: 'b09ac06b35f5f0b0159ca29a67aeba10af7d0765',
  },
  primaryOutcome: 'overlapUsable',
  disposition: conditioned.disposition.disposition,
  dispositionArithmetic: {
    C: conditioned.disposition.C,
    P: conditioned.disposition.P,
    Z: conditioned.disposition.Z,
    N: conditioned.disposition.N,
    B: conditioned.disposition.B,
    ratios: conditioned.disposition.ratios,
    why: conditioned.disposition.why,
  },
  sensitivityOutcome: {
    outcome: 'overlapAll',
    disposition: sensitivity.disposition.disposition,
    C: sensitivity.disposition.C,
    P: sensitivity.disposition.P,
    Z: sensitivity.disposition.Z,
    N: sensitivity.disposition.N,
    note: 'Reported separately, never pooled with the primary. The two measures disagree; the divergence is a finding.',
  },
  meta376: 'BLOCKED',
  rerun: 'bash docs/evidence/meta-377/rerun.sh',
  files,
}, null, 2)}\n`);

console.log(`MANIFEST.json: ${files.length} files, disposition=${conditioned.disposition.disposition}`);
