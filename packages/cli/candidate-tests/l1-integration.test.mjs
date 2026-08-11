/**
 * L1 candidate-contract tests — the packed-candidate integration boundary.
 *
 * These do NOT run in the CLI workspace, and that separation is deliberate.
 * They exercise the observation form, which the published
 * `@workspacejson/spec@0.4.4` and `@workspacejson/rules@0.4.4` reject: their
 * schema predates ADR-003 A-009 and still requires `rate` while forbidding
 * `support`. Running them in the workspace would either fail against
 * legitimate published dependencies or force a compatibility shim around
 * `WorkspaceJsonValidator` — and a shim is the one outcome that would make
 * these tests green while proving nothing, because the validator is the
 * contract under test.
 *
 * So they run in a disposable environment where `spec` and `rules` are the
 * PACKED candidates built from a pinned `standard` revision, and the CLI is its
 * own packed candidate. Everything asserted here is therefore **candidate
 * interoperability**, not published-package interoperability. The published
 * packages still reject this shape, and will until the freeze lifts.
 *
 * Plain Node test runner and plain JS on purpose: the environment has the three
 * packages under test and nothing else, so nothing here depends on the CLI
 * repository's toolchain.
 */
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { after, before, describe, it } from 'node:test';
import { generateWorkspaceJson } from '@workspacejson/cli';
import { WorkspaceJsonValidator } from '@workspacejson/rules';

const BASIS = '3c9a0f14b7e25d8613af04c2e9b7d5081f6a2c3d';
const NEWER_BASIS = 'a1b2c3d4e5f60718293a4b5c6d7e8f9012345678';

const observationEntry = (over = {}) => ({
  files: ['src/auth.ts', 'src/session.ts'],
  support: 8,
  occurrences: 24,
  ...over,
});

function priorArtifact(over = {}) {
  return {
    manual: { fragileFiles: [{ path: 'src/auth.ts', reason: 'hand-authored, must survive regeneration' }] },
    generated: {
      specVersion: '0.4',
      generatedAt: '2026-06-01T00:00:00Z',
      basisRevision: BASIS,
      by: { name: '@workspacejson/cli', version: '0.5.2' },
      frameworkManifest: [],
      fileIndex: {},
      coChange: [
        observationEntry(),
        observationEntry({ files: ['a.ts', 'b.ts'], support: 3, occurrences: 9 }),
      ],
      ...over,
    },
    agents: {},
    health: { intelligenceState: 'INSUFFICIENT_DATA', observationCount: 0, confidence: 0 },
  };
}

// ─── The environment itself is the first thing under test ───────────────────
// If the installed graph silently resolved a registry copy, every case below
// would be measuring the wrong contract while looking green. The version
// numbers cannot distinguish them — the candidates carry the same 0.4.4 as the
// published packages — so this checks the SHAPE OF THE SCHEMA instead, which is
// the thing that actually differs.
describe('the packed candidate environment resolves the contract under test', () => {
  it('the installed spec carries the A-009 observation form', async () => {
    const { workspaceJsonSchema } = await import('@workspacejson/spec');
    const item = workspaceJsonSchema.properties.generated.properties.coChange.items;
    const props = Object.keys(item.properties).sort();
    assert.ok(props.includes('support'), 'installed spec has no `support` — this is a pre-A-009 registry copy');
    assert.ok(props.includes('occurrences'));
  });

  it('the installed spec carries the A-010 widening', async () => {
    const { workspaceJsonSchema } = await import('@workspacejson/spec');
    const item = workspaceJsonSchema.properties.generated.properties.coChange.items;
    assert.ok(
      !item.required.includes('generated'),
      'installed spec still requires the classification flag — this is a pre-A-010 registry copy',
    );
    const legacy = item.oneOf.find((branch) => branch.title === 'legacy form');
    assert.ok(legacy.required.includes('generated'), 'legacy branch lost its requirement');
  });

  it('the validator the PRODUCER calls accepts the observation form', () => {
    // The decisive check. `rules` bundles its own `spec` dependency, so a
    // correct top-level `spec` proves nothing on its own — this asserts the
    // graph the producer actually runs through.
    const result = new WorkspaceJsonValidator().validate(priorArtifact());
    assert.equal(result.valid, true, `validator rejected the observation form: ${JSON.stringify(result.errors)}`);
  });
});

describe('ordinary generation and commit-history evidence', () => {
  let root;

  const artifactPath = () => resolve(root, '.agents/workspace.json');
  const readArtifact = async () => JSON.parse(await readFile(artifactPath(), 'utf8'));
  const generatedOf = async () => (await readArtifact()).generated;

  /** The exact bytes of the history block, which is what the contract is about. */
  const historyBytes = (generated) =>
    JSON.stringify({ basisRevision: generated.basisRevision, coChange: generated.coChange });

  before(() => {});

  const setup = async () => {
    root = await mkdtemp(join(tmpdir(), 'wsj-l1-'));
    await writeFile(join(root, 'AGENTS.md'), '# Test\n\nUse kebab-case for files.\n', 'utf8');
    await writeFile(join(root, 'package.json'), JSON.stringify({ name: 'fixture', version: '1.0.0' }), 'utf8');
    await mkdir(join(root, 'src'), { recursive: true });
    await writeFile(join(root, 'src/auth.ts'), 'export const auth = 1;\n', 'utf8');
    await mkdir(join(root, '.agents'), { recursive: true });
    await writeFile(artifactPath(), JSON.stringify(priorArtifact(), null, 2) + '\n', 'utf8');
  };

  const teardown = async () => {
    await rm(root, { recursive: true, force: true });
  };

  it('CASE 1 — a plain regeneration preserves the history block byte for byte', async () => {
    await setup();
    try {
      const before = historyBytes(await generatedOf());
      await generateWorkspaceJson(root);
      const after = await generatedOf();
      assert.equal(historyBytes(after), before);
      assert.equal(after.basisRevision, BASIS);
      assert.equal(after.coChange.length, 2);
    } finally {
      await teardown();
    }
  });

  it('CASE 2 — the pin is never advanced, and counts are never re-attributed', async () => {
    await setup();
    try {
      await generateWorkspaceJson(root);
      const after = await generatedOf();
      assert.equal(after.basisRevision, BASIS);
      assert.notEqual(after.basisRevision, NEWER_BASIS);
    } finally {
      await teardown();
    }
  });

  it('CASE 3 — ordinary generation does not recompute history', async () => {
    // The observations are FABRICATED: `src/session.ts` and `b.ts` do not exist
    // in this repository, and it has no git history at all. Any real mining
    // pass would produce something different — almost certainly nothing. Their
    // survival is therefore positive proof that no mining ran, which a timing
    // assertion could never establish.
    await setup();
    try {
      await generateWorkspaceJson(root);
      const after = await generatedOf();
      assert.deepEqual(after.coChange[0].files, ['src/auth.ts', 'src/session.ts']);
      assert.equal(after.coChange[0].support, 8);
      assert.equal(after.coChange[0].occurrences, 24);
      assert.deepEqual(after.coChange[1].files, ['a.ts', 'b.ts']);
    } finally {
      await teardown();
    }
  });

  it('CASE 4 — a non-history generated field changes without touching the block', async () => {
    await setup();
    try {
      const before = historyBytes(await generatedOf());
      await writeFile(join(root, 'src/added.ts'), 'export const added = 2;\n', 'utf8');
      const result = await generateWorkspaceJson(root);
      const after = await generatedOf();
      assert.equal(result.written, true);
      assert.ok(Object.keys(after.fileIndex).includes('src/added.ts'));
      assert.equal(historyBytes(after), before);
    } finally {
      await teardown();
    }
  });

  it('CASE 5 — --check reports no drift merely because history was not recomputed', async () => {
    await setup();
    try {
      await generateWorkspaceJson(root);
      const checked = await generateWorkspaceJson(root, {}, { check: true });
      assert.equal(checked.drift, false);
      assert.equal(checked.skipped, true);
    } finally {
      await teardown();
    }
  });

  it('CASE 6 — generatedAt may move while basisRevision stays put', async () => {
    await setup();
    try {
      await writeFile(join(root, 'src/added.ts'), 'export const added = 2;\n', 'utf8');
      await generateWorkspaceJson(root);
      const after = await generatedOf();
      assert.notEqual(after.generatedAt, '2026-06-01T00:00:00Z');
      assert.equal(after.basisRevision, BASIS);
    } finally {
      await teardown();
    }
  });

  it('CASE 7 — with no prior block, ordinary generation invents nothing', async () => {
    await setup();
    try {
      await rm(artifactPath());
      await generateWorkspaceJson(root);
      const after = await generatedOf();
      assert.equal('coChange' in after, false);
      assert.equal('basisRevision' in after, false);
    } finally {
      await teardown();
    }
  });

  it('CASE 8 — manual evidence survives alongside preserved history', async () => {
    await setup();
    try {
      await generateWorkspaceJson(root);
      const artifact = await readArtifact();
      assert.deepEqual(artifact.manual.fragileFiles, [
        { path: 'src/auth.ts', reason: 'hand-authored, must survive regeneration' },
      ]);
    } finally {
      await teardown();
    }
  });

  it('CASE 9 — the preserved artifact validates against the candidate schema', async () => {
    await setup();
    try {
      await writeFile(join(root, 'src/added.ts'), 'export const added = 2;\n', 'utf8');
      await generateWorkspaceJson(root);
      const result = new WorkspaceJsonValidator().validate(await readArtifact());
      assert.equal(result.valid, true, JSON.stringify(result.errors));
    } finally {
      await teardown();
    }
  });
});

// ─── Opt-in mining, against a real repository with real history ─────────────
let minedRoot;

describe('explicit mining writes a conforming block', () => {
  let root;

  const git = (args, cwd) => execFileSync('git', args, { cwd, encoding: 'utf8' });

  const build = async () => {
    root = await mkdtemp(join(tmpdir(), 'wsj-mine-'));
    git(['init', '-q', '-b', 'main'], root);
    git(['config', 'user.email', 'fixture@example.invalid'], root);
    git(['config', 'user.name', 'Fixture'], root);
    await writeFile(join(root, 'AGENTS.md'), '# Fixture\n', 'utf8');
    await writeFile(join(root, 'package.json'), JSON.stringify({ name: 'mined', version: '1.0.0' }), 'utf8');
    await mkdir(join(root, 'src'), { recursive: true });

    // Six commits that change the same two files together, and a third file
    // that moves independently. The coupling is in the commit graph and nowhere
    // else — neither file imports the other — which is the case the whole
    // standard rests on.
    for (let i = 0; i < 6; i += 1) {
      await writeFile(join(root, 'src/auth.ts'), `export const auth = ${i};\n`, 'utf8');
      await writeFile(join(root, 'src/session.ts'), `export const session = ${i};\n`, 'utf8');
      git(['add', '-A'], root);
      git(['commit', '-q', '-m', `paired change ${i}`], root);
    }
    for (let i = 0; i < 3; i += 1) {
      await writeFile(join(root, 'src/lonely.ts'), `export const lonely = ${i};\n`, 'utf8');
      git(['add', '-A'], root);
      git(['commit', '-q', '-m', `solo change ${i}`], root);
    }
    minedRoot = root;
  };

  // NOTE: `root` is intentionally NOT removed here. The refresh-outcome suite
  // below reuses it as `minedRoot` — it is the only fixture in this file with a
  // real commit graph, and rebuilding one per suite would triple the runtime.
  // It is cleaned up at the end of the file instead.

  it('mines, projects, and produces a schema-valid artifact', async () => {
    await build();
    const result = await generateWorkspaceJson(root, {}, { mineHistory: true });
    const generated = result.content.generated;

    assert.ok(Array.isArray(generated.coChange), 'no coChange block was written');
    assert.match(generated.basisRevision, /^[0-9a-f]{40}$|^[0-9a-f]{64}$/);
    assert.equal(generated.basisRevision, git(['rev-parse', 'HEAD'], root).trim());

    const validation = new WorkspaceJsonValidator().validate(result.content);
    assert.equal(validation.valid, true, JSON.stringify(validation.errors));
  });

  it('finds the no-import-edge coupling the thesis rests on', async () => {
    const result = await generateWorkspaceJson(root, {}, { mineHistory: true });
    const pair = result.content.generated.coChange.find(
      (entry) => entry.files.includes('src/auth.ts') && entry.files.includes('src/session.ts'),
    );
    assert.ok(pair, 'the paired files were not reported as co-changing');
    assert.equal(pair.support, 6);
    assert.ok(pair.occurrences >= pair.support);
  });

  it('emits no derived value and no unsupported classification', async () => {
    const result = await generateWorkspaceJson(root, {}, { mineHistory: true });
    for (const entry of result.content.generated.coChange) {
      assert.equal('rate' in entry, false, 'a derived rate was stored');
      assert.equal('generated' in entry, false, 'an unsupported classification was asserted');
      assert.deepEqual(Object.keys(entry).sort(), ['files', 'occurrences', 'support']);
    }
  });

  it('orders every pair canonically in ascending UTF-8 byte order', async () => {
    const result = await generateWorkspaceJson(root, {}, { mineHistory: true });
    const encoder = new TextEncoder();
    const compareUtf8 = (a, b) => Buffer.compare(Buffer.from(encoder.encode(a)), Buffer.from(encoder.encode(b)));
    for (const entry of result.content.generated.coChange) {
      assert.ok(compareUtf8(entry.files[0], entry.files[1]) <= 0, `pair not canonically ordered: ${entry.files}`);
    }
  });

  it('is deterministic — two runs at the same revision agree byte for byte', async () => {
    const first = await generateWorkspaceJson(root, {}, { mineHistory: true });
    const second = await generateWorkspaceJson(root, {}, { mineHistory: true });
    const block = (r) =>
      JSON.stringify({ basisRevision: r.content.generated.basisRevision, coChange: r.content.generated.coChange });
    assert.equal(block(first), block(second));
  });

  it('a subsequent ORDINARY run preserves what mining wrote', async () => {
    const mined = await generateWorkspaceJson(root, {}, { mineHistory: true });
    const minedBlock = JSON.stringify(mined.content.generated.coChange);
    const ordinary = await generateWorkspaceJson(root);
    assert.equal(JSON.stringify(ordinary.content.generated.coChange), minedBlock);
    assert.equal(ordinary.content.generated.basisRevision, mined.content.generated.basisRevision);
  });

  it('ORDINARY GENERATION DOES NOT RECOMPUTE, even where mining would succeed', async () => {
    // The decisive case, and the reason it has to be here rather than in the
    // no-history fixtures above: where the repository has no commit graph,
    // mining refuses and falls back to carry-forward, so a producer that
    // wrongly mined on every run would be indistinguishable from one that
    // never did. Those cases cannot detect recomputation at all.
    //
    // Here the graph exists AND has moved since the block was written, so the
    // two behaviours diverge: preserving keeps the old pin and the old counts,
    // recomputing advances the pin and changes the counts. Only one of those
    // can be true of the artifact afterwards.
    const mined = await generateWorkspaceJson(root, {}, { mineHistory: true });
    const pinnedAt = mined.content.generated.basisRevision;
    const blockBefore = JSON.stringify(mined.content.generated.coChange);

    // Move the graph: four more commits pairing a DIFFERENT set of files, which
    // a fresh mining pass would certainly report and the stored block cannot.
    for (let i = 0; i < 4; i += 1) {
      await writeFile(join(root, 'src/alpha.ts'), `export const alpha = ${i};\n`, 'utf8');
      await writeFile(join(root, 'src/beta.ts'), `export const beta = ${i};\n`, 'utf8');
      git(['add', '-A'], root);
      git(['commit', '-q', '-m', `new pairing ${i}`], root);
    }
    const movedHead = git(['rev-parse', 'HEAD'], root).trim();
    assert.notEqual(movedHead, pinnedAt, 'fixture error: HEAD did not move');

    const ordinary = await generateWorkspaceJson(root);

    // The pin must still name the commit the counts were taken at.
    assert.equal(
      ordinary.content.generated.basisRevision,
      pinnedAt,
      'ordinary generation advanced the basis pin — the counts now claim a revision they were never counted at',
    );
    assert.equal(
      JSON.stringify(ordinary.content.generated.coChange),
      blockBefore,
      'ordinary generation rewrote the co-change block — history was recomputed',
    );
    // And the new pairing must be absent, because nothing re-read the graph.
    const newPair = ordinary.content.generated.coChange.find(
      (entry) => entry.files.includes('src/alpha.ts') && entry.files.includes('src/beta.ts'),
    );
    assert.equal(newPair, undefined, 'a pair only visible to a fresh mining pass appeared in an ordinary run');

    // Explicit mining, by contrast, DOES pick it up — which proves the previous
    // assertions measured opt-in behaviour rather than a broken miner.
    const remined = await generateWorkspaceJson(root, {}, { mineHistory: true });
    assert.equal(remined.content.generated.basisRevision, movedHead);
    const reminedPair = remined.content.generated.coChange.find(
      (entry) => entry.files.includes('src/alpha.ts') && entry.files.includes('src/beta.ts'),
    );
    assert.ok(reminedPair, 'explicit mining failed to observe the new pairing');
  });
});

// ─── Refresh outcome signalling (Greptile P1 on PR #20) ─────────────────────
describe('an explicitly requested refresh reports what it actually did', () => {
  let root;

  const artifactPath = () => resolve(root, '.agents/workspace.json');

  const setup = async () => {
    root = await mkdtemp(join(tmpdir(), 'wsj-refresh-'));
    await writeFile(join(root, 'AGENTS.md'), '# Fixture\n', 'utf8');
    await writeFile(join(root, 'package.json'), JSON.stringify({ name: 'fixture', version: '1.0.0' }), 'utf8');
    await mkdir(join(root, 'src'), { recursive: true });
    await writeFile(join(root, 'src/auth.ts'), 'export const auth = 1;\n', 'utf8');
    await mkdir(join(root, '.agents'), { recursive: true });
    await writeFile(artifactPath(), JSON.stringify(priorArtifact(), null, 2) + '\n', 'utf8');
  };
  const teardown = async () => { await rm(root, { recursive: true, force: true }); };

  it('REFUSED REFRESH SAYS SO while keeping the block it fell back to', async () => {
    // The P1 exactly: this repository has no commit graph, so an explicit
    // refresh cannot complete. Falling back to the recorded block is correct —
    // destroying evidence over a shallow clone would be worse. What must not
    // happen is the caller receiving a successful-looking result carrying the
    // PREVIOUS revision's counts with no way to tell.
    await setup();
    try {
      const result = await generateWorkspaceJson(root, {}, { mineHistory: true });

      assert.equal(result.historyRefresh?.requested, true);
      assert.equal(result.historyRefresh?.mined, false, 'a refusal was reported as a completed refresh');
      assert.equal(result.historyRefresh?.preserved, true);
      assert.ok(result.historyRefresh?.refusal, 'no reason was given for the refusal');

      // …and the evidence survived.
      assert.equal(result.content.generated.basisRevision, BASIS);
      assert.equal(result.content.generated.coChange.length, 2);
    } finally {
      await teardown();
    }
  });

  it('a COMPLETED refresh is distinguishable from a refused one', async () => {
    // Same call, a repository that can actually be mined. If these two produced
    // the same `historyRefresh`, the field would be decorative.
    const mined = await generateWorkspaceJson(minedRoot, {}, { mineHistory: true });
    assert.equal(mined.historyRefresh?.mined, true);
    assert.equal(mined.historyRefresh?.preserved, false);
    assert.equal('refusal' in (mined.historyRefresh ?? {}), false, 'a successful refresh carried a refusal');
  });

  it('an ordinary run reports NO refresh outcome at all', async () => {
    // Absence means "none requested". Reporting `mined: false` here would claim
    // a refresh was attempted and failed, which is a different and untrue thing.
    const ordinary = await generateWorkspaceJson(minedRoot);
    assert.equal(ordinary.historyRefresh, undefined);
  });
});

after(async () => {
  if (minedRoot) await rm(minedRoot, { recursive: true, force: true });
});
