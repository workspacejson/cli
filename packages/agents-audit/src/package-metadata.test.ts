import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

// Migration note (META-240): in the agents-audit monorepo this suite also
// asserted the metadata of `packages/spec` and `packages/rules`, deriving the
// shared release version from the spec package. Those packages are owned and
// published by `workspacejson/standard`, so this repository neither ships them
// nor has standing to assert their metadata — and those paths no longer exist
// here. Their assertions move with them (META-239). What remains is exactly the
// packages this repository owns.
const repoRoot = resolve(process.cwd(), '..', '..');

function readPackageJson(relativePath: string): Record<string, unknown> {
  return JSON.parse(readFileSync(resolve(repoRoot, relativePath), 'utf8')) as Record<string, unknown>;
}

describe('package metadata', () => {
  it('keeps the CLI package mature and executable', () => {
    const pkg = readPackageJson('packages/agents-audit/package.json');
    expect(pkg.name).toBe('agents-audit');
    expect((pkg.bin as { [key: string]: string } | undefined)?.['agents-audit']).toBe('./dist/cli.js');
    expect((pkg.publishConfig as { access?: string } | undefined)?.access).toBe('public');
    const keywords = pkg.keywords as string[];
    expect(keywords.includes('workspace.json')).toBe(true);
    expect(keywords.includes('ai-agents')).toBe(true);
    expect(keywords.includes('ai-coding-agents')).toBe(true);
    expect(keywords.includes('codebase-intelligence')).toBe(true);
    expect(keywords.includes('audit')).toBe(true);
    expect(keywords.includes('lint')).toBe(true);
    expect(keywords.includes('cli')).toBe(true);
    const files = pkg.files as string[];
    expect(files.includes('dist')).toBe(true);
    expect(files.includes('README.md')).toBe(true);
    expect(files.includes('LICENSE')).toBe(true);
  });

  it('points package metadata at the new owning repository', () => {
    const pkg = readPackageJson('packages/agents-audit/package.json');
    const repository = pkg.repository as { url?: string } | undefined;
    expect(repository?.url).toBe('git+https://github.com/workspacejson/cli.git');
    expect((pkg.bugs as { url?: string } | undefined)?.url).toBe('https://github.com/workspacejson/cli/issues');
  });

  it('pins standard-owned dependencies to exact published versions', () => {
    const pkg = readPackageJson('packages/agents-audit/package.json');
    const dependencies = pkg.dependencies as Record<string, string>;
    for (const name of ['@workspacejson/spec', '@workspacejson/rules']) {
      const range = dependencies[name];
      expect(range).toBeDefined();
      // Not `workspace:*`, not a floating range — after the split these resolve
      // from the registry exactly the way they do for any consumer.
      expect(/^\d+\.\d+\.\d+(?:-[0-9A-Za-z-.]+)?$/.test(range as string)).toBe(true);
    }
  });

  it('keeps the DataHub shim private and separate from the producer', () => {
    const pkg = readPackageJson('packages/cli/package.json');
    // The two CLI packages must not converge during migration. META-236 owns
    // any future decision about this package's identity; until then it is a
    // private dbt/DataHub adapter and must never be published.
    expect(pkg.name).toBe('@workspacejson/cli');
    expect(pkg.private).toBe(true);
    expect((pkg.bin as { [key: string]: string } | undefined)?.workspacejson).toBe('./dist/cli.js');
  });
});
