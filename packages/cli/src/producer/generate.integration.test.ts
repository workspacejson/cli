import { readFile } from 'node:fs/promises';
import { mkdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { validate } from '@workspacejson/spec';
import { generateWorkspaceJson } from './generate.js';

describe('generateWorkspaceJson — v0.4 conformance', () => {
  const toClean: string[] = [];

  afterEach(async () => {
    await Promise.all(toClean.splice(0).map((d) => rm(d, { recursive: true, force: true })));
  });

  function tmpDir(): string {
    const dir = resolve(process.cwd(), `.tmp-generate-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    toClean.push(dir);
    return dir;
  }

  it('spec.validate() returns true on generated output (primary conformance gate)', async () => {
    const repoRoot = tmpDir();
    await mkdir(repoRoot, { recursive: true });

    const result = await generateWorkspaceJson(repoRoot, {}, { dryRun: true });

    expect(validate(result.content)).toBe(true);
  });

  it('produces exactly the four required top-level keys', async () => {
    const repoRoot = tmpDir();
    await mkdir(repoRoot, { recursive: true });

    const result = await generateWorkspaceJson(repoRoot, {}, { dryRun: true });

    expect(Object.keys(result.content).sort()).toEqual(['agents', 'generated', 'health', 'manual']);
  });

  it('sets generated.specVersion to "0.4"', async () => {
    const repoRoot = tmpDir();
    await mkdir(repoRoot, { recursive: true });

    const result = await generateWorkspaceJson(repoRoot, {}, { dryRun: true });

    // META-203: the producer emitted '0.3' from a3fa85a until the conventions
    // emitter was rewired. v0.4 is a strict superset of v0.3, so this is an
    // additive profile bump, not a breaking one.
    expect(result.content.generated.specVersion).toBe('0.4');
  });

  it('sets generated.by to this producer by default', async () => {
    const repoRoot = tmpDir();
    await mkdir(repoRoot, { recursive: true });

    const result = await generateWorkspaceJson(repoRoot, {}, { dryRun: true });

    // Before META-247 this asserted 'agents-audit', because the producer lived
    // inside that package. `generated.by` is provenance — it records which
    // producer actually ran — so the neutral producer stamps itself.
    //
    // The cast is an upstream type defect, not a shortcut. Published
    // `WorkspaceJsonV4['generated']` is `Omit<V3['generated'],'specVersion'> & {...}`,
    // and because V3's generated block carries `[key: string]: unknown`, `Omit`
    // collapses every named property into the index signature. So `by`,
    // `frameworkManifest` and `fileIndex` are all `unknown` on V4 even though
    // they are typed on V3. Reported to workspacejson/standard (META-203).
    const by = result.content.generated.by as { name: string; version: string };
    expect(by.name).toBe('@workspacejson/cli');
    expect(typeof by.version).toBe('string');
    expect(by.version.length).toBeGreaterThan(0);
  });

  it('lets a caller override generated.by, which is how agents-audit keeps its historical stamp', async () => {
    const repoRoot = tmpDir();
    await mkdir(repoRoot, { recursive: true });

    const result = await generateWorkspaceJson(repoRoot, {}, {
      dryRun: true,
      producer: { name: 'agents-audit', version: '0.4.4' },
    });

    // This is the exact call `agents-audit generate` makes. Its artifacts must
    // remain byte-identical to what it produced before the producer moved.
    expect(result.content.generated.by).toEqual({ name: 'agents-audit', version: '0.4.4' });
  });

  it('sets generated.frameworkManifest as an array', async () => {
    const repoRoot = tmpDir();
    await mkdir(repoRoot, { recursive: true });

    const result = await generateWorkspaceJson(repoRoot, {}, { dryRun: true });

    expect(Array.isArray(result.content.generated.frameworkManifest)).toBe(true);
  });

  it('sets generated.fileIndex as an object', async () => {
    const repoRoot = tmpDir();
    await mkdir(repoRoot, { recursive: true });

    const result = await generateWorkspaceJson(repoRoot, {}, { dryRun: true });

    expect(typeof result.content.generated.fileIndex).toBe('object');
    expect(result.content.generated.fileIndex).not.toBeNull();
  });

  it('sets health.intelligenceState to INSUFFICIENT_DATA on first run', async () => {
    const repoRoot = tmpDir();
    await mkdir(repoRoot, { recursive: true });

    const result = await generateWorkspaceJson(repoRoot, {}, { dryRun: true });

    expect(result.content.health.intelligenceState).toBe('INSUFFICIENT_DATA');
  });

  it('creates .agents/ directory and writes a valid file on non-dry-run', async () => {
    const repoRoot = tmpDir();
    await mkdir(repoRoot, { recursive: true });

    const result = await generateWorkspaceJson(repoRoot, {}, { dryRun: false });

    expect(result.written).toBe(true);
    expect(result.path).toMatch(/\.agents[/\\]workspace\.json$/);

    const written = JSON.parse(await readFile(result.path, 'utf8')) as unknown;
    expect(validate(written)).toBe(true);
  });

  it('does not throw on a fresh repo without AGENTS.md', async () => {
    const repoRoot = tmpDir();
    await mkdir(repoRoot, { recursive: true });

    await expect(generateWorkspaceJson(repoRoot, {}, { dryRun: true })).resolves.toBeDefined();
  });
});
