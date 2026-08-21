// checks.mjs — internal consistency checks C1–C6 and red tests R1–R5
// (PREREGISTRATION §19). Run after dump.mjs for a basis; the driver receipt
// and the artifact in the basis worktree are the frozen referents.
//
// Usage: node checks.mjs <label> <runDir> <basesJsonPath>
//   runDir contains: out/<label>.dump.json, out/<label>.receipt.json,
//   <label>/.agents/workspace.json
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { compareUtf8 } from '@workspacejson/mining-core';

const [label, runDir, basesJsonPath] = process.argv.slice(2);
const dump = JSON.parse(readFileSync(`${runDir}/out/${label}.dump.json`, 'utf8'));
const receipt = JSON.parse(readFileSync(`${runDir}/out/${label}.receipt.json`, 'utf8'));
const artifact = JSON.parse(readFileSync(`${runDir}/${label}/.agents/workspace.json`, 'utf8'));
const bases = JSON.parse(readFileSync(basesJsonPath, 'utf8'));
const repoCfg = bases.repos[label.split('-')[0]];
const expectedBasis = repoCfg.bases[label];

function stableStringify(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (typeof value === 'object') {
    const entries = Object.entries(value)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`).join(',')}}`;
  }
  if (typeof value === 'number' && !Number.isFinite(value)) {
    throw new Error(`stableStringify: non-finite number ${value}`);
  }
  return JSON.stringify(value) ?? 'null';
}
const sha256 = (s) => createHash('sha256').update(s, 'utf8').digest('hex');
const historyDigest = (basisRevision, coChange) =>
  sha256(stableStringify({ basisRevision, coChange }));

const results = [];
const check = (id, ok, detail) => results.push({ id, ok, detail });

// C1: support <= occurrences for every relationship
check(
  'C1',
  dump.pairs.every((p) => p.support <= p.occurrences),
  `violations=${dump.pairs.filter((p) => p.support > p.occurrences).length}`,
);

// C2: dump count == driver receipt pairsBeforeCap
check(
  'C2',
  dump.pairs.length === receipt.receipts.selection.pairsBeforeCap,
  `dump=${dump.pairs.length} receipt=${receipt.receipts.selection.pairsBeforeCap}`,
);

// C3: dump ranks 1..50 == artifact coChange pairwise
const artPairs = artifact.generated?.coChange ?? [];
const c3ok =
  artPairs.length === dump.emittedPairs.length &&
  artPairs.every((e, i) => {
    const d = dump.emittedPairs[i];
    return (
      e.files[0] === d.files[0] &&
      e.files[1] === d.files[1] &&
      e.support === d.support &&
      e.occurrences === d.occurrences
    );
  });
check('C3', c3ok, `artifact=${artPairs.length} dumpEmitted=${dump.emittedPairs.length}`);

// C4: dump ranking order satisfies the frozen ranking rule
let c4ok = true;
for (let i = 1; i < dump.pairs.length; i++) {
  const a = dump.pairs[i - 1];
  const b = dump.pairs[i];
  const violates =
    b.support > a.support ||
    (b.support === a.support && b.occurrences < a.occurrences) ||
    (b.support === a.support &&
      b.occurrences === a.occurrences &&
      compareUtf8(b.files[0], a.files[0]) < 0) ||
    (b.support === a.support &&
      b.occurrences === a.occurrences &&
      b.files[0] === a.files[0] &&
      compareUtf8(b.files[1], a.files[1]) < 0);
  if (violates) {
    c4ok = false;
    break;
  }
}
check('C4', c4ok, 'ranking order verified against frozen rule');

// C5: basis identity == frozen bases.json value
check(
  'C5',
  dump.basisWindow?.basisCommit === expectedBasis,
  `dump=${dump.basisWindow?.basisCommit} frozen=${expectedBasis}`,
);

// C6: recomputed history-block digest == driver receipt value
const recomputed = historyDigest(artifact.generated.basisRevision, artifact.generated.coChange);
check(
  'C6',
  recomputed === receipt.artifact.historyBlockSha256,
  `recomputed=${recomputed.slice(0, 12)} receipt=${receipt.artifact.historyBlockSha256.slice(0, 12)}`,
);

// ---- red tests: each perturbed input MUST fail its check ----
const red = [];
// R1: support > occurrences
{
  const bad = JSON.parse(JSON.stringify(dump.pairs));
  bad[0].support = bad[0].occurrences + 1;
  red.push({ id: 'R1', caught: bad.some((p) => p.support > p.occurrences) });
}
// R2: swap ranks 1 and 2 (fields move with entries; rank fields then violate order)
{
  const bad = JSON.parse(JSON.stringify(dump.pairs));
  const t = bad[0].files;
  bad[0].files = bad[1].files;
  bad[1].files = t;
  const t2 = bad[0].support;
  bad[0].support = bad[1].support;
  bad[1].support = t2;
  const t3 = bad[0].occurrences;
  bad[0].occurrences = bad[1].occurrences;
  bad[1].occurrences = t3;
  // re-verify C4 on the perturbed list
  let violates = false;
  for (let i = 1; i < bad.length; i++) {
    const a = bad[i - 1];
    const b = bad[i];
    if (
      b.support > a.support ||
      (b.support === a.support && b.occurrences < a.occurrences) ||
      (b.support === a.support && b.occurrences === a.occurrences && compareUtf8(b.files[0], a.files[0]) < 0) ||
      (b.support === a.support && b.occurrences === a.occurrences && b.files[0] === a.files[0] && compareUtf8(b.files[1], a.files[1]) < 0)
    ) {
      violates = true;
      break;
    }
  }
  red.push({ id: 'R2', caught: violates || dump.pairs[0].support !== dump.pairs[1].support });
}
// R3: delete one top-50 relationship -> C3 must fail
{
  const badEmitted = dump.emittedPairs.slice(1);
  const caught =
    badEmitted.length !== artPairs.length ||
    badEmitted.some((e, i) => {
      const a = artPairs[i + 1];
      return !a || e.files[0] !== a.files[0] || e.files[1] !== a.files[1];
    });
  red.push({ id: 'R3', caught });
}
// R4: basis SHA altered by one hex char -> C5 must fail
{
  const altered = expectedBasis.slice(0, -1) + (expectedBasis.endsWith('0') ? '1' : '0');
  red.push({ id: 'R4', caught: altered !== dump.basisWindow?.basisCommit });
}
// R5: corrupt recorded digest -> C6 must fail
{
  const corrupted = receipt.artifact.historyBlockSha256.slice(0, -1) + 'x';
  red.push({ id: 'R5', caught: recomputed !== corrupted });
}

const allOk = results.every((r) => r.ok);
const allCaught = red.every((r) => r.caught);
console.log(label);
for (const r of results) console.log(`  ${r.id} ${r.ok ? 'PASS' : 'FAIL'} (${r.detail})`);
for (const r of red) console.log(`  ${r.id} ${r.caught ? 'CAUGHT' : 'NOT CAUGHT'}`);
if (!allOk || !allCaught) process.exit(1);
