/**
 * A refused history refresh must not read as a completed one.
 *
 * Repo-native and validator-free: every case here drives the REFUSAL path, in
 * which no `coChange` is emitted at all, so nothing touches the observation
 * form that this workspace's published `@workspacejson/spec@0.4.4` rejects.
 * The successful-refresh side of the contract — and the fallback-to-a-preserved
 * block cases, which need an observation-form artifact already on disk — are
 * measured in `candidate-tests/`, where the amended schema is available. They
 * are not weakened to fit here.
 *
 * The defect these exist against (Greptile P1 on PR #20): mining refuses,
 * generation falls back to the previously recorded block, and the caller gets a
 * successful result carrying the PREVIOUS revision's counts with no way to tell
 * that from a refresh that ran. Falling back is correct — destroying evidence
 * over a shallow clone or a transient Git failure would be worse. Falling back
 * *quietly* is the bug.
 */
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { generateWorkspaceJson } from './generate.js';

/** A repository with NO commit graph, so an explicit refresh must refuse. */
let root: string;

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'wsj-refresh-'));
  await writeFile(join(root, 'AGENTS.md'), '# Fixture\n', 'utf8');
  await writeFile(join(root, 'package.json'), JSON.stringify({ name: 'fixture', version: '1.0.0' }), 'utf8');
  await mkdir(join(root, 'src'), { recursive: true });
  await writeFile(join(root, 'src/auth.ts'), 'export const auth = 1;\n', 'utf8');
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

describe('historyRefresh — a refused refresh is reported, not swallowed', () => {
  it('reports the refusal when mining cannot complete', async () => {
    const result = await generateWorkspaceJson(root, {}, { mineHistory: true });

    expect(result.historyRefresh).toBeDefined();
    expect(result.historyRefresh!.requested).toBe(true);
    expect(result.historyRefresh!.mined).toBe(false);
    expect(result.historyRefresh!.refusal).toBeTruthy();
  });

  it('names WHY, rather than reporting a bare failure', async () => {
    // The reason was already being computed by `mineHistoryBlock` and thrown
    // away, because the diagnostics object it accepts was never passed. A
    // caller that cannot say "shallow clone" versus "git not found" cannot act
    // on the refusal.
    const result = await generateWorkspaceJson(root, {}, { mineHistory: true });
    expect(result.historyRefresh!.refusal).toMatch(/NOT_MINED|mining failed|NO_BASIS_PIN/);
  });

  it('is ABSENT when no refresh was requested — not a false-y refusal', async () => {
    // Absence means "no refresh asked for". Reporting `mined: false` on an
    // ordinary run would say a refresh was attempted and failed, which is a
    // different and untrue claim.
    const result = await generateWorkspaceJson(root);
    expect(result.historyRefresh).toBeUndefined();
  });

  it('carries a refusal if and only if mining produced nothing', async () => {
    const refused = await generateWorkspaceJson(root, {}, { mineHistory: true });
    expect(refused.historyRefresh!.mined).toBe(false);
    expect('refusal' in refused.historyRefresh!).toBe(true);
  });
});
