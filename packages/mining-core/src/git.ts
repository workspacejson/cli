/**
 * Git access for L0 (REQ-001, REQ-002).
 *
 * The only module in this package that invokes git. Everything above it works
 * on the extracted event set, which is what makes the L2 direction invariant
 * checkable later: a report that reads the artifact touches nothing here.
 *
 * Commands are exactly META-289 v2.2.1's frozen extraction parameters, written
 * out rather than composed, because the point of a frozen parameter is that a
 * reader can compare it to the preregistration without reconstructing it.
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { normalizePath } from './paths.js';

const run = promisify(execFile);

/** Raised when git itself fails. Distinct from "git ran and said no". */
export class GitInvocationError extends Error {
  constructor(
    readonly args: readonly string[],
    readonly cause: unknown,
  ) {
    super(`git ${args.join(' ')} failed: ${cause instanceof Error ? cause.message : String(cause)}`);
    this.name = 'GitInvocationError';
  }
}

/** Raised when git succeeds but its output violates an extraction invariant. */
export class GitOutputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GitOutputError';
  }
}

async function git(repoRoot: string, args: readonly string[]): Promise<string> {
  try {
    // maxBuffer default is 1MB; a 500-event `diff-tree` sweep on a large
    // repository clears that easily and would surface as a truncation rather
    // than an error, which is the quiet-wrong-answer class this whole issue is
    // about. 256MB is well past any realistic window.
    const { stdout } = await run('git', [...args], {
      cwd: repoRoot,
      maxBuffer: 256 * 1024 * 1024,
      // Force plumbing-stable output regardless of the invoking user's config.
      env: { ...process.env, GIT_CONFIG_NOSYSTEM: '1', LC_ALL: 'C' },
    });
    return stdout;
  } catch (error) {
    throw new GitInvocationError(args, error);
  }
}

export async function isGitRepository(repoRoot: string): Promise<boolean> {
  try {
    const out = await git(repoRoot, ['rev-parse', '--is-inside-work-tree']);
    return out.trim() === 'true';
  } catch {
    return false;
  }
}

/**
 * REQ-006's detection. A shallow clone has history it cannot see, and the
 * events it *can* see are indistinguishable from a short complete history.
 */
export async function isShallowRepository(repoRoot: string): Promise<boolean> {
  const out = await git(repoRoot, ['rev-parse', '--is-shallow-repository']);
  return out.trim() === 'true';
}

/**
 * REQ-002. The empty tree object, asked of git rather than hardcoded.
 *
 * The well-known literal is SHA-1 specific. On a SHA-256 repository it is not a
 * valid object, and the failure is silent in the worst way: the root commit's
 * diff either errors or comes back empty, so the first commit's file set
 * vanishes from the event stream and every pair it contributed to loses
 * exactly one unit of support. That is not hypothetical here — the Phase 0
 * audit measured it as the difference between support 5 and 6 on the billfold
 * thesis pair.
 *
 * `hash-object -t tree /dev/null` returns whatever the repository's object
 * format says the empty tree is, which is the only correct answer.
 */
export async function emptyTreeObject(repoRoot: string): Promise<string> {
  const out = await git(repoRoot, ['hash-object', '-t', 'tree', '/dev/null']);
  const hash = out.trim();
  if (!/^[0-9a-f]{40,64}$/.test(hash)) {
    throw new GitOutputError(`empty-tree hash is not a valid object id: ${JSON.stringify(hash)}`);
  }
  return hash;
}

/**
 * Resolve a revision to a commit object id, or `undefined` if it names no
 * commit.
 *
 * Returns rather than throws because "this revision does not resolve" is an
 * ordinary condition — an empty repository has no `HEAD` — and it maps to
 * REQ-005 state 1, not state 4. Throwing here would force the caller to guess
 * from an exception whether the history is absent or the evidence is broken,
 * which is exactly the collapse REQ-005 forbids.
 */
export async function resolveCommit(
  repoRoot: string,
  revision: string,
): Promise<string | undefined> {
  try {
    const out = await git(repoRoot, ['rev-parse', '--verify', '--quiet', `${revision}^{commit}`]);
    const commit = out.trim();
    return commit.length > 0 ? commit : undefined;
  } catch {
    return undefined;
  }
}

/** First-parent transitions reachable from a commit. */
export async function countFirstParent(repoRoot: string, commit: string): Promise<number> {
  const out = await git(repoRoot, ['rev-list', '--first-parent', '--count', commit]);
  const count = Number.parseInt(out.trim(), 10);
  if (!Number.isInteger(count) || count < 0) {
    throw new GitOutputError(`rev-list --count returned ${JSON.stringify(out.trim())}`);
  }
  return count;
}

/** A commit's parent, or the empty tree when it has none. */
async function firstParentOrEmptyTree(
  repoRoot: string,
  commit: string,
  emptyTree: string,
): Promise<string> {
  try {
    const out = await git(repoRoot, ['rev-parse', '--verify', '--quiet', `${commit}^`]);
    const parent = out.trim();
    if (parent.length > 0) return parent;
  } catch {
    // `rev-parse --verify --quiet` exits non-zero for a root commit. That is
    // the expected path, not an error.
  }
  return emptyTree;
}

/** One first-parent transition and the paths it touched. */
export interface CommitEvent {
  /** Full object id of the child commit. */
  commit: string;
  /** Parent, or the empty tree for the root commit. */
  parent: string;
  /**
   * Distinct normalized paths touched, sorted. For a rename, both the old and
   * new path appear — the transition touched both, and dropping either would
   * lose the coupling the rename represents.
   */
  files: readonly string[];
  /** `files.length`. Named because v2.2.1's weighting and exclusion key on it. */
  fileCount: number;
  /**
   * Position in the extracted sequence, 0 for the oldest. v2.2.1's
   * `position_decay` is defined over this. Phase 1 records it and does not use
   * it — scoring is Phase 3.
   */
  position: number;
}

export interface ExtractionOptions {
  /** Revision whose first-parent history is walked. */
  basisRevision: string;
  /** v2.2.1: 500 first-parent transitions. */
  windowTransitions: number;
}

/**
 * REQ-001. Extract first-parent events per v2.2.1's frozen parameters.
 *
 * Two commands, quoted from the preregistration:
 *
 *   git rev-list --first-parent --reverse <basisRevision>
 *   git -c diff.renamelimit=5000 diff-tree -r --name-status -z --no-commit-id -M50% <parent> <commit>
 *
 * `--reverse` makes position 0 the oldest commit, so the window is taken from
 * the newest end and `position_decay` measures distance back from the basis.
 *
 * No filtering, no weighting, no scoring. Phase 1 is extraction only, and every
 * event the walk produces comes back — including events v2.2.1 will later
 * exclude for `fileCount > 50`. Discarding them here would make the exclusion
 * unobservable, and an exclusion nobody can count is not auditable.
 */
export async function extractEvents(
  repoRoot: string,
  options: ExtractionOptions,
): Promise<readonly CommitEvent[]> {
  const emptyTree = await emptyTreeObject(repoRoot);

  const revList = await git(repoRoot, [
    'rev-list',
    '--first-parent',
    '--reverse',
    options.basisRevision,
  ]);
  const allCommits = revList.split('\n').filter((line) => line.length > 0);

  // The window is the most recent N transitions. `--reverse` already put oldest
  // first, so that is the tail.
  const commits =
    allCommits.length > options.windowTransitions
      ? allCommits.slice(allCommits.length - options.windowTransitions)
      : allCommits;

  const events: CommitEvent[] = [];
  for (const [position, commit] of commits.entries()) {
    const parent = await firstParentOrEmptyTree(repoRoot, commit, emptyTree);
    const raw = await git(repoRoot, [
      '-c',
      'diff.renamelimit=5000',
      'diff-tree',
      '-r',
      '--name-status',
      '-z',
      '--no-commit-id',
      '-M50%',
      parent,
      commit,
    ]);
    const files = parseNameStatusZ(raw);
    events.push({ commit, parent, files, fileCount: files.length, position });
  }

  return events;
}

/**
 * Parse `--name-status -z` output.
 *
 * The format is NUL-separated and status-dependent, which is the whole reason
 * `-z` is in the frozen parameters: without it a path containing a quote,
 * newline or non-ASCII byte comes back C-quoted, and a naive line split
 * silently mangles exactly the paths the Unicode question in META-278 is about.
 *
 * Layout: a status field, then one path, except for `R` and `C` which carry a
 * similarity score on the status and are followed by two paths (source, then
 * destination). Both are emitted — a rename is a transition that touched the
 * old path and the new one.
 */
export function parseNameStatusZ(raw: string): readonly string[] {
  const fields = raw.split('\0').filter((field) => field.length > 0);
  const paths = new Set<string>();

  let index = 0;
  while (index < fields.length) {
    const status = fields[index]!;
    index += 1;

    // A status field is a letter plus an optional numeric similarity score.
    // Anything else means the stream is out of phase, and continuing would
    // read paths as statuses and statuses as paths.
    if (!/^[ACDMRTUXB][0-9]*$/.test(status)) {
      throw new GitOutputError(
        `diff-tree --name-status -z: expected a status field, got ${JSON.stringify(status)} at field ${index - 1}`,
      );
    }

    const pathCount = status.startsWith('R') || status.startsWith('C') ? 2 : 1;
    for (let taken = 0; taken < pathCount; taken += 1) {
      const path = fields[index];
      if (path === undefined) {
        throw new GitOutputError(
          `diff-tree --name-status -z: status ${status} expects ${pathCount} path(s), stream ended early`,
        );
      }
      index += 1;
      paths.add(normalizePath(path));
    }
  }

  // Default comparator, UTF-16 code unit order. Never `localeCompare`, which
  // varies with host locale and would make REQ-004's byte-identical claim
  // depend on the machine it ran on.
  return [...paths].sort();
}
