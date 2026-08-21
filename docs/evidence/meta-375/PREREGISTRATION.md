# PREREGISTRATION — META-375 prospective co-change projection characterization

**Frozen 2026-08-21, before any characterization result was computed.** The
commit that adds this file is the freeze point. Phase 0's
`PRIOR-ART-METHODS.md` precedes it and names the exact sources used.

This document freezes every rule META-375's contract requires. Nothing in it
may be revised after characterization output is observed; deviations are
recorded in `RECEIPT.md`, never silently corrected.

## 1. Exact question

> Across preregistered repositories and historical bases, what fraction and
> kinds of qualifying historical relationships survive the current
> workspace.json projection at decision time, and what does the global top-N
> projection systematically omit or stale out?

Not asked here: whether workspace.json helps an agent. No model is run.

## 2. Repository-selection rule and cohort

Rule: exactly the META-310 public corpus, no additions, no exclusions, no
replacements. Denominator: **3 repositories × 3 bases = 9 bases**.

| Repository | META-310 pin | `availableTransitions` at pin |
| -- | -- | --: |
| `formatjs/formatjs` | `27c29bf9a40a50dac232a159b8790dbd14732c57` | 6,545 |
| `JamieMason/syncpack` | `958d30689ac24b60623258630242330bd6d0264b` | 919 |
| `polyfy/polylith` | `68dab9868274c8044817983c2424fbdbd616a456` | 394 |

## 3. Basis-selection rule and resolved identities

Per repository, bases = {pin, pin−100, pin−250}, where pin−k is the commit
exactly k first-parent transitions before the pin:

```sh
git rev-list --first-parent <pin> | sed -n '101p'   # offset 100
git rev-list --first-parent <pin> | sed -n '251p'   # offset 250
```

Eligibility is mechanical only: the basis resolves to a commit in a full,
non-shallow clone. **There is no history-depth floor.** Resolved 2026-08-21
against full clones, before any mining:

| Repository | Basis | Commit | Commit date |
| -- | -- | -- | -- |
| formatjs | pin | `27c29bf9a40a50dac232a159b8790dbd14732c57` | — |
| formatjs | −100 | `f3f07cd92a7ffb8e4686187aaa09dc3669f001da` | 2026-07-18 |
| formatjs | −250 | `50031ffe85c20ac46491c0afd0a43704893daac0` | 2026-05-29 |
| syncpack | pin | `958d30689ac24b60623258630242330bd6d0264b` | — |
| syncpack | −100 | `233a0b37265ff278bc96ece91f8c2bbfcaeeb280` | 2026-03-21 |
| syncpack | −250 | `e59665142b309955cdf5a6a83e522f9e92457c36` | 2025-11-09 |
| polylith | pin | `68dab9868274c8044817983c2424fbdbd616a456` | — |
| polylith | −100 | `801e7afa6af14fcd86d4bccfa2c2f58fb199fb13` | 2024-06-22 |
| polylith | −250 | `23c976ba040ab904414e2dea02aac11ad98af155` | 2022-05-05 |

syncpack −100 is byte-identical to META-374's T0′; its produced artifact must
reproduce META-374's history block `5b2c63e879015673…` and is used as a
control.

## 4. Miner identity (frozen referent)

| | |
| -- | -- |
| Driver | `evidence/meta-310/meta310-mine.mjs`, sha256 `5be5c814caed895b30a26d6fee697e1b65bc01c95789235dc49ad2a3f805e83c` (byte-frozen) |
| Producer source | `workspacejson/cli` @ `031c3504a0977b8d90ac518c82a39a2f4ec741a9` |
| Standard source | `workspacejson/standard` @ `f95c42f89c8fe39995c10918bea880729cf17bbd` |
| Tarball digests | spec `2e0c326e…9111`, rules `548dd788…dbb7`, cli `aa0ab752…ad18`, mining-core `4f2a632d…7577e` (full digests in `standard/docs/evidence/meta-310/RECEIPT.md`) |
| Runner manifest | `evidence/meta-310/runner-package.json` (not byte-frozen by design; tarball digests are the pin) |
| Environment as run | node v22.19.0, npm 10.9.8, pnpm 10.24.0, darwin arm64. META-310 recorded pnpm 9.0.0; the tarball digests are the real pin — any build divergence surfaces as a digest mismatch and stops the run (§17) |

The driver passes **no options** to `mine`/`score`/`select`.

## 5. Mining contract (frozen producer behavior)

Verbatim from META-310's frozen contract:

```text
weighting version:   META-289 v2.2.1 (size weight numerator 10,
                     position decay half-life 250) — recorded, never ranked on
history traversal:   git rev-list --first-parent --reverse <basisRevision>
                     git -c diff.renamelimit=5000 diff-tree -r --name-status -z \
                         --no-commit-id -M50% <parent> <commit>
rename handling:     -M50% similarity, renamelimit 5000 (extraction only)
analysis window:     500 first-parent transitions requested;
                     actualWindowTransitions = min(500, available)
bulk exclusion:      fileCount > 50, applied to whole EVENTS; excluded commits
                     named, not merely counted
path/file-role exclusions: EMPTY SET
threshold:           support >= 3
ranking:             support DESC, occurrences ASC,
                     files[0] ASC by UTF-8 bytes, files[1] ASC by UTF-8 bytes
cap:                 50
stored values:       no rate, no derived probability/lift/confidence
```

## 6. Qualification policy and projection

- **Qualifying relationship:** a pair with `support >= 3` over scored events
  in the window. The full qualifying population is `pairsBeforeCap`.
- **Emitted:** the top 50 of the qualifying population under the frozen
  ranking. **Global rank** of a qualifying relationship = its 1-based position
  in that ranking over the full population. Emitted ⇔ rank ≤ 50.
- **File-centric availability:** a relationship involving file F is available
  file-centrically iff it is in the full qualifying population, regardless of
  rank. No reranking of the canonical artifact occurs anywhere.

## 7. Per-relationship record fields (Phase 3)

For every qualifying relationship at every basis:

- `files` (endpoint A, endpoint B; UTF-8 ascending);
- `support`, `occurrences`, `globalRank`, `emitted` (rank ≤ 50);
- `existsA`, `existsB` at basis (§8);
- `roleA`, `roleB` (§9);
- `mostRecentSupport`: commit + Δpos of the most recent **scored** event
  touching both endpoints;
- `ageFromBasis` = Δpos of that event (§10);
- `firstSupport`: commit + Δpos of the oldest scored event touching both;
- `persistence`: X/Y over eligible subwindows (§11);
- `exposureClasses`: subset of the five frozen classes, with per-class
  `UNKNOWN` where content is required but an endpoint is absent (§12);
- `noPreregisteredExposure`: true when no class matched — recorded, never
  treated as proof of undiscoverability.

## 8. Endpoint-existence rule

`git ls-tree -r --name-only <basis>` membership, exact byte-string match.
A path renamed or deleted before the basis is **absent** — no cross-rename
stitching is invented (path identity is ADR-006's; the producer's `-M50%`
rename detection applies to event extraction, not to basis existence).

## 9. Endpoint-role taxonomy — single-label, exact precedence

Each path gets exactly one role: the **first** matching class below.
Classification is path-based except where noted; `roleEvidence` records
`path` or `content`.

1. **manifest-lock** — basename ∈ {`package.json`, `package-lock.json`,
   `pnpm-lock.yaml`, `yarn.lock`, `Cargo.toml`, `Cargo.lock`, `MODULE.bazel`,
   `MODULE.bazel.lock`, `WORKSPACE`, `WORKSPACE.bazel`, `Gemfile`,
   `Gemfile.lock`, `composer.json`, `composer.lock`, `go.mod`, `go.sum`,
   `deps.edn`, `project.clj`, `bb.edn`, `shadow-cljs.edn`,
   `.release-please-manifest.json`}, or basename ends `.lock`.
2. **tooling-ci** — path contains a `.github` segment, or basename matches
   `tsconfig*.json`, `*.config.{js,mjs,cjs,ts}`, `biome.json`, `biome.jsonc`,
   `.eslintrc*`, `.prettierrc*`, `jest.config.*`, `vitest.config.*`, `BUILD`,
   `BUILD.bazel`, `.bazelrc`, `Makefile`, `Dockerfile`, `rust-toolchain*`.
3. **docs** — extension ∈ {`.md`, `.mdx`, `.adoc`, `.rst`, `.txt`}, or first
   path segment is `docs`, or basename matches `^(README|CHANGELOG|LICENSE|CONTRIBUTING)`.
4. **test** — any path segment ∈ {`test`, `tests`, `__tests__`, `spec`,
   `specs`}, or basename matches `(_test|_spec|\.test|\.spec)\.[A-Za-z0-9]+$`,
   or basename matches `^(test|spec)_`.
5. **generated** — file exists at basis and its first 10 lines match
   `generated|do not (edit|update|modify)|autogenerated` (case-insensitive),
   or any path segment ∈ {`dist`, `gen`, `generated`}. Content check applies
   only when the file exists at basis; otherwise this class cannot match.
6. **source** — extension ∈ {`.rs`, `.ts`, `.tsx`, `.js`, `.jsx`, `.mjs`,
   `.cjs`, `.clj`, `.cljs`, `.cljc`, `.java`, `.py`, `.go`, `.rb`, `.c`, `.h`,
   `.cc`, `.cpp`, `.hpp`, `.cs`, `.kt`, `.kts`, `.swift`, `.scala`, `.vue`,
   `.svelte`, `.ex`, `.exs`, `.erl`, `.hrl`}.
7. **UNKNOWN** — everything else. UNKNOWN is preserved and counted, never
   coerced to another label.

## 10. Age definition

`ageFromBasis = decayOriginPosition − position(most recent scored event
touching both endpoints)` — the producer's Δpos convention, in first-parent
transitions (0 = newest extracted event). Also recorded: exact age.
Buckets, frozen: **[0–24], [25–99], [100–249], [250–499]**. The maximum
possible age at a basis is `extractedTransitions − 1` (≤ 499), so the buckets
are exhaustive.

## 11. Persistence across subwindows

Subwindow k ∈ {1..5} covers Δpos ∈ [100(k−1), 100k−1] ∩
[0, extractedTransitions−1]. A subwindow is **eligible** iff it contains ≥1
extracted event; since extraction positions are dense over
[0, extractedTransitions−1], eligibility is mechanical: k ≤
⌈extractedTransitions / 100⌉. A final partial subwindow counts as eligible
(frozen, not discretionary). `persistence = X/Y` where Y = eligible
subwindows and X = eligible subwindows containing ≥1 **scored** event touching
both endpoints.

## 12. Current-tree mechanical exposure taxonomy

Carried verbatim from META-374's `protocol/exposure.mjs` (D4 classes). **No
classes are added or altered in META-375**, preserving comparability:

- **E1 manifest-lock** — one endpoint matches the lock pattern
  `/(^|\/)(.*\.lock|.*-lock\.json|pnpm-lock\.yaml|yarn\.lock|Cargo\.lock)$/`
  and the other the manifest pattern `/(^|\/)(package\.json|Cargo\.toml)$/`.
- **E2 stem** — basename stems equal, or one is a prefix of the other.
- **E3 same-dir** — identical directory.
- **E4 static-edge** — either file's content at basis contains a word-boundary
  token of the other (tokens: basename stem plus parent-directory module name
  when not `src`/`.`, length > 2). **UNKNOWN** when either endpoint is absent
  at basis.
- **E5 generated-marker** — either file's first 10 lines at basis match the
  generation-marker regex. **UNKNOWN** when both endpoints are absent at
  basis.

"No preregistered exposure class found" is a recorded state, never evidence
that the relationship is undiscoverable.

## 13. Held-out transaction-unit rule

Carried verbatim from META-373's frozen rule
(`integrations/docs/evidence/meta-373/gate/TRANSACTION-UNIT-RULE.md`, sha256
`f4671df6bce1fea2…`), applied as META-374 applied it:

- Held-out window: **(basis, META-310 pin]** — the immutable pin is always the
  endpoint. Current upstream HEAD is never used or re-measured. A pin basis
  therefore has **0** held-out transitions **by definition** (reported as 0,
  not measured); −100 bases have 100, −250 bases have 250.
- Unit (fallback clause, per commit): each first-parent commit in the window
  is one transaction. Observed subsequent changed-file set:
  `git -c diff.renamelimit=5000 diff-tree -r --name-status -M50%
  --no-commit-id <parent> <commit>`. A merge commit on the first-parent chain
  is classified `MERGE_ON_FIRST_PARENT`, named, and excluded from overlap
  denominators.
- Transaction classes, regexes carried verbatim from META-374's frozen
  `protocol/screen.mjs`: **BULK** (>50 changed files), **RELEASE**,
  **REVERT**, **DEPENDENCY**. Classes are recorded per transaction.
- Overlap is reported two ways, both frozen: over **all** transactions, and
  over transactions passing META-374's M2∧M3∧M4 (non-bulk, non-release/revert,
  non-dependency). **No candidate selection occurs** — D1/D4/D5 admissibility
  screening belonged to a different question and is not applied.
- Naming discipline: held-out paths are "the observed subsequent changed-file
  set" — never required files, impact, blast radius, necessary changes, or a
  correct file set.
- Ordering: oldest-first, for determinism only; no stop-at-first.

## 14. File-centric comparison rule

Target files (META-323's preregistered set; paths verified against the
META-310 pinned artifacts):

| Repository | Targets |
| -- | -- |
| syncpack | `src/commands/lint.rs`, `src/instance.rs`, `src/context.rs` |
| polylith | `components/command/src/polylith/clj/core/command/core.clj` |
| formatjs | `packages/cli-lib/extract.ts` |

At every basis, each target is first classified as exactly one of
**TARGET_ABSENT_AT_BASIS**, **TARGET_PRESENT_ZERO_QUALIFYING_PARTNERS**, or
**TARGET_PRESENT_N_QUALIFYING_PARTNERS** (absence is not a zero-partner
observation). For the third state, report per target: total qualifying
partners, partners with global rank ≤ 50, partners omitted, and per-partner
endpoint roles, partner existence at basis, relationship age, persistence, and
exposure classes. Sparse and zero results are preserved.

## 15. Aggregate measurements (per repository × basis, exact X/Y)

Total qualifying; emitted; omitted; both endpoints current; one absent; both
absent; role composition (emitted vs omitted); age buckets (emitted vs
omitted); persistence categories; each exposure class; no preregistered
exposure; global-vs-file-centric per target; held-out overlap; emitted-vs-
omitted held-out overlap with covariates. **No collapse into a single score.**

Hypotheses H1–H5 (from the issue) are each reported supported / not
supported / indeterminate with the counts.

## 16. Denominators and missing-data treatment

- Every measurement reports its denominator; absent endpoints are counted as
  absent, never dropped from the population.
- UNKNOWN roles and UNKNOWN exposure classes are preserved as UNKNOWN.
- Bases with `actualWindowTransitions < 500` (polylith −250: 144) are labeled
  window-truncated; cross-basis comparisons note differing actual windows.
- No imputation anywhere.

## 17. Stopping rule

Stop, record the discrepancy, and produce no comparative results if any of:

- a Phase 2 reproduction control mismatches (tarball digest, driver digest,
  calibration history block, pin history blocks, T0′ control);
- the full-population dump cross-check fails (§19 C2/C3);
- a preregistered basis fails to resolve.

A stop is a result. Parameters are never adjusted to make a control pass.

## 18. No-replacement rule

After any characterization output beyond Phase 2 controls is observed, no
repository, basis, target file, threshold, or rule in this document may be
added, removed, or substituted — including because output is sparse, stale,
trivial, or unfavorable.

## 19. Internal consistency checks and red tests

Checks on every basis dump:

- **C1** `support ≤ occurrences` for every relationship;
- **C2** dump relationship count == driver receipt `pairsBeforeCap`;
- **C3** dump ranks 1–50 == artifact `coChange`, pairwise on
  files+support+occurrences;
- **C4** rank order satisfies the frozen ranking rule exactly;
- **C5** dump basis identity == requested basis commit;
- **C6** recomputed history-block digest == artifact's recorded value.

Red tests — each perturbed input **must fail** the checks (co-change is
symmetric, so pair-field order is not an invariant and is never perturbed):

- **R1** one relationship's support raised above its occurrences;
- **R2** two emitted relationships swapped in rank;
- **R3** one top-50 relationship deleted from the dump;
- **R4** basis SHA altered by one hex character;
- **R5** recorded digest string corrupted.

All five red tests must be caught before any aggregate table is trusted.

## 20. Decision rule

Exactly one disposition, from the aggregate tables only:
`PROJECTION_SUPPORTS_SUCCESSOR_AGENT_TEST`,
`PROJECTION_LIMITATION_CONFIRMED`, or `MIXED_BY_REPOSITORY_OR_BASIS` (naming
the conditional pattern and exact denominators). No projection fix is made in
this issue. The successor experiment (META-376) is reconciled only under the
first disposition, and is not executed regardless.

## 21. What this characterization never does

No model runs; no META-376 execution; no MCP/hooks/skills/ToolSearch/recruitment
testing; no workspace.json semantics change; no qualification-threshold, cap,
recency-weighting, or deleted-path-filter change; no invented relevance, risk,
fragility, planning, or usefulness scores; no maintainer contact; no outreach;
no tuning to rescue co-change; no SnapBack-derived constructs (rollback = AI
mistake, fragility/risk scores, blast radius, behavioral telemetry, AI
attribution, recommendations, PASS/WARN/BLOCK, prescriptive policy).
