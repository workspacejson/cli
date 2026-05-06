import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = resolve(process.cwd(), '..', '..');

function readPackageJson(relativePath: string): Record<string, unknown> {
  return JSON.parse(readFileSync(resolve(repoRoot, relativePath), 'utf8')) as Record<string, unknown>;
}

describe('package metadata', () => {
  it('keeps the spec package mature and discoverable', () => {
    const pkg = readPackageJson('packages/spec/package.json');
    expect(pkg.name).toBe('@workspacejson/spec');
    expect(pkg.version).toBe('0.1.1');
    expect((pkg.repository as { directory?: string } | undefined)?.directory).toBe('packages/spec');
    expect((pkg.publishConfig as { access?: string } | undefined)?.access).toBe('public');
    const keywords = pkg.keywords as string[];
    expect(keywords.includes('json-schema')).toBe(true);
    expect(keywords.includes('workspace-json')).toBe(true);
    expect(keywords.includes('ai-agents')).toBe(true);
    expect(keywords.includes('specification')).toBe(true);
    expect(keywords.includes('aaif')).toBe(true);
    const files = pkg.files as string[];
    expect(files.includes('dist')).toBe(true);
    expect(files.includes('schema')).toBe(true);
    expect(files.includes('README.md')).toBe(true);
    expect(files.includes('LICENSE')).toBe(true);
  });

  it('keeps the rules package mature and discoverable', () => {
    const pkg = readPackageJson('packages/rules/package.json');
    expect(pkg.name).toBe('@workspacejson/rules');
    expect(pkg.version).toBe('0.1.1');
    expect((pkg.repository as { directory?: string } | undefined)?.directory).toBe('packages/rules');
    expect((pkg.publishConfig as { access?: string } | undefined)?.access).toBe('public');
    const keywords = pkg.keywords as string[];
    expect(keywords.includes('agents-audit')).toBe(true);
    expect(keywords.includes('workspace-json')).toBe(true);
    expect(keywords.includes('rule-engine')).toBe(true);
    expect(keywords.includes('AGENTS.md')).toBe(true);
    expect(keywords.includes('ai-agents')).toBe(true);
    expect(keywords.includes('developer-tools')).toBe(true);
    const files = pkg.files as string[];
    expect(files.includes('dist')).toBe(true);
    expect(files.includes('README.md')).toBe(true);
    expect(files.includes('LICENSE')).toBe(true);
  });

  it('keeps the CLI package mature and executable', () => {
    const pkg = readPackageJson('packages/agents-audit/package.json');
    expect(pkg.name).toBe('agents-audit');
    expect(pkg.version).toBe('0.1.1');
    expect((pkg.bin as { [key: string]: string } | undefined)?.['agents-audit']).toBe('./dist/cli.js');
    expect((pkg.publishConfig as { access?: string } | undefined)?.access).toBe('public');
    const keywords = pkg.keywords as string[];
    expect(keywords.includes('workspace-json')).toBe(true);
    expect(keywords.includes('ai-agents')).toBe(true);
    expect(keywords.includes('audit')).toBe(true);
    expect(keywords.includes('lint')).toBe(true);
    expect(keywords.includes('cli')).toBe(true);
    expect(keywords.includes('developer-tools')).toBe(true);
    const files = pkg.files as string[];
    expect(files.includes('dist')).toBe(true);
    expect(files.includes('README.md')).toBe(true);
    expect(files.includes('LICENSE')).toBe(true);
  });
});
