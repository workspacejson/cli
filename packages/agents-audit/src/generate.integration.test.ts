import { readFile } from 'node:fs/promises';
import { mkdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { validate } from '@workspacejson/spec';
import { generateWorkspaceJson } from './generate.js';

describe('generateWorkspaceJson — v0.3 conformance', () => {
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

  it('sets generated.specVersion to "0.3"', async () => {
    const repoRoot = tmpDir();
    await mkdir(repoRoot, { recursive: true });

    const result = await generateWorkspaceJson(repoRoot, {}, { dryRun: true });

    expect(result.content.generated.specVersion).toBe('0.3');
  });

  it('sets generated.by with name and version', async () => {
    const repoRoot = tmpDir();
    await mkdir(repoRoot, { recursive: true });

    const result = await generateWorkspaceJson(repoRoot, {}, { dryRun: true });

    expect(result.content.generated.by.name).toBe('agents-audit');
    expect(typeof result.content.generated.by.version).toBe('string');
    expect(result.content.generated.by.version.length).toBeGreaterThan(0);
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
