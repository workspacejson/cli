import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { GenerateRefusalError, generateWorkspaceJson, writeWorkspaceAtomically } from './generate.js';

describe('generateWorkspaceJson producer conformance', () => {
  const clean: string[] = [];

  function repo(): string {
    const path = resolve(process.cwd(), `.tmp-producer-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    clean.push(path);
    return path;
  }

  async function generated(root: string): Promise<string> {
    await mkdir(root, { recursive: true });
    return (await generateWorkspaceJson(root)).path;
  }

  async function read(path: string): Promise<Record<string, any>> {
    return JSON.parse(await readFile(path, 'utf8')) as Record<string, any>;
  }

  afterEach(async () => {
    await Promise.all(clean.splice(0).map((path) => rm(path, { recursive: true, force: true })));
  });

  it('preserves manual evidence across regeneration', async () => {
    const path = await generated(repo());
    const artifact = await read(path);
    artifact.manual.fragileFiles = [{ path: 'src/a.ts', reason: 'keep' }];
    await writeFile(path, JSON.stringify(artifact, null, 2) + '\n', 'utf8');

    await generateWorkspaceJson(resolve(path, '..', '..'));

    expect((await read(path)).manual.fragileFiles).toEqual([{ path: 'src/a.ts', reason: 'keep' }]);
  });

  it('replaces producer-owned agents and health sections', async () => {
    const path = await generated(repo());
    const artifact = await read(path);
    artifact.agents = { staleConsumerState: true };
    artifact.health = { intelligenceState: 'CONFIDENT', observationCount: 99, confidence: 1 };
    await writeFile(path, JSON.stringify(artifact, null, 2) + '\n', 'utf8');

    await generateWorkspaceJson(resolve(path, '..', '..'));

    const refreshed = await read(path);
    expect(refreshed.agents).toEqual({});
    expect(refreshed.health).toEqual({ intelligenceState: 'INSUFFICIENT_DATA', observationCount: 0, confidence: 0 });
  });

  it('refuses invalid input without force and leaves it untouched', async () => {
    const root = repo();
    const path = resolve(root, '.agents/workspace.json');
    await mkdir(resolve(root, '.agents'), { recursive: true });
    await writeFile(path, '{ not json\n', 'utf8');

    await expect(generateWorkspaceJson(root)).rejects.toBeInstanceOf(GenerateRefusalError);
    expect(await readFile(path, 'utf8')).toBe('{ not json\n');
  });

  it('refuses schema-invalid JSON without force and leaves it untouched', async () => {
    const root = repo();
    const path = resolve(root, '.agents/workspace.json');
    const invalid = JSON.stringify({ manual: {} }, null, 2) + '\n';
    await mkdir(resolve(root, '.agents'), { recursive: true });
    await writeFile(path, invalid, 'utf8');

    await expect(generateWorkspaceJson(root)).rejects.toBeInstanceOf(GenerateRefusalError);
    expect(await readFile(path, 'utf8')).toBe(invalid);
  });

  it('moves invalid input aside only with force before writing fresh output', async () => {
    const root = repo();
    const path = resolve(root, '.agents/workspace.json');
    await mkdir(resolve(root, '.agents'), { recursive: true });
    await writeFile(path, '{ not json\n', 'utf8');

    const result = await generateWorkspaceJson(root, {}, { force: true });

    expect(result.invalidFileMoved).toMatch(/workspace\.json\.invalid\./);
    expect(await readFile(result.invalidFileMoved!, 'utf8')).toBe('{ not json\n');
    expect((await read(path)).manual).toEqual({});
  });

  it('skips an identical second generation and preserves generatedAt', async () => {
    const root = repo();
    const path = await generated(root);
    const first = await read(path);

    const second = await generateWorkspaceJson(root);

    expect(second).toMatchObject({ written: false, skipped: true, drift: false });
    expect((await read(path)).generated.generatedAt).toBe(first.generated.generatedAt);
  });

  it('treats a by.version-only change as a no-op', async () => {
    const root = repo();
    const path = await generated(root);
    const artifact = await read(path);
    artifact.generated.by.version = '0.0.0-test';
    await writeFile(path, JSON.stringify(artifact, null, 2) + '\n', 'utf8');

    const result = await generateWorkspaceJson(root);

    expect(result).toMatchObject({ written: false, skipped: true, drift: false });
    expect((await read(path)).generated.by.version).toBe('0.0.0-test');
  });

  it('checks current, stale, and missing artifacts without writing', async () => {
    const root = repo();
    const path = await generated(root);
    const current = await generateWorkspaceJson(root, {}, { check: true });
    expect(current).toMatchObject({ written: false, skipped: true, drift: false });

    const stale = await read(path);
    stale.generated.fileIndex = { 'src/a.ts': { fragility: 1 } };
    await writeFile(path, JSON.stringify(stale, null, 2) + '\n', 'utf8');
    const beforeCheck = await readFile(path, 'utf8');
    expect(await generateWorkspaceJson(root, {}, { check: true })).toMatchObject({ written: false, drift: true });
    expect(await readFile(path, 'utf8')).toBe(beforeCheck);

    const missingRoot = repo();
    await mkdir(missingRoot, { recursive: true });
    expect(await generateWorkspaceJson(missingRoot, {}, { check: true })).toMatchObject({ written: false, drift: true });
  });

  it('does not let dry-run or check move an invalid file even with force', async () => {
    const root = repo();
    const path = resolve(root, '.agents/workspace.json');
    await mkdir(resolve(root, '.agents'), { recursive: true });
    await writeFile(path, '{ not json\n', 'utf8');

    await expect(generateWorkspaceJson(root, {}, { dryRun: true, force: true })).rejects.toBeInstanceOf(GenerateRefusalError);
    await expect(generateWorkspaceJson(root, {}, { check: true, force: true })).rejects.toThrow('manual evidence is untouched');
    expect(await readFile(path, 'utf8')).toBe('{ not json\n');
  });

  it('treats key order alone as non-material', async () => {
    const root = repo();
    const path = await generated(root);
    const artifact = await read(path);
    artifact.generated.topology = {
      ciProvider: artifact.generated.topology.ciProvider,
      type: artifact.generated.topology.type,
      packageCount: artifact.generated.topology.packageCount,
      agentFiles: artifact.generated.topology.agentFiles,
    };
    await writeFile(path, JSON.stringify(artifact, null, 2) + '\n', 'utf8');

    expect(await generateWorkspaceJson(root)).toMatchObject({ written: false, skipped: true, drift: false });
  });

  it('cleans the sibling temporary file when an atomic replacement fails', async () => {
    const root = repo();
    const directory = resolve(root, '.agents');
    const path = resolve(directory, 'workspace.json');
    await mkdir(root, { recursive: true });
    const content = (await generateWorkspaceJson(root, {}, { dryRun: true })).content;
    await mkdir(path, { recursive: true });

    await expect(writeWorkspaceAtomically(path, content)).rejects.toBeDefined();
    expect((await readdir(directory)).filter((entry) => String(entry).endsWith('.workspace.json.tmp'))).toEqual([]);
  });
});
