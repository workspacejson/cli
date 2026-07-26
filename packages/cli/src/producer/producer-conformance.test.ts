import { execFileSync } from 'node:child_process';
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { WorkspaceJsonValidator } from '@workspacejson/rules';
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

describe('generateWorkspaceJson — conventions emitter (META-203)', () => {
  const clean: string[] = [];

  function repo(): string {
    const path = resolve(process.cwd(), `.tmp-conv-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    clean.push(path);
    return path;
  }

  afterEach(async () => {
    await Promise.all(clean.splice(0).map((path) => rm(path, { recursive: true, force: true })));
  });

  it('emits conventions detected from AGENTS.md, shaped {raw,type,canonical}', async () => {
    const root = repo();
    await mkdir(root, { recursive: true });
    await writeFile(resolve(root, 'AGENTS.md'), [
      '# Agents', '', '## Conventions', '',
      '- Directories use kebab-case',
      '- Components use PascalCase filenames', '',
    ].join('\n'), 'utf8');

    const result = await generateWorkspaceJson(root, {}, { dryRun: true });
    const conventions = result.content.generated.conventions as Array<Record<string, unknown>>;

    expect(Array.isArray(conventions)).toBe(true);
    expect(conventions.length).toBeGreaterThan(0);
    for (const entry of conventions) {
      expect(Object.keys(entry).sort()).toEqual(['canonical', 'raw', 'type']);
    }
  });

  it('orders conventions deterministically, so the drift gate stays usable', async () => {
    const root = repo();
    await mkdir(root, { recursive: true });
    await writeFile(resolve(root, 'AGENTS.md'), [
      '# Agents', '', '## Conventions', '',
      '- Directories use kebab-case',
      '- Components use PascalCase filenames',
      '- Test files use the *.test.ts suffix', '',
    ].join('\n'), 'utf8');

    // `conventions` is INSIDE the material projection and `stable()` preserves
    // array order, so unstable ordering would make every run report drift.
    const first = await generateWorkspaceJson(root, {}, { dryRun: true });
    const second = await generateWorkspaceJson(root, {}, { dryRun: true });

    expect(JSON.stringify(first.content.generated.conventions))
      .toBe(JSON.stringify(second.content.generated.conventions));
  });

  it('does not emit coChange or fragility — optional in v0.4 and not implemented here', async () => {
    const root = repo();
    await mkdir(root, { recursive: true });

    const result = await generateWorkspaceJson(root, {}, { dryRun: true });

    expect(result.content.generated.coChange).toBeUndefined();
    expect(result.content.generated.fragility).toBeUndefined();
  });
});

describe('generateWorkspaceJson — fileIndex and frameworkManifest (META-195)', () => {
  const clean: string[] = [];

  /**
   * A real git repository with tracked files. `RepoScanner` reads the inventory
   * via `git ls-files`, so a plain directory yields an empty one — these cases
   * are about what lands once there is actually something to index.
   */
  async function trackedRepo(files: Record<string, string>): Promise<string> {
    const root = resolve(process.cwd(), `.tmp-idx-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    clean.push(root);
    await mkdir(root, { recursive: true });
    for (const [path, content] of Object.entries(files)) {
      await mkdir(dirname(resolve(root, path)), { recursive: true });
      await writeFile(resolve(root, path), content, 'utf8');
    }
    // `stdio: 'pipe'` captures rather than prints, so this stays quiet. It is
    // also the only value `types/ambient.d.ts` declares for `node:child_process`
    // — the same shadowing of Node builtins OWNERSHIP.md flags as a follow-up.
    const git = (...args: string[]): void => {
      execFileSync('git', args, { cwd: root, stdio: 'pipe' });
    };
    git('init', '-q');
    git('config', 'user.email', 'test@example.com');
    git('config', 'user.name', 'Test');
    git('add', '-A');
    git('commit', '-qm', 'fixture');
    return root;
  }

  afterEach(async () => {
    await Promise.all(clean.splice(0).map((path) => rm(path, { recursive: true, force: true })));
  });

  it('indexes every tracked file by repository-root-relative POSIX path', async () => {
    const root = await trackedRepo({
      'src/a.ts': 'export const a = 1;\n',
      'src/nested/b.ts': 'export const b = 2;\n',
      'README.md': '# fixture\n',
    });

    const result = await generateWorkspaceJson(root, {}, { dryRun: true });
    const fileIndex = result.content.generated.fileIndex as Record<string, unknown>;

    expect(Object.keys(fileIndex)).toEqual(['README.md', 'src/a.ts', 'src/nested/b.ts']);
  });

  it('no longer emits an empty fileIndex, which is why downstream joins returned zero rows', async () => {
    const root = await trackedRepo({ 'models/customers.sql': 'select 1\n' });

    const result = await generateWorkspaceJson(root, {}, { dryRun: true });
    const fileIndex = result.content.generated.fileIndex as Record<string, unknown>;

    // The consumer adapter extracted under META-248 joined by key presence
    // alone — `hasOwnProperty`, never a value. An empty index made every such
    // join silently return 0/N.
    expect(Object.prototype.hasOwnProperty.call(fileIndex, 'models/customers.sql')).toBe(true);
  });

  it('emits only frameworks a declared dependency corroborates', async () => {
    const root = await trackedRepo({
      'package.json': JSON.stringify({ name: 'f', dependencies: { react: '18.0.0' } }, null, 2),
      'AGENTS.md': '# Agents\n\nBuilt with react. We also considered vue.\n',
    });

    const result = await generateWorkspaceJson(root, {}, { dryRun: true });
    const manifest = result.content.generated.frameworkManifest as Array<{ name: string; confidence: number }>;

    expect(manifest.map((e) => e.name)).toEqual(['react']);
    // Every pre-META-195 entry was a bare token at 0.5 — under the floor the
    // schema documents ("Detected frameworks (confidence >= 0.7)"), so a
    // consumer filtering at the threshold saw nothing.
    for (const entry of manifest) expect(entry.confidence).toBeGreaterThanOrEqual(0.7);
  });

  it('stays materially unchanged across runs, so generate --check survives as a CI gate', async () => {
    const root = await trackedRepo({
      'package.json': JSON.stringify({ name: 'f', dependencies: { react: '18.0.0' } }, null, 2),
      'AGENTS.md': '# Agents\n\nBuilt with react.\n',
      'src/a.ts': 'export const a = 1;\n',
      'src/b.ts': 'export const b = 2;\n',
    });

    await generateWorkspaceJson(root);
    const second = await generateWorkspaceJson(root);

    // The whole point of the determinism constraint: both fields sit inside the
    // material projection, so any churn here rewrites the artifact every run.
    expect(second.skipped).toBe(true);
    expect(second.drift).toBe(false);
    expect(second.written).toBe(false);
  });

  it('emits byte-identical fields on repeated generation of an unchanged repository', async () => {
    const root = await trackedRepo({ 'src/a.ts': 'export const a = 1;\n' });

    const first = await generateWorkspaceJson(root, {}, { dryRun: true });
    const later = await generateWorkspaceJson(root, {}, { dryRun: true });

    // This does NOT prove immunity to wall-clock movement — git runs in a
    // subprocess, so no in-process clock fake reaches `git log --since=30 days
    // ago`. That immunity is structural instead: neither builder is passed
    // `RepoState.gitHistory`, which is the moving 30-day window whose no-git
    // fallback is "every file". Their signatures take only `files` and
    // `(tokens, manifests)`, so there is nothing time-varying to read.
    expect(JSON.stringify(first.content.generated.fileIndex))
      .toBe(JSON.stringify(later.content.generated.fileIndex));
    expect(JSON.stringify(first.content.generated.frameworkManifest))
      .toBe(JSON.stringify(later.content.generated.frameworkManifest));
  });

  it('still validates against the published schema once populated', async () => {
    const root = await trackedRepo({
      'package.json': JSON.stringify({ name: 'f', dependencies: { react: '18.0.0' } }, null, 2),
      'AGENTS.md': '# Agents\n\nBuilt with react.\n',
      'src/a.ts': 'export const a = 1;\n',
    });

    await generateWorkspaceJson(root);
    const artifact = JSON.parse(await readFile(resolve(root, '.agents/workspace.json'), 'utf8'));

    expect(new WorkspaceJsonValidator().validate(artifact)).toEqual({ valid: true, errors: [] });
  });
});
