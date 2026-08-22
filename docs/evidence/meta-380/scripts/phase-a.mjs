// phase-a.mjs — META-380 PRE-OUTCOME stage.
//
// Builds, for every evaluation query, the ranked candidate lists from
// information available strictly before T: H, H-MAX, B0, B1, and B2_STATIC/v1.
//
// This script MUST NOT read, persist or branch on the TEST-role touches of an
// evaluation transaction. It reads S(T) — the SOURCE-role touches — because
// that IS the query (§12).
//
// The expanding window (§9) is enforced structurally: the walk goes
// oldest -> newest, and on reaching an evaluation transaction it SNAPSHOTS
// the count tables, ranks, and only THEN folds T's own contribution in.
//
// B2_STATIC/v1 graphs are built from T0 trees only, using the TypeScript
// compiler API for import resolution. No history, no outcome.
import { readFileSync, writeFileSync, mkdtempSync, rmSync, mkdirSync, existsSync, readdirSync, lstatSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, dirname, relative, extname } from 'node:path';
import { isSource, isTest, structuralScore, rank, b1Score } from './classify.mjs';
import { firstParentTransactions, isEligibleTxn, treePaths, firstParentOf, git } from './gitmine.mjs';

const SCAN_BOUND = 600, EVAL_N = 200;                       // §10
const SEP = ' ';
const B2_DEPTH = 4;                                          // §17

// §25 fixed key allowlist for a pre-outcome record.
export const RECORD_KEYS = ['repo', 'stratum', 'pin', 'T', 'T0', 'tIndex', 'sourcePaths',
  'suiteSize', 'suiteSha256', 'rankedH', 'rankedHMax', 'rankedB0', 'rankedB1', 'rankedB2',
  'historyTxnCount', 'b2GraphSha256', 'b2EdgeCount', 'b2Validity'];

const sha256 = (s) => createHash('sha256').update(s, 'utf8').digest('hex');

// --- B2_STATIC/v1 helpers (carried from META-379, generalized for any repo) ---

const require = createRequire(import.meta.url);
let ts;
try { ts = require('typescript'); } catch {
  try { ts = require('../../../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript'); }
  catch { ts = null; }
}

const tsFile = (p) => ['.ts', '.tsx', '.mts', '.cts', '.js', '.jsx', '.mjs', '.cjs'].includes(extname(p));

function walkFs(root, d = '') {
  const out = [];
  for (const n of readdirSync(join(root, d))) {
    const p = join(root, d, n);
    const q = d ? `${d}/${n}` : n;
    const s = lstatSync(p);
    if (s.isSymbolicLink()) continue;
    if (s.isDirectory()) { if (n !== '.git' && n !== 'node_modules') out.push(...walkFs(root, q)); }
    else out.push(q);
  }
  return out;
}

const nearestTsconfig = (root, file) => {
  let d = dirname(join(root, file));
  for (;;) {
    const c = join(d, 'tsconfig.json');
    if (existsSync(c)) return c;
    if (d === root) return join(root, 'tsconfig.json');
    d = dirname(d);
  }
};

const tsOptions = (config) =>
  ts.parseJsonConfigFileContent(ts.readConfigFile(config, ts.sys.readFile).config, ts.sys, dirname(config)).options;

const EXCLUDED_DIR_SET = new Set(['node_modules', '.git', 'dist', 'build', 'out', 'target', 'coverage', '.next', 'vendor', 'third_party', 'bower_components']);

const tsconfigCache = new Map();
const tsOptionsForRoot = (root, file) => {
  let d = dirname(join(root, file));
  for (;;) {
    const c = join(d, 'tsconfig.json');
    if (existsSync(c)) {
      if (!tsconfigCache.has(c)) {
        tsconfigCache.set(c, ts.parseJsonConfigFileContent(ts.readConfigFile(c, ts.sys.readFile).config, ts.sys, dirname(c)).options);
      }
      return tsconfigCache.get(c);
    }
    if (d === root) {
      const fb = join(root, 'tsconfig.json');
      if (!tsconfigCache.has(fb)) tsconfigCache.set(fb, { moduleResolution: ts.ModuleResolutionKind.NodeJs });
      return tsconfigCache.get(fb);
    }
    d = dirname(d);
  }
};

// Parse a single file's imports and return its edge list
function parseFileEdges(root, p, pathSet) {
  const file = join(root, p);
  const content = ts.sys.readFile(file);
  if (!content) return [];
  const opt = tsOptionsForRoot(root, p);
  const sf = ts.createSourceFile(file, content, ts.ScriptTarget.Latest, false, true);
  const out = [];
  for (const st of sf.statements) {
    if (!ts.isImportDeclaration(st) || !ts.isStringLiteral(st.moduleSpecifier)) continue;
    const r = ts.resolveModuleName(st.moduleSpecifier.text, file, opt, ts.sys).resolvedModule?.resolvedFileName;
    if (!r) continue;
    const q = relative(root, r).split('\\').join('/');
    if (pathSet.has(q)) out.push(q);
  }
  return [...new Set(out)].sort();
}

// Build full graph from extracted tree
function buildGraph(root) {
  const paths = [];
  function walk(d) {
    for (const n of readdirSync(join(root, d))) {
      if (EXCLUDED_DIR_SET.has(n)) continue;
      const p = d ? `${d}/${n}` : n;
      const s = lstatSync(join(root, p));
      if (s.isSymbolicLink()) continue;
      if (s.isDirectory()) walk(p);
      else if (tsFile(p)) paths.push(p);
    }
  }
  walk('');
  paths.sort();
  const pathSet = new Set(paths);
  const edges = new Map();
  for (const p of paths) edges.set(p, parseFileEdges(root, p, pathSet));
  return { paths, edges };
}

// Incrementally update graph: only re-parse changed files.
// changedFiles: array of {path, status} where status is 'A'/'M'/'D'/'R'
function updateGraph(root, prevGraph, changedFiles) {
  const paths = [...prevGraph.paths];
  const pathSet = new Set(paths);
  const edges = new Map(prevGraph.edges);
  
  for (const cf of changedFiles) {
    if (!tsFile(cf.path)) continue;
    if (cf.status === 'D') {
      pathSet.delete(cf.path);
      edges.delete(cf.path);
      const i = paths.indexOf(cf.path);
      if (i >= 0) paths.splice(i, 1);
    } else {
      // Added or modified
      if (!pathSet.has(cf.path)) {
        pathSet.add(cf.path);
        paths.push(cf.path);
      }
      edges.set(cf.path, parseFileEdges(root, cf.path, pathSet));
    }
  }
  
  // An added local module may make a formerly unresolved import resolvable, so
  // in that case every importer must be re-resolved.  For modifications and
  // deletions, the prior graph identifies importers whose edge can change.
  const changedSet = new Set(changedFiles.filter(cf => tsFile(cf.path)).map(cf => cf.path));
  const added = changedFiles.some((cf) => tsFile(cf.path) && cf.status === 'A');
  for (const [p, eps] of edges) {
    if (changedSet.has(p)) continue; // already re-parsed
    if (added || eps.some(e => changedSet.has(e))) {
      edges.set(p, parseFileEdges(root, p, pathSet));
    }
  }
  
  paths.sort();
  return { paths, edges };
}

const pkgIdentity = (root, p) => {
  let d = dirname(join(root, p));
  for (;;) {
    if (existsSync(join(d, 'package.json'))) return relative(root, d).split('\\').join('/') || '.';
    if (d === root) return '.';
    d = dirname(d);
  }
};

function bfsDistance(edges, start, targets, limit) {
  const goal = new Set(targets);
  const seen = new Set([start]);
  const q = [[start, 0]];
  while (q.length) {
    const [p, n] = q.shift();
    if (goal.has(p)) return n;
    if (n === limit) continue;
    for (const x of edges.get(p) || []) {
      if (!seen.has(x)) { seen.add(x); q.push([x, n + 1]); }
    }
  }
  return null;
}

// A reverse multi-source BFS is exactly equivalent to separately searching
// importer -> dependency paths from every candidate test, but avoids repeating
// the same bounded traversal once per test.  `d[t]` is the shortest directed
// path from t to any query source in the forward import graph.
function distancesToSources(edges, sourcePaths, limit) {
  const reverse = new Map();
  for (const [from, tos] of edges) {
    if (!reverse.has(from)) reverse.set(from, []);
    for (const to of tos) {
      const xs = reverse.get(to) ?? [];
      xs.push(from);
      reverse.set(to, xs);
    }
  }
  const d = new Map();
  const q = [];
  for (const s of sourcePaths) {
    if (!edges.has(s) || d.has(s)) continue;
    d.set(s, 0);
    q.push(s);
  }
  for (let i = 0; i < q.length; i++) {
    const p = q[i], n = d.get(p);
    if (n === limit) continue;
    for (const importer of reverse.get(p) ?? []) {
      if (!d.has(importer)) { d.set(importer, n + 1); q.push(importer); }
    }
  }
  return d;
}

function b2Rank(root, edges, tests, sourcePaths) {
  const ds = distancesToSources(edges, sourcePaths, B2_DEPTH);
  return tests.map((t) => {
    const d = ds.get(t);
    return {
      t,
      hasPath: d !== undefined,
      d: d ?? 999,
      sameP: sourcePaths.some((s) => pkgIdentity(root, s) === pkgIdentity(root, t)),
      b1: b1Score(sourcePaths, t),
    };
  }).sort((a, b) =>
    (Number(b.hasPath) - Number(a.hasPath)) ||
    (a.d - b.d) ||
    (Number(b.sameP) - Number(a.sameP)) ||
    (b.b1 - a.b1) ||
    a.t.localeCompare(b.t)
  ).map((x) => x.t);
}

// --- Phase A main ---

export function buildRepo(stratum, fullName, dir, pin, opts = {}) {
  const { leakT = false, b0DependsOnSource = false, b1UsesHistory = false } = opts;

  if (!ts) throw new Error('typescript module not available — cannot build B2 graphs');
  tsconfigCache.clear();  // reset per-repo since root paths change

  // §10 evaluation window
  const scan = firstParentTransactions(dir, pin, SCAN_BOUND);
  const evalShas = new Set();
  for (const t of scan) {
    if (!isEligibleTxn(t)) continue;
    if (t.touched.some(isSource)) evalShas.add(t.sha);
    if (evalShas.size >= EVAL_N) break;
  }
  if (evalShas.size !== EVAL_N) throw new Error(`${fullName}: eval window ${evalShas.size} != ${EVAL_N}`);

  // §9 has an expanding, uncapped history window. The 600-edge bound applies
  // only when selecting evaluation transactions, never to their history.
  const all = firstParentTransactions(dir, pin).reverse();

  const support = new Map();
  const pop = new Map();
  let historyTxnCount = 0;

  const dict = []; const dictIdx = new Map();
  const idx = (p) => {
    let i = dictIdx.get(p);
    if (i === undefined) { i = dict.length; dict.push(p); dictIdx.set(p, i); }
    return i;
  };

  const fold = (t) => {
    const srcs = new Set(t.touched.filter(isSource));
    const tests = [...new Set(t.touched.filter(isTest))];
    for (const te of tests) pop.set(te, (pop.get(te) ?? 0) + 1);
    for (const s of srcs) {
      for (const te of tests) {
        const k = s + SEP + te;
        support.set(k, (support.get(k) ?? 0) + 1);
      }
    }
    historyTxnCount++;
  };

  // B2 validity accumulators
  let b2EdgeCountTotal = 0, b2SourceCount = 0, b2TestCount = 0;
  let b2PathQueries = 0, b2DiffQueries = 0, b2AblationChanged = 0, b2Top10Moves = 0;
  let b2GraphHashes = [];

  // B2 incremental state: keep extracted tree + graph across queries
  let b2Root = null;       // current extracted tree path
  let b2Graph = null;      // current { paths, edges }
  let b2PrevT0 = null;     // previous T0 SHA
  const b2RootsToClean = [];  // all extracted roots for cleanup

  const records = [];
  let tIndex = 0;

  for (const t of all) {
    const eligible = isEligibleTxn(t);

    if (leakT && eligible && evalShas.has(t.sha)) fold(t);

    if (evalShas.has(t.sha)) {
      const T0 = firstParentOf(dir, t.sha);
      if (!T0) throw new Error(`${fullName}: ${t.sha} has no first parent`);

      const suite = treePaths(dir, T0).filter(isTest);
      const sourcePaths = [...new Set(t.touched.filter(isSource))].sort();
      if (sourcePaths.length === 0) throw new Error(`${fullName}: eval txn with empty S(T)`);

      // --- H, H-MAX, B0, B1 (from history, structural) ---
      const hSum = new Map(), hMax = new Map(), b0 = new Map(), b1 = new Map();
      for (const cand of suite) {
        let sum = 0, mx = 0, st = 0;
        for (const s of sourcePaths) {
          const c = support.get(s + SEP + cand) ?? 0;
          sum += c;
          if (c > mx) mx = c;
          const sc = structuralScore(s, cand);
          if (sc > st) st = sc;
        }
        if (b1UsesHistory) st += sum;
        if (sum > 0) hSum.set(cand, sum);
        if (mx > 0) hMax.set(cand, mx);
        if (st > 0) b1.set(cand, st);
        let pc = pop.get(cand) ?? 0;
        if (b0DependsOnSource && sum > 0) pc += 1;
        if (pc > 0) b0.set(cand, pc);
      }

      // --- B2_STATIC/v1 (incremental: full build for first T0, diff for rest) ---
      let b2List = [];
      let b2GraphSha = '';
      let b2Edges = 0;

      if (b2PrevT0 === T0) {
        // Same T0 as previous query — reuse graph entirely
        const tests = b2Graph.paths.filter(isTest);
        const sources = b2Graph.paths.filter(isSource);
        b2Edges = [...b2Graph.edges.values()].reduce((n, x) => n + x.length, 0);
        b2EdgeCountTotal += b2Edges;
        b2SourceCount += sources.length;
        b2TestCount += tests.length;
        b2GraphSha = sha256(JSON.stringify([...b2Graph.edges]));
        b2GraphHashes.push(b2GraphSha);
        b2List = b2Rank(b2Root, b2Graph.edges, tests, sourcePaths);
        if (tests.some((tt) => distancesToSources(b2Graph.edges, sourcePaths, B2_DEPTH).has(tt))) b2PathQueries++;
        const b1List = rank(b1);
        if (JSON.stringify(b2List) !== JSON.stringify(b1List)) b2DiffQueries++;
        const topB2 = new Set(b2List.slice(0, 10)), topB1 = new Set(b1List.slice(0, 10));
        b2Top10Moves += [...new Set([...topB2, ...topB1])].filter((p) => topB2.has(p) !== topB1.has(p)).length;
        const e2 = new Map([...b2Graph.edges].map(([k]) => [k, []]));
        if (JSON.stringify(b2Rank(b2Root, e2, tests, sourcePaths)) !== JSON.stringify(b2List)) b2AblationChanged++;
      } else if (b2PrevT0 === null) {
        // First T0: full extraction + graph build
        b2Root = mkdtempSync(join(tmpdir(), 'meta380-'));
        b2RootsToClean.push(b2Root);
        execFileSync('sh', ['-c', `git -C '${dir}' archive '${T0}' | tar -x -C '${b2Root}'`], { stdio: 'pipe', timeout: 120_000 });
        b2Graph = buildGraph(b2Root);
        b2PrevT0 = T0;
        const tests = b2Graph.paths.filter(isTest);
        const sources = b2Graph.paths.filter(isSource);
        b2Edges = [...b2Graph.edges.values()].reduce((n, x) => n + x.length, 0);
        b2EdgeCountTotal += b2Edges;
        b2SourceCount += sources.length;
        b2TestCount += tests.length;
        b2GraphSha = sha256(JSON.stringify([...b2Graph.edges]));
        b2GraphHashes.push(b2GraphSha);
        b2List = b2Rank(b2Root, b2Graph.edges, tests, sourcePaths);
        if (tests.some((tt) => distancesToSources(b2Graph.edges, sourcePaths, B2_DEPTH).has(tt))) b2PathQueries++;
        const b1List = rank(b1);
        if (JSON.stringify(b2List) !== JSON.stringify(b1List)) b2DiffQueries++;
        const topB2 = new Set(b2List.slice(0, 10)), topB1 = new Set(b1List.slice(0, 10));
        b2Top10Moves += [...new Set([...topB2, ...topB1])].filter((p) => topB2.has(p) !== topB1.has(p)).length;
        const e2 = new Map([...b2Graph.edges].map(([k]) => [k, []]));
        if (JSON.stringify(b2Rank(b2Root, e2, tests, sourcePaths)) !== JSON.stringify(b2List)) b2AblationChanged++;
      } else {
        // Subsequent T0: diff against previous, update files in-place, incrementally update graph
        const diffRaw = execFileSync('git', ['-C', dir, 'diff', '--name-status', b2PrevT0, T0], { encoding: 'utf8' });
        const changedFiles = [];
        for (const line of diffRaw.split('\n').filter(Boolean)) {
          const parts = line.split('\t');
          const status = parts[0][0]; // A, M, D, R (rename)
          const path = status === 'R' ? parts[2] : parts[1];
          changedFiles.push({ path, status });
          // For renames, also delete old path
          if (status === 'R') changedFiles.push({ path: parts[1], status: 'D' });
        }

        // Update extracted tree: remove deleted files, extract new/modified files
        for (const cf of changedFiles) {
          const fullPath = join(b2Root, cf.path);
          if (cf.status === 'D') {
            try { rmSync(fullPath); } catch {}
          } else {
            try {
              mkdirSync(dirname(fullPath), { recursive: true });
              execFileSync('sh', ['-c', `git -C '${dir}' show '${T0}:${cf.path}' > '${fullPath}'`], { stdio: 'pipe', timeout: 30_000 });
            } catch {}
          }
        }

        b2Graph = updateGraph(b2Root, b2Graph, changedFiles);
        b2PrevT0 = T0;
        const tests = b2Graph.paths.filter(isTest);
        const sources = b2Graph.paths.filter(isSource);
        b2Edges = [...b2Graph.edges.values()].reduce((n, x) => n + x.length, 0);
        b2EdgeCountTotal += b2Edges;
        b2SourceCount += sources.length;
        b2TestCount += tests.length;
        b2GraphSha = sha256(JSON.stringify([...b2Graph.edges]));
        b2GraphHashes.push(b2GraphSha);
        b2List = b2Rank(b2Root, b2Graph.edges, tests, sourcePaths);
        if (tests.some((tt) => distancesToSources(b2Graph.edges, sourcePaths, B2_DEPTH).has(tt))) b2PathQueries++;
        const b1List = rank(b1);
        if (JSON.stringify(b2List) !== JSON.stringify(b1List)) b2DiffQueries++;
        const topB2 = new Set(b2List.slice(0, 10)), topB1 = new Set(b1List.slice(0, 10));
        b2Top10Moves += [...new Set([...topB2, ...topB1])].filter((p) => topB2.has(p) !== topB1.has(p)).length;
        const e2 = new Map([...b2Graph.edges].map(([k]) => [k, []]));
        if (JSON.stringify(b2Rank(b2Root, e2, tests, sourcePaths)) !== JSON.stringify(b2List)) b2AblationChanged++;
      }

      records.push({
        repo: fullName, stratum, pin, T: t.sha, T0, tIndex: tIndex++,
        sourcePaths,
        suiteSize: suite.length,
        suiteSha256: sha256([...suite].sort().join('\n')),
        rankedH: rank(hSum).map(idx),
        rankedHMax: rank(hMax).map(idx),
        rankedB0: rank(b0).map(idx),
        rankedB1: rank(b1).map(idx),
        rankedB2: b2List.map(idx),
        historyTxnCount,
        b2GraphSha256: b2GraphSha,
        b2EdgeCount: b2Edges,
        b2Validity: true,  // per-query placeholder; aggregate computed below
      });
    }

    if (eligible && !(leakT && evalShas.has(t.sha))) fold(t);
  }

  // Cleanup B2 extracted trees
  for (const r of b2RootsToClean) {
    try { rmSync(r, { recursive: true, force: true }); } catch {}
  }

  if (records.length !== EVAL_N) throw new Error(`${fullName}: ${records.length} records != ${EVAL_N}`);

  // B2 validity aggregate
  const b2Validity = {
    queries: records.length,
    meanGraphSourceFiles: b2SourceCount / records.length,
    meanGraphTestFiles: b2TestCount / records.length,
    meanResolvedEdges: b2EdgeCountTotal / records.length,
    queriesWithTestToSourcePath: b2PathQueries,
    queriesWithTestToSourcePathFraction: b2PathQueries / records.length,
    queriesRankingDiffersFromB1: b2DiffQueries,
    queriesRankingDiffersFromB1Fraction: b2DiffQueries / records.length,
    top10MembershipMovesVsB1: b2Top10Moves,
    edgeAblationQueriesChanged: b2AblationChanged,
    edgeAblationQueriesChangedFraction: b2AblationChanged / records.length,
  };

  return { fullName, stratum, pin, dict, records,
    totalEligibleTxns: historyTxnCount, totalFirstParentTxns: all.length,
    b2Validity };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const cohort = JSON.parse(readFileSync('docs/evidence/meta-380/raw/cohort.json', 'utf8'));
  const out = { issue: 'META-380', stage: 'PRE-OUTCOME',
    preregistration: 'docs/evidence/meta-380/PREREGISTRATION.md',
    recordKeyAllowlist: RECORD_KEYS, repos: {} };

  for (const [stratum, s] of Object.entries(cohort.strata)) {
    for (const sel of s.selected) {
      const r = buildRepo(stratum, sel.full_name, sel.dir, sel.pin);
      out.repos[sel.full_name] = r;
      const hCov = r.records.filter((x) => x.rankedH.length > 0).length;
      const b0Cov = r.records.filter((x) => x.rankedB0.length > 0).length;
      const b1Cov = r.records.filter((x) => x.rankedB1.length > 0).length;
      const b2Cov = r.records.filter((x) => x.rankedB2.length > 0).length;
      console.log(`${stratum} ${sel.full_name}: ${r.records.length} queries, ${r.totalEligibleTxns} eligible of ${r.totalFirstParentTxns} fp txns, dict=${r.dict.length}`);
      console.log(`   non-empty: H=${hCov} B0=${b0Cov} B1=${b1Cov} B2=${b2Cov} | history before first query = ${r.records[0].historyTxnCount}`);
      console.log(`   B2 validity: ${JSON.stringify(r.b2Validity)}`);
    }
  }

  // §25 assertion: no key outside the allowlist
  const allow = new Set(RECORD_KEYS);
  for (const r of Object.values(out.repos)) {
    for (const rec of r.records) {
      for (const k of Object.keys(rec)) if (!allow.has(k)) throw new Error(`disallowed pre-outcome key: ${k}`);
      if (Object.keys(rec).length !== RECORD_KEYS.length) throw new Error('record key count mismatch');
    }
  }
  console.log('\n§25 key-allowlist assertion: PASS');
  writeFileSync('docs/evidence/meta-380/raw/pre-outcome.json', `${JSON.stringify(out)}\n`);
  console.log('raw/pre-outcome.json written (NO outcome field present)');
}
