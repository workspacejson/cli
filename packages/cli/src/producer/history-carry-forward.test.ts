/**
 * Carry-forward semantics — the pure decision function.
 *
 * Repo-native and validator-free by construction. This file runs inside the CLI
 * workspace against its legitimate published `@workspacejson/spec@0.4.4` and
 * `@workspacejson/rules@0.4.4` dependencies, and must keep passing there, so it
 * touches nothing that needs the amended schema. The end-to-end cases — which
 * DO need a validator that accepts the observation form — live in
 * `candidate-tests/` and run only in the packed-candidate environment.
 *
 * Every case here is written so that removing the behaviour it covers makes it
 * fail. That is the whole value: the three failure modes carry-forward exists
 * to prevent (drop, advance the pin, recompute) all produce a *plausible*
 * artifact, so nothing about the output looks wrong when they happen. Only a
 * test that knows what the previous artifact said can tell.
 */
import { describe, expect, it } from 'vitest';
import { CarryForwardRefusal, carryForwardHistory } from './history-carry-forward.js';

const BASIS = '3c9a0f14b7e25d8613af04c2e9b7d5081f6a2c3d';

const observationEntry = (over: Record<string, unknown> = {}) => ({
  files: ['src/auth.ts', 'src/session.ts'],
  support: 8,
  occurrences: 24,
  ...over,
});

/** A prior artifact carrying mined evidence, as `generate` would find on disk. */
function priorArtifact(over: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    manual: { fragileFiles: ['src/auth.ts'] },
    generated: {
      specVersion: '0.4',
      generatedAt: '2026-06-01T00:00:00Z',
      basisRevision: BASIS,
      by: { name: '@workspacejson/cli', version: '0.5.2' },
      frameworkManifest: [],
      fileIndex: {},
      coChange: [observationEntry(), observationEntry({ files: ['a.ts', 'b.ts'], support: 3, occurrences: 9 })],
      ...over,
    },
    agents: {},
    health: { intelligenceState: 'INSUFFICIENT_DATA', observationCount: 0, confidence: 0 },
  };
}

describe('carryForwardHistory — what ordinary generation preserves', () => {
  it('preserves a conforming observation block and its pin', () => {
    const result = carryForwardHistory(priorArtifact() as never);
    expect(result.preserved).toBe(true);
    if (!result.preserved) return;
    expect(result.history.basisRevision).toBe(BASIS);
    expect(result.history.coChange).toHaveLength(2);
  });

  it('passes the parsed entries THROUGH rather than rebuilding them', () => {
    // Byte-for-byte preservation is the contract. Rebuilding an entry field by
    // field would re-order its keys and change the serialized bytes even though
    // the value is structurally identical, so identity of the array elements is
    // the property that actually guarantees it.
    const prior = priorArtifact();
    const original = (prior['generated'] as Record<string, unknown>)['coChange'] as unknown[];
    const result = carryForwardHistory(prior as never);
    expect(result.preserved).toBe(true);
    if (!result.preserved) return;
    expect(result.history.coChange[0]).toBe(original[0]);
    expect(result.history.coChange[1]).toBe(original[1]);
  });

  it('preserves a PINNED EMPTY array — a positive finding, not an absence', () => {
    // "The analysis ran and found no qualifying pairs" is evidence. Dropping it
    // would silently convert it into "never analyzed".
    const result = carryForwardHistory(priorArtifact({ coChange: [] }) as never);
    expect(result.preserved).toBe(true);
  });

  it('refuses when there is no prior artifact — never invents a block', () => {
    const result = carryForwardHistory(undefined);
    expect(result.preserved).toBe(false);
    if (result.preserved) return;
    expect(result.refusal).toBe(CarryForwardRefusal.NO_PRIOR_BLOCK);
  });

  it('refuses a legacy rate entry rather than perpetuating it', () => {
    const result = carryForwardHistory(
      priorArtifact({ coChange: [{ files: ['a.ts', 'b.ts'], rate: 0.8, occurrences: 9, generated: false }] }) as never,
    );
    expect(result.preserved).toBe(false);
    if (result.preserved) return;
    expect(result.refusal).toBe(CarryForwardRefusal.NOT_OBSERVATION_FORM);
  });

  it('refuses an observation block whose pin is symbolic or abbreviated', () => {
    for (const basisRevision of ['HEAD', 'main', BASIS.slice(0, 7), BASIS.toUpperCase()]) {
      const result = carryForwardHistory(priorArtifact({ basisRevision }) as never);
      expect(result.preserved).toBe(false);
      if (result.preserved) continue;
      expect(result.refusal).toBe(CarryForwardRefusal.NO_CONFORMING_BASIS);
    }
  });

  it('carries an entry that omits the A-010 classification flag', () => {
    // The shape this producer emits. Treating the absent flag as malformed
    // would refuse to carry forward exactly its own output.
    const result = carryForwardHistory(priorArtifact() as never);
    expect(result.preserved).toBe(true);
    if (!result.preserved) return;
    expect('generated' in (result.history.coChange[0] as object)).toBe(false);
  });

  it('refuses a block violating support <= occurrences', () => {
    const result = carryForwardHistory(
      priorArtifact({ coChange: [observationEntry({ support: 30, occurrences: 24 })] }) as never,
    );
    expect(result.preserved).toBe(false);
  });
});
