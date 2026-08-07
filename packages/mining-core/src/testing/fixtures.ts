/**
 * Synthetic git fixtures, one per REQ-005 state.
 *
 * Built in a temp directory rather than committed, because a committed git
 * repository inside a git repository is a submodule or a packed oddity, and
 * both make the fixture harder to read than the script that produces it. The
 * script IS the specification of what each state looks like.
 *
 * Every commit pins author and committer identity and date, so fixture object
 * ids are stable across machines and REQ-004's byte-identical claim is a
 * property of the miner rather than of the clock.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

const FIXED_DATE = '2026-01-01T00:00:00+0000';

const FIXED_ENV = {
  GIT_AUTHOR_NAME: 'Fixture',
  GIT_AUTHOR_EMAIL: 'fixture@example.invalid',
  GIT_COMMITTER_NAME: 'Fixture',
  GIT_COMMITTER_EMAIL: 'fixture@example.invalid',
  GIT_AUTHOR_DATE: FIXED_DATE,
  GIT_COMMITTER_DATE: FIXED_DATE,
  GIT_CONFIG_NOSYSTEM: '1',
  LC_ALL: 'C',
};

export function git(cwd: string, args: readonly string[]): string {
  return execFileSync('git', [...args], {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, ...FIXED_ENV },
  });
}

export function makeTempDir(label: string): string {
  return mkdtempSync(join(tmpdir(), `wsj-l0-${label}-`));
}

export function removeDir(path: string): void {
  rmSync(path, { recursive: true, force: true });
}

function initRepo(root: string): void {
  git(root, ['init', '--quiet', '--initial-branch=main']);
  git(root, ['config', 'user.name', 'Fixture']);
  git(root, ['config', 'user.email', 'fixture@example.invalid']);
  // Rename detection is part of the frozen extraction parameters, so the
  // fixture must not have it disabled by an inherited global config.
  git(root, ['config', 'diff.renames', 'true']);
}

export function writeAndAdd(root: string, path: string, content: string): void {
  const full = join(root, path);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content, 'utf8');
  git(root, ['add', '--', path]);
}

export function commit(root: string, message: string): void {
  git(root, ['commit', '--quiet', '-m', message]);
}

/**
 * State 1 via NO_COMMITS: an initialized repository with no commits.
 * Absence of history, not absence of coupling.
 */
export function makeEmptyRepo(): string {
  const root = makeTempDir('empty');
  initRepo(root);
  return root;
}

/**
 * State 2: real history, every commit touching exactly one file, so no pair
 * ever co-occurs. Mining ran and the answer is genuinely "no relationship".
 */
export function makeUncoupledRepo(): string {
  const root = makeTempDir('uncoupled');
  initRepo(root);
  for (const [index, path] of ['src/a.ts', 'src/b.ts', 'src/c.ts'].entries()) {
    writeAndAdd(root, path, `export const v${index} = ${index};\n`);
    commit(root, `add ${path}`);
  }
  // Further single-file edits, still never two files in one commit.
  writeAndAdd(root, 'src/a.ts', 'export const v0 = 99;\n');
  commit(root, 'edit a');
  return root;
}

/**
 * State 3: two files that change together three times and share no import.
 * The shape the thesis rests on, in miniature.
 */
export function makeCoupledRepo(): string {
  const root = makeTempDir('coupled');
  initRepo(root);

  writeAndAdd(root, 'src/build.ts', 'export const key = (a: string, b: number) => `${a}:${b}`;\n');
  writeAndAdd(root, 'src/parse.ts', "export const parse = (k: string) => k.split(':');\n");
  writeAndAdd(root, 'README.md', '# fixture\n');
  commit(root, 'initial');

  for (const round of [1, 2]) {
    writeAndAdd(root, 'src/build.ts', `export const key = (a: string, b: number) => \`\${a}:\${b}:${round}\`;\n`);
    writeAndAdd(root, 'src/parse.ts', `// round ${round}\nexport const parse = (k: string) => k.split(':');\n`);
    commit(root, `round ${round}`);
  }

  // A lone commit so not every event is the coupled pair.
  writeAndAdd(root, 'README.md', '# fixture\n\nnotes\n');
  commit(root, 'docs');

  return root;
}

/**
 * A shallow clone of a coupled repository — REQ-006.
 *
 * The point of cloning the *coupled* fixture is that a shallow clone of an
 * uncoupled repository would report no pairs for the right reason by accident.
 * Here the full history has a real pair and the shallow clone cannot see it, so
 * an unguarded miner returns a confident, wrong, non-empty-looking answer.
 */
export function makeShallowCloneOfCoupled(): { source: string; shallow: string } {
  const source = makeCoupledRepo();
  const shallow = makeTempDir('shallow');
  removeDir(shallow);
  git(process.cwd(), ['clone', '--quiet', '--depth', '1', `file://${source}`, shallow]);
  return { source, shallow };
}

/**
 * State 4: a repository whose HEAD resolves but whose history cannot be walked.
 *
 * Built by deleting the root commit's loose object. `rev-parse HEAD^{commit}`
 * still succeeds because HEAD's own object is intact, so this is genuinely
 * "evidence reachable but unavailable" and not "no history" — which is the
 * distinction REQ-005's state 4 exists to carry. Returns `undefined` when the
 * objects turn out to be packed, so the caller skips rather than asserting
 * against a repository that was never corrupted.
 */
export function makeCorruptedRepo(): string | undefined {
  const root = makeCoupledRepo();
  const rootCommit = git(root, ['rev-list', '--max-parents=0', 'HEAD']).trim();
  const loose = join(root, '.git', 'objects', rootCommit.slice(0, 2), rootCommit.slice(2));
  if (!existsSync(loose)) return undefined;
  rmSync(loose);
  return root;
}

/** A path that is not a git repository at all. */
export function makeNonRepo(): string {
  const root = makeTempDir('nonrepo');
  writeFileSync(join(root, 'plain.txt'), 'not a repository\n', 'utf8');
  return root;
}
