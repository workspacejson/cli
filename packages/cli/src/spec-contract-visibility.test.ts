import { describe, expect, it } from 'vitest';
import { validate, validateStoredKey, validateV4, version } from '@workspacejson/spec';
import type { CoChangeEntry, FragilityEntry, StoredKeyResult, WorkspaceJsonV4 } from '@workspacejson/spec';

/**
 * META-244 regression guard: the CLI compiles against the REAL published
 * `@workspacejson/spec` declarations, not a local copy of them.
 *
 * `types/ambient.d.ts` used to carry a handwritten
 * `declare module '@workspacejson/spec'`. Ambient module declarations win over
 * node_modules typings, so that stub shadowed the real package — and it omitted
 * the entire v0.4 contract. Every symbol imported above exists ONLY in the real
 * published package and was absent from the stub, so **reintroducing the shadow
 * breaks this file at compile time** (TS2305 / TS2724), not at runtime.
 *
 * That is the point: this is a type-visibility test whose primary assertion is
 * that it compiles at all. The runtime expectations below keep it honest under
 * a test runner that strips types.
 */
describe('@workspacejson/spec contract visibility', () => {
  it('exposes the published version as a value, not a local guess', () => {
    // Pins which contract we compiled against. This assertion alone no longer
    // distinguishes the real package from the removed stub: the stub declared
    // `version: string`, and as of 0.5.0 so does the real package, because the
    // literal was replaced by a value read at build time. The discriminator
    // moved to the stored-key surface below — see that test for why.
    expect(version).toBe('0.5.0');
  });

  it('exposes the stored-key surface, which no stub ever declared', () => {
    // This is the load-bearing half of the META-244 guard after 0.5.0.
    //
    // The guard works by importing symbols that exist ONLY in the real
    // published package, so reintroducing a handwritten
    // `declare module '@workspacejson/spec'` fails at COMPILE time (TS2305 /
    // TS2724) rather than silently shadowing the real typings. `version` used
    // to carry that weight via its literal type; 0.5.0 widened it to `string`,
    // which is exactly what the stub declared, so it can no longer tell them
    // apart.
    //
    // `validateStoredKey` and `StoredKeyResult` are new in 0.5.0 and were never
    // present in the stub, so they restore the compile-time property the
    // literal used to provide.
    const accepted: StoredKeyResult = validateStoredKey('src/a.ts');
    expect(accepted.valid).toBe(true);
  });

  it('exposes validateV4, which the removed ambient stub did not declare', () => {
    expect(validateV4).toBeTypeOf('function');
  });

  it('accepts a v0.4 artifact through the published validators', () => {
    // Under the removed stub, `validate` was typed `data is WorkspaceJsonV3`
    // only. The real declaration is `data is WorkspaceJsonV3 | WorkspaceJsonV4`,
    // so a v0.4 artifact is a first-class member of the contract here.
    const artifact: WorkspaceJsonV4 = {
      manual: {},
      generated: {
        specVersion: '0.4',
        generatedAt: '2026-07-26T00:00:00.000Z',
        by: { name: 'agents-audit', version: '0.4.4' },
        frameworkManifest: [],
        fileIndex: {},
        coChange: [],
        fragility: [],
      },
      agents: {},
      health: { intelligenceState: 'INSUFFICIENT_DATA', observationCount: 0, confidence: 0 },
    };

    expect(artifact.generated.specVersion).toBe('0.4');
    expect(validate(artifact)).toBe(true);
    expect(validateV4(artifact)).toBe(true);
  });

  it('exposes the v0.4 evidence entry types', () => {
    // CoChangeEntry and FragilityEntry exist only in the real package. Their
    // shapes are asserted structurally so a silent contract change is visible
    // here rather than discovered during META-195 producer work.
    const coChange: CoChangeEntry = {
      files: ['src/a.ts', 'src/b.ts'],
      rate: 0.5,
      occurrences: 2,
      generated: false,
    };
    const fragility: FragilityEntry = {
      file: 'src/a.ts',
      changeCount: 10,
      revertCount: 2,
      revertRate: 0.2,
      fragilityScore: 0.4,
      excluded: false,
    };

    // Set semantics: exactly two entries, order not meaningful.
    expect(coChange.files).toHaveLength(2);
    expect(fragility.revertRate).toBeCloseTo(fragility.revertCount / fragility.changeCount, 5);
  });

  it('still narrows v0.3 artifacts, so the migration contract is unchanged', () => {
    // Guards against the opposite failure: consuming real types must not have
    // widened or broken v0.3 handling, which the producer emits today.
    const v3 = {
      manual: {},
      generated: {
        specVersion: '0.3',
        generatedAt: '2026-07-26T00:00:00.000Z',
        by: { name: 'agents-audit', version: '0.4.4' },
        frameworkManifest: [],
        fileIndex: {},
      },
      agents: {},
      health: { intelligenceState: 'INSUFFICIENT_DATA', observationCount: 0, confidence: 0 },
    };

    expect(validate(v3)).toBe(true);
    expect(validateV4(v3)).toBe(false);
  });
});
