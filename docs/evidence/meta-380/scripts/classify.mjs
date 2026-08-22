// classify.mjs — META-380 §6 source classifier, §7 test classifier, §16 B1 rules.
//
// Carried verbatim from META-289 classify.mjs. Single shared module.
// Language-keyed but REPOSITORY-AGNOSTIC: the same rules run over every
// repository in the cohort, with no per-repository branch.
// Imported by phase-a, phase-b, b2-static and checks so that one definition
// governs classification, denominators and baselines alike (invariant I8).

// ---------------------------------------------------------------- §6 exclusions

export const EXCLUDED_DIR_SEGMENTS = new Set([
  'node_modules', 'vendor', 'third_party', 'thirdparty', 'bower_components',
  'Godeps', 'dist', 'build', 'out', 'target', 'coverage', '.next', '.venv',
  'venv', 'site-packages', 'generated', 'gen', 'external', 'testdata',
  'fixtures', '__snapshots__', '.git',
]);

const EXCLUDED_BASENAME_RE = [
  /\.min\.js$/, /\.bundle\.js$/, /\.d\.ts$/,
  /\.pb\.go$/, /_pb\.go$/, /_generated\.go$/, /_gen\.go$/, /_pb2\.py$/,
];

export const SOURCE_EXTENSIONS = new Set([
  '.go', '.py', '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.java',
]);

const JS_EXT = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs']);

const segsOf = (p) => p.split('/');
const baseOf = (p) => p.slice(p.lastIndexOf('/') + 1);
const extOf = (p) => {
  const b = baseOf(p);
  const i = b.lastIndexOf('.');
  return i <= 0 ? '' : b.slice(i).toLowerCase();
};

export const inExcludedDir = (p) => segsOf(p).slice(0, -1).some((s) => EXCLUDED_DIR_SEGMENTS.has(s));
const excludedBasename = (p) => EXCLUDED_BASENAME_RE.some((re) => re.test(baseOf(p)));

// ---------------------------------------------------------------- §7 TEST

const TEST_SEGS_PY = new Set(['tests', 'test', 'testing']);
const TEST_SEGS_JS = new Set(['__tests__', '__test__', 'test', 'tests', 'spec', 'specs', 'e2e']);
const TEST_SEGS_JAVA = new Set(['test', 'tests']);

export function isTest(p) {
  if (inExcludedDir(p)) return false;
  const ext = extOf(p);
  const base = baseOf(p);
  const segs = segsOf(p).slice(0, -1);

  // T-GO
  if (ext === '.go') return /^.+_test\.go$/.test(base);

  // T-PY
  if (ext === '.py') {
    if (/^test_.+\.py$/.test(base)) return true;
    if (/^.+_test\.py$/.test(base)) return true;
    if (base === 'conftest.py') return true;
    return segs.some((s) => TEST_SEGS_PY.has(s));
  }

  // T-JS
  if (JS_EXT.has(ext)) {
    if (/^.+\.(test|spec)\.(js|jsx|ts|tsx|mjs|cjs)$/.test(base)) return true;
    return segs.some((s) => TEST_SEGS_JS.has(s));
  }

  // T-JAVA
  if (ext === '.java') {
    for (let i = 0; i + 1 < segs.length; i++) {
      if (segs[i] === 'src' && segs[i + 1] === 'test') return true;
    }
    if (/^.+(Test|Tests|TestCase|ITCase|IT)\.java$/.test(base)) return true;
    if (/^Test.+\.java$/.test(base)) return true;
    return segs.some((s) => TEST_SEGS_JAVA.has(s));
  }

  return false;
}

// ---------------------------------------------------------------- §6 SOURCE

export function isSource(p) {
  if (inExcludedDir(p)) return false;
  if (excludedBasename(p)) return false;
  if (!SOURCE_EXTENSIONS.has(extOf(p))) return false;
  return !isTest(p);
}

export function roleOf(p) {
  if (isTest(p)) return 'TEST';
  if (isSource(p)) return 'SOURCE';
  return 'OTHER';
}

// ---------------------------------------------------------------- §16 B1 rules

export const stem = (p) => {
  const b = baseOf(p);
  const i = b.lastIndexOf('.');
  return i <= 0 ? b : b.slice(0, i);
};

export function tstem(p) {
  let s = stem(p);
  for (const suf of ['_test', '-test', '.test', '_spec', '-spec', '.spec']) {
    if (s.endsWith(suf) && s.length > suf.length) { s = s.slice(0, -suf.length); break; }
  }
  for (const pre of ['test_', 'test-', 'Test']) {
    if (s.startsWith(pre) && s.length > pre.length) { s = s.slice(pre.length); break; }
  }
  for (const suf of ['TestCase', 'ITCase', 'Tests', 'Test', 'IT']) {
    if (s.endsWith(suf) && s.length > suf.length) { s = s.slice(0, -suf.length); break; }
  }
  return s;
}

const ROLE_SEGMENTS = new Set([
  'main', 'test', 'tests', '__tests__', '__test__', 'spec', 'specs', 'testing', 'e2e',
]);

export const normDir = (p) =>
  segsOf(p).slice(0, -1).map((s) => (ROLE_SEGMENTS.has(s) ? '@' : s));

export function dirshare(a, b) {
  const x = normDir(a), y = normDir(b);
  let n = 0;
  while (n < x.length && n < y.length && x[n] === y[n] && n < 5) n++;
  return n;
}

export function structuralScore(s, t) {
  const ss = stem(s).toLowerCase();
  const ts = tstem(t).toLowerCase();
  let score = 0;
  if (ts === ss) {
    score += 100;
  } else if (Math.min(ts.length, ss.length) >= 4 && (ts.includes(ss) || ss.includes(ts))) {
    score += 10;
  }
  return score + dirshare(s, t);
}

export function rank(scores) {
  return [...scores.entries()]
    .filter(([, v]) => v >= 1)
    .sort((a, b) => (b[1] - a[1]) || (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
    .map(([p]) => p);
}

// B1 score for a single (s, t) pair — used by B2 tie-break (reimplemented, no history).
export function b1Score(sourcePaths, t) {
  let best = 0;
  for (const s of sourcePaths) {
    const sc = structuralScore(s, t);
    if (sc > best) best = sc;
  }
  return best;
}
