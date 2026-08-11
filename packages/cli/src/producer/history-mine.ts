/**
 * The explicit, opt-in commit-history pass.
 *
 * This is the only code path in the producer that reads the commit graph, and
 * it runs only when a caller asks for it. Everything else in `generate` reads
 * the working tree. That split is the whole reason `generated.coChange` is
 * carried forward rather than rebuilt — see history-carry-forward.ts.
 *
 * The pipeline is `mine → score → select → project`, each stage pure with
 * respect to the one before it, so the extracted events and the uncapped scored
 * set stay auditable behind whatever the selection capped.
 *
 * **A refusal returns `undefined`, and that is not the same as an empty
 * result.** A shallow clone, an absent history or a Git failure produce nothing
 * here, and the caller falls back to whatever the previous artifact recorded.
 * Writing an empty `coChange` in those cases would be the worst available
 * outcome: under A-009 a *pinned* empty array is a positive finding — "the
 * analysis ran at this revision and found no qualifying pairs" — so emitting
 * one for a repository that could not be analyzed would state a result nobody
 * measured.
 */
import { mine, project, score, select } from '@workspacejson/mining-core';
import type { ProjectedHistory } from '@workspacejson/mining-core';

/**
 * Mine, score, select and project. Returns `undefined` when the repository
 * cannot honestly produce a block.
 *
 * Errors are not swallowed silently — they are converted into the same absence
 * a shallow clone produces, and the reason is surfaced on the returned
 * diagnostics rather than discarded.
 */
export async function mineHistoryBlock(
  repoRoot: string,
  diagnostics: { refusal?: string } = {},
): Promise<ProjectedHistory | undefined> {
  let projected;
  try {
    projected = project(select(score(await mine(repoRoot))));
  } catch (error) {
    // A Git invocation that fails is an absence of evidence, never a zero. The
    // message is kept so a caller can report *why* nothing was mined instead of
    // reporting that nothing was found.
    diagnostics.refusal = `mining failed: ${error instanceof Error ? error.message : String(error)}`;
    return undefined;
  }

  if (!projected.projected) {
    diagnostics.refusal = `${projected.refusal}: ${projected.detail}`;
    return undefined;
  }

  return projected.history;
}
