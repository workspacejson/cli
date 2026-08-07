/** REQ-003 — one normalizer, and its assumptions are recorded rather than silent. */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  PATH_NORMALIZATION_ASSUMPTIONS,
  UNRATIFIED_ASSUMPTION_COUNT,
  normalizePath,
} from './paths.js';

const srcDir = dirname(fileURLToPath(import.meta.url));

function sourceFiles(): string[] {
  const found: string[] = [];
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (full.endsWith('.ts')) found.push(full);
    }
  };
  walk(srcDir);
  return found;
}

describe('normalizePath', () => {
  it('rewrites backslash separators', () => {
    expect(normalizePath('src\\routes\\checkout.ts')).toBe('src/routes/checkout.ts');
  });

  it('strips a leading "./", including repeated prefixes', () => {
    expect(normalizePath('./src/a.ts')).toBe('src/a.ts');
    expect(normalizePath('././src/a.ts')).toBe('src/a.ts');
  });

  it('strips a trailing slash but never empties a path', () => {
    expect(normalizePath('src/')).toBe('src');
    expect(normalizePath('/')).toBe('/');
  });

  it('preserves case — the assumption record says so, so the test says so', () => {
    expect(normalizePath('src/Foo.ts')).toBe('src/Foo.ts');
    expect(normalizePath('src/Foo.ts')).not.toBe(normalizePath('src/foo.ts'));
  });

  it('applies no Unicode normalization, so NFC and NFD stay distinct', () => {
    const nfc = 'src/café.ts'; // é as one code point
    const nfd = 'src/café.ts'; // e + combining acute
    expect(normalizePath(nfc)).toBe(nfc);
    expect(normalizePath(nfd)).toBe(nfd);
    expect(normalizePath(nfc)).not.toBe(normalizePath(nfd));
  });

  it('is idempotent', () => {
    for (const input of ['./a\\b/', 'src/a.ts', './/x', 'src/Foo.ts']) {
      expect(normalizePath(normalizePath(input))).toBe(normalizePath(input));
    }
  });
});

describe('assumption record (REQ-003 amendment)', () => {
  it('covers all six META-278 questions', () => {
    expect(PATH_NORMALIZATION_ASSUMPTIONS).toHaveLength(6);
  });

  it('records four of them as assumed rather than ratified', () => {
    // The Phase 0 audit found the prior art answers 2 of 6. If a future change
    // silently promotes one of the remaining 4 to `ratified` without META-278
    // actually ruling, this count moves and the test says so.
    expect(UNRATIFIED_ASSUMPTION_COUNT).toBe(4);
  });

  it('gives every assumption a behavior and a rationale', () => {
    for (const assumption of PATH_NORMALIZATION_ASSUMPTIONS) {
      expect(assumption.question.length).toBeGreaterThan(0);
      expect(assumption.behavior.length).toBeGreaterThan(0);
      expect(assumption.rationale.length).toBeGreaterThan(0);
    }
  });
});

describe('single-definition guarantee (REQ-003 verify)', () => {
  it('defines normalizePath exactly once across the package', () => {
    // Assembled rather than written as a literal, so this assertion does not
    // match its own source and report a second definition that does not exist.
    const definition = new RegExp(['export', 'function', 'normalizePath\\b'].join(' '));
    const definitions = sourceFiles().filter((file) =>
      definition.test(readFileSync(file, 'utf8')),
    );
    expect(definitions.map((f) => f.slice(srcDir.length + 1))).toEqual(['paths.ts']);
  });

  it('has no inline separator replacement outside the normalizer', () => {
    // The literal `.replace(/\\/g, '/')` and its equivalents are the shape a
    // second, quieter normalizer takes. Anywhere but paths.ts is a violation.
    const offenders: string[] = [];
    for (const file of sourceFiles()) {
      if (file.endsWith('paths.ts') || file.endsWith('paths.test.ts')) continue;
      const source = readFileSync(file, 'utf8');
      if (/replace\(\s*\/\\\\\/g/.test(source) || /split\(\s*['"`]\\\\['"`]\s*\)/.test(source)) {
        offenders.push(file.slice(srcDir.length + 1));
      }
    }
    expect(offenders).toEqual([]);
  });
});
