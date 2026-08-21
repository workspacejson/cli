// phase-a.mjs -- META-378 Phase A: mine, characterize, and build denominators
// WITHOUT reading the held-out recurrence outcome.
//
// PREREGISTRATION section 20 (outcome isolation): the records this script
// writes carry no `overlapUsable` / `overlapAll` / `heldOut` keys. An assertion
// fails the run if they appear. Phase B is the only stage permitted to read the
// outcome.
//
// Per relationship this records exactly what R1 and R2 need -- emitted status,
// endpoint existence (D4), age bucket (D5) -- and nothing else. Exposure,
// persistence, and role are OUT OF SCOPE per section 21 and are not computed.
//
// Usage: node phase-a.mjs <workDir>
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { mine, score, select, compareUtf8 } from '../../../../packages/mining-core/dist/index.js';

const CAP = 50;              // section 11
const MIN_SUPPORT = 3;       // section 9
const WINDOW = 500;          // section 9

const cohort = JSON.parse(readFileSync('docs/evidence/meta-378/raw/cohort.json', 'utf8'));

const git = (cwd, ...args) =>
  execFileSync('git', args, { cwd, encoding: 'utf8', maxBuffer: 1 << 28 });

// section 13 age bucketing, verbatim from META-377 lib.mjs.
function ageBucket(deltaPos) {
  if (deltaPos == null) return 'none';
  if (deltaPos <= 24) return '0-24';
  if (deltaPos <= 99) return '25-99';
  if (deltaPos <= 249) return '100-249';
  if (deltaPos <= 499) return '250-499';
  throw new Error(`age ${deltaPos} exceeds the frozen bucket range (max 499)`);
}

// section 12 endpoint existence, verbatim from META-375 characterize.mjs.
const existenceState = (a, b) => (a && b ? 'BOTH_CURRENT' : (a || b) ? 'ONE_ABSENT' : 'BOTH_ABSENT');

const pairKey = (a, b) => (compareUtf8(a, b) <= 0 ? `${a} ${b}` : `${b} ${a}`);

export async function characterizeBasis(repoDir, label, basisSha, isPin) {
  const observations = await mine(repoDir, { basisRevision: basisSha, windowTransitions: WINDOW });
  const scored = score(observations);
  select(scored, { minSupport: MIN_SUPPORT });   // frozen projection call; ranking replicated below

  // section 11 frozen ranking, replicated verbatim from META-375 dump.mjs.
  const ranked = [...scored.pairs].sort(
    (x, y) =>
      y.support - x.support ||
      x.occurrences - y.occurrences ||
      compareUtf8(x.files[0], y.files[0]) ||
      compareUtf8(x.files[1], y.files[1]),
  );

  const excluded = new Set(scored.exclusions.excludedCommits);
  const scoredEvents = observations.events.filter((e) => !excluded.has(e.commit));

  // Most-recent supporting scored event per qualifying pair -> age.
  //
  // Carried verbatim from META-375 dump.mjs: the decay origin is
  // `events.length - 1`, positions are sorted ascending, and the most recent
  // supporting event is the LARGEST position, giving the SMALLEST delta:
  //
  //     deltaPos = origin - max(position of a scored event touching both)
  //
  // Verified against the committed META-375 evidence by compat-check.mjs K6.
  const origin = observations.events.length > 0 ? observations.events.length - 1 : 0;
  const qualifying = new Set(ranked.map((p) => pairKey(p.files[0], p.files[1])));
  const maxPos = new Map();
  for (const e of scoredEvents) {
    const fs = e.files;
    for (let i = 0; i < fs.length; i++) {
      for (let j = i + 1; j < fs.length; j++) {
        const k = pairKey(fs[i], fs[j]);
        if (!qualifying.has(k)) continue;
        const cur = maxPos.get(k);
        if (cur === undefined || e.position > cur) maxPos.set(k, e.position);
      }
    }
  }

  // Tree listing at the basis -> endpoint existence.
  const treeFiles = new Set(
    git(repoDir, 'ls-tree', '-r', '--name-only', basisSha).split('\n').filter(Boolean),
  );

  const relationships = ranked.map((p, i) => {
    const [a, b] = p.files;
    const existsA = treeFiles.has(a);
    const existsB = treeFiles.has(b);
    const mrp = maxPos.get(pairKey(a, b));
    const deltaPos = mrp === undefined ? null : origin - mrp;
    return {
      rank: i + 1,
      files: [a, b],
      support: p.support,
      occurrences: p.occurrences,
      emitted: i + 1 <= CAP,
      existsA,
      existsB,
      existence: existenceState(existsA, existsB),
      ageDeltaPos: deltaPos,
      age: ageBucket(deltaPos),
    };
  });

  return {
    label,
    basis: basisSha,
    isPin,
    extractedEvents: observations.events.length,
    scoredEvents: scoredEvents.length,
    qualifying: relationships.length,
    emitted: relationships.filter((r) => r.emitted).length,
    omitted: relationships.filter((r) => !r.emitted).length,
    relationships,
  };
}

const OUTCOME_KEYS = ['overlapUsable', 'overlapAll', 'heldOut'];
export function assertNoOutcome(node, where) {
  const seen = JSON.stringify(node);
  for (const k of OUTCOME_KEYS) {
    if (seen.includes(`"${k}"`)) {
      throw new Error(`section 20 outcome isolation violated: key "${k}" present in Phase A data (${where})`);
    }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const WORK = process.argv[2];
  if (!WORK) { console.error('usage: node phase-a.mjs <workDir>'); process.exit(2); }
  const out = { issue: 'META-378', phase: 'A', outcomeIsolated: true, bases: {} };

  for (const [lang, s] of Object.entries(cohort.strata)) {
    const repo = s.selected.full_name;
    const dir = s.selected.dir;
    const short = repo.split('/')[1].toLowerCase().replace(/[^a-z0-9]+/g, '');
    for (const [kind, sha] of Object.entries(s.selected.bases)) {
      const label = `${short}-${kind}`;
      const r = await characterizeBasis(dir, label, sha, kind === 'pin');
      r.repo = repo;
      r.language = lang;
      r.basisKind = kind;
      assertNoOutcome(r, label);
      out.bases[label] = r;
      console.log(`${label}: qualifying=${r.qualifying} emitted=${r.emitted} omitted=${r.omitted} events=${r.extractedEvents} pin=${r.isPin}`);
    }
  }

  assertNoOutcome(out, 'phase-a root');
  writeFileSync('docs/evidence/meta-378/raw/phase-a.json', `${JSON.stringify(out, null, 2)}\n`);
  console.log(`\nphase-a.json written: ${Object.keys(out.bases).length} bases, outcome keys absent (section 20 assertion passed)`);
}
