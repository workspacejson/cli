# Review rules for `workspacejson/cli`

This repository is the neutral `workspace.json` **producer**. It owns
deterministic generation, repository scanning, manual-evidence preservation,
atomic writes, drift detection, the explicit opt-in commit-history pass, and the
frozen `agents-audit` compatibility bridge. It consumes `@workspacejson/spec`
and `@workspacejson/rules` from `workspacejson/standard` at exact published
versions. See [`OWNERSHIP.md`](../OWNERSHIP.md) for the authority boundary and
[`REVIEW.md`](../REVIEW.md) for how these rules are used at merge time.

The rules below are enforced as structured rules in `config.json` and elaborated
here in prose so the reasoning is reviewable alongside the code.

## The failure class this repository actually has

Nearly every rule here is a specialization of one defect: **a producer that
emits a plausible-looking artifact for evidence it did not gather.**

The artifact is the product. Nothing downstream can tell, from the bytes alone,
whether a `coChange` block was counted at the revision it is pinned to, whether
a refresh the caller asked for actually ran, or whether an empty array means
"analyzed, nothing found" or "never analyzed". Every one of those confusions
produces a file that validates, reads plausibly, and is false.

Greptile found exactly this on PR #20, and it is the reason this repository has
its own policy rather than a copy of the standard's: an explicit
`mineHistory: true` request could fall back to stale preserved history and
return a successful-looking result, with the refusal reason computed and then
discarded. The artifact looked identical either way.

When reviewing a change here, the question that catches the most is: **would
this artifact state a result nobody measured?**

## Ecosystem-wide rules

These five are shared across the `workspacejson` ecosystem and apply to every
file in this repository. They are carried because they are genuinely
repository-independent, not because the standard has them.

### Evidence must be load-bearing

A verification check that cannot fail proves nothing. If you add a test, guard,
parity harness, or assertion, it must be capable of failing for the defect it
names.

Example violation: a parity harness that reports `27/29` from a recorded
expectation rather than from the comparison it just ran. The number looks like a
measurement and is a constant.

### Absence is not success

Absence, refusal, skipped, unsupported, or unavailable is never success, false,
safe, empty, zero, or green.

This is the load-bearing rule of this repository, because the producer has four
distinct ways to gather nothing — shallow clone, absent history, Git invocation
failure, and genuinely no qualifying pairs — and only the last one is a result.

Example violation: `mineHistoryBlock` catching a Git failure and returning an
empty array instead of `undefined`. The caller writes a pinned empty `coChange`,
which under A-009 positively asserts that the analysis ran and found nothing.

### Measurements must perturb

Metrics and receipts must perturb when their referent changes. A count, score,
hash, or parity number that does not move when its input moves is decorative.

Example violation: a tarball receipt whose integrity hash is read from a
manifest rather than computed from the pack that was just produced.

### Checks cannot be vacuous

Every verification check must be considered in both directions: cannot-ever-pass
and cannot-ever-fail. A guard that rejects everything looks identical to a
working guard from a green build.

Example violation: an architecture guard whose path filter no longer matches any
file. It reports zero violations forever, which is exactly what it reports when
the repository is clean.

### Clean-room boundary

No `@marcelle-labs/*` scope, private Vreko source, `workspace.vreko.json`, or
other cross-organizational implementation dependency may appear in any file,
including config, comments, tests, and documentation.

This repository carries a stricter form as well: `packages/cli/` must contain
**no** vendor- or host-specific content at all — no DataHub, dbt, Vreko, MCP,
Codex, or editor-integration logic, by filename or by content. The DataHub
adapter was extracted under META-248 precisely because a consumer adapter is not
neutral producer architecture, and re-adding it is a machine-checked failure.

## CLI-specific rules

These are written from verified producer failure classes in this repository, not
adapted from another repository's surface.

### An explicitly requested history refresh must remain observable

Scope: `packages/cli/src/producer/**`, `packages/cli/src/commands/**`

When a caller passes `mineHistory: true` and mining refuses, falling back to the
previously preserved block is **correct** — destroying evidence over a shallow
clone or a transient Git failure would be worse. Falling back *quietly* is the
defect.

The result must report that the refresh did not happen and why. Removing
`historyRefresh`, narrowing it, conditionally omitting `refusal`, or reporting
`mined: true` on a fallback path all reintroduce the PR #20 P1. `basisRevision`
only helps a reader who already suspects something is wrong; a caller who asked
for fresh observations must be told without having to suspect.

Note the shape of the field: `historyRefresh` is absent when no refresh was
requested, and present with `mined: false` plus a `refusal` when one was
requested and refused. Those two absences mean different things and must not be
collapsed.

### Ordinary generation must not mine commit history

Scope: `packages/cli/src/producer/**`, `packages/cli/src/commands/**`,
`packages/mining-core/src/**`

Mining is explicit and opt-in. `mineHistory` defaults to off, and that default is
the contract rather than a convenience: mining a bounded window costs seconds to
tens of seconds, and a producer that recomputed history every run would make the
artifact churn on every commit — the exact `generate --check` failure the
raw-count amendment removed.

Watch for the inverted default (`options.mineHistory !== false`), a caller that
passes the flag unconditionally, and any second commit-graph read path added
outside the mining pass.

### `basisRevision` must not advance without recomputation

Scope: `packages/cli/src/producer/**`, `packages/mining-core/src/**`

Carrying preserved observations forward while moving the pin to current `HEAD`
re-attributes old counts to a commit they were never counted at. The numbers stay
plausible and become false. Only a completed mining pass may write a new
`basisRevision`, and it must write the revision it actually counted at.

`generatedAt` is not evidence about the history block — it records when the
ordinary run happened. A run that refreshes `fileIndex` moves `generatedAt` and
must leave `basisRevision` exactly where it was. A reader comparing `generatedAt`
to the current revision learns nothing about whether the history block is stale.

### Shallow or unavailable history must emit nothing, not an empty block

Scope: `packages/mining-core/src/**`, `packages/cli/src/producer/**`

A *pinned* empty `coChange` array is a positive finding: the analysis ran at this
revision and found no qualifying pairs. Emitting one for a repository that could
not be analyzed states a result nobody measured. A projection whose completeness
is not a mined state must yield nothing at all, and the refusal must name the
state it refused on.

The two mined states (`QUALIFYING_RELATIONSHIP_OBSERVED`,
`MINED_NO_QUALIFYING_RELATIONSHIP`) are the only ones that may produce a block.
Widening that set, or defaulting an unknown completeness state into it, is the
violation.

### Observation pairs use canonical UTF-8 endpoint ordering

Scope: `packages/mining-core/src/**`, `packages/cli/src/producer/**`

Canonical endpoint order is established at the projection boundary, using the
UTF-8 byte comparator. Bare `<` / `>` string comparison is UTF-16 code unit
order and disagrees with UTF-8 above the BMP — a path containing U+1F600 sorts
before one containing U+E000 under UTF-16 and after it under UTF-8.
`localeCompare` varies with host locale.

Upstream stages may sort with `<` for map keying, where only stability matters.
That is not fine for bytes a second producer is compared against. Endpoint
reversal must not change the emitted output, and that must be asserted by a test
rather than in prose.

### Preserved history must survive unrelated generation byte-for-byte

Scope: `packages/cli/src/producer/**`

`generated.coChange` and `generated.basisRevision` are the one part of the
producer-owned section that ordinary generation preserves rather than rebuilds,
because they derive from an input ordinary generation does not read.

Passing the parsed values through untouched is what makes the guarantee real.
Rebuilding entries field by field re-orders keys and changes bytes even when
every value matches. Dropping the block on regeneration produces an artifact
indistinguishable from one that was never mined.

Validating rather than trusting the prior block is deliberate and must stay: a
block that would not survive schema validation must not be carried into a fresh
artifact, or one bad mining run poisons every subsequent generation.

### `WorkspaceJsonValidator` may not be bypassed

Scope: `packages/cli/src/**`, `packages/agents-audit-compat/src/**`

The validator may not be bypassed, replaced with a vendored or hand-rolled
schema, stubbed in a non-test path, or weakened to accommodate candidate
development.

There is a legitimate pattern that looks similar and is not a violation: when a
published type lags the amended schema, a local interface may narrow the
compile-time gap at a single declared boundary, provided the runtime artifact
still goes through the real validator unmodified and the accommodation says so.
The test is whether the local declaration changes what is *emitted* or only what
*compiles*. Changing what is emitted is the violation.

### The standard dependency boundary is exact and registry-bound

Scope: `package.json`, `packages/*/package.json`, `pnpm-workspace.yaml`,
`.npmrc`

`@workspacejson/spec` and `@workspacejson/rules` are consumed at exact published
versions. No committed `file:`, `link:`, `portal:`, `workspace:`, pnpm
`overrides`/`resolutions`, or sibling-checkout path may substitute for the
registry package, and no range specifier may replace an exact pin.

A sibling override makes the build depend on an unpublished working tree, so CI
green proves nothing about what a consumer installing from the registry
receives. A local override used during development must not be committed.

### Candidate verification must detect substitution

Scope: `scripts/**`, `migration/**`, `.github/workflows/**`

A verifier that installs a package by name and checks that it works can pass
against the previously published version, a cached tarball, or a
registry-resolved package that is not the candidate under test. Verification must
bind to the specific artifact — integrity, version, resolved source — and must
fail when what it received is not what it was asked to verify.

Reusing a cache without proving the cache holds the candidate is the same defect.
So is a post-publish check that cannot distinguish "the new version installs"
from "some version installs".

### `agents-audit` is frozen

Scope: `packages/agents-audit-compat/**`, `migration/**`,
`.changeset/config.json`, `.github/workflows/**`

`agents-audit` is frozen at `0.4.4` and is a compatibility bridge, not a
development surface. No feature may be added to it, no workflow may publish it,
and it must stay under `ignore` in the Changesets config so a workspace-wide
version bump cannot move it.

Anything touching its command surface, exit codes, output, or exports must be
measured against the frozen pre-migration source via the parity harnesses. A new
parity difference requires an explicit recorded intentional-difference entry —
updating the expected count to match the new behavior is the violation, not the
fix.

### The producer emits no derived or prescriptive fields

Scope: `packages/cli/src/producer/**`, `packages/mining-core/src/**`

Observation-form output carries raw integer counts. No `rate`, probability,
confidence, lift, or ranking may be written into it; a reader derives ratios. A
continuous derived value moves on every commit and makes `generate --check` fire
forever.

The artifact also stays descriptive. The producer must not introduce enforcement,
approval-gate, or merge-blocking fields into any emitted section — mandating what
consumers must do with the artifact is not this repository's authority.

Absence of the optional classification flag is a positive design decision, not an
unfinished one: this producer implements no deterministic tooling-coupling
classifier, so it says nothing rather than emitting a constant `false`.

### Reader tolerance does not relax producer obligations

Scope: `packages/cli/src/**`, `packages/agents-audit-compat/src/**`

That a reader, a published type, or the validator accepts a missing or malformed
field does not license the producer to emit it that way. Do not widen what the
producer writes because a consumer tolerates it, and do not treat a permissive
published type as permission to emit a shape the schema does not describe.

### Artifact bytes are deterministic

Scope: `packages/mining-core/src/**`, `packages/cli/src/producer/**`

Artifact-bound output must be a function of repository state alone — no wall
clock, no host locale, no environment, no absolute host paths. Two runs at the
same basis produce byte-identical bytes.

`localeCompare` is prohibited in any serialization or ordering path that reaches
the artifact. A non-finite or non-integer number in artifact-bound output must
**throw** rather than round or drop: rounding invents precision the measurement
does not have, and dropping removes a field a reader was told to expect. Both are
quieter than the bug, and quiet is the failure mode this repository exists to
avoid.

One known and accepted exception is recorded rather than hidden:
`generated.hygiene` in the published producer is fed by a 30-day
`git log --since` window and moves on its own (META-306). L0 does not inherit
that and does not fix it. Do not cite it as precedent for new nondeterminism.

### The artifact stays independently useful

Scope: `packages/cli/src/producer/**`, `README.md`, `packages/cli/README.md`

The committed artifact must remain daemon-free. No emitted field, example, or
documentation may make its meaning depend on a live service, daemon, running
process, or network call. A consumer who clones a repository and reads
`.agents/workspace.json` must understand what it says without starting anything.

### This repository does not define the specification

Scope: `packages/cli/src/**`, `packages/mining-core/src/**`, `types/**`,
`packages/*/tsconfig.json`

The normative schema, validation semantics, field lifecycle, and the stable read
paths belong to `workspacejson/standard`. A local copy, fork, patch, or
ambient-type shadow of a standard-owned contract is a boundary violation even
when it typechecks — the shadowed `node:fs` ambient declaration in
`types/ambient.d.ts` already produced one such defect, and the same class was
fixed once already for `@workspacejson/spec`.

Widening producer behavior to match a locally edited contract is not a fix. If
the contract is wrong, that is an issue on `workspacejson/standard`.

## Deliberately not carried from `workspacejson/standard`

Recorded so the omissions read as decisions rather than oversights.

| Standard rule | Why it is not here |
| -- | -- |
| `four-read-paths-breaking` | The read paths are a schema surface owned by `standard`. This repository's obligation is not to redefine them locally, which `no-local-schema-redefinition` already states. Duplicating the ADR-gating rule here would claim authority this repository does not hold. |
| `negative-fixtures-single-defect` | Scoped to `packages/spec/examples/invalid/**` and the standard's fixture machinery. No equivalent surface exists here. |
| `descriptive-not-prescriptive` (schema form) | Carried only in its producer form — what the producer may *emit* — inside `producer-emits-no-derived-or-prescriptive-fields`. The schema-authoring half does not apply. |
| `daemon-free` (spec/docs form) | Carried in its artifact form as `artifact-independently-useful`, scoped to producer output rather than to specification text. |
| `no-derived-probability` (spec form) | Carried as a producer emission obligation in the same combined rule, because this repository is where the emission actually happens. |
| `cochange-ordering-evidence` (spec form) | Carried as `canonical-utf8-endpoint-order`, which names the concrete comparator defect this repository can commit rather than the documentation claim `standard` can commit. |
| `reader-producer-distinct` (spec form) | Carried as `reader-tolerance-does-not-relax-producer`, stated from the producer's side. |
