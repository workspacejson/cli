# RECEIPT — META-375 prospective co-change projection characterization

**Date:** 2026-08-21. **Scope:** Phase 0–3 execution record: environment,
frozen-referent reproduction, controls, checks, red tests, deviations.
Findings: `REPORT.md`. Freeze: `PREREGISTRATION.md` @ commit
`8ae661ec24b6539c19a5237dcd232644d7490cfd` (before any characterization
output).

## Environment

| | |
| -- | -- |
| Host | darwin arm64 |
| Node | v22.19.0 |
| npm | 10.9.8 |
| pnpm | 10.24.0 (META-310 recorded 9.0.0 — see Deviations) |
| Run directory | `$RUN` scratch (transient); all outputs committed under `runs/` |

## Frozen referent reproduction (Phase 2)

| Control | Expected | Observed | Result |
| -- | -- | -- | -- |
| cli@031c3504 worktree | commit exists | exists | PASS |
| standard@f95c42f8 worktree | commit exists | exists | PASS |
| Tarball digest spec 0.4.4 | `2e0c326e7d8b…9111` | identical | PASS |
| Tarball digest rules 0.4.4 | `548dd7887258…dbb7` | identical | PASS |
| Tarball digest cli 0.5.2 | `aa0ab7526a8f…ad18` | identical | PASS |
| Tarball digest mining-core 0.0.0 | `4f2a632d874d…7577e` | identical | PASS |
| Driver digest (`meta310-mine.mjs`) | `5be5c814caed…83c` | identical | PASS |
| Install audit | 4 × `file:`, 0 registry | 4 × `file:`, 0 registry | PASS |
| Duplicate `@workspacejson/spec` | 0 | 1 copy installed | PASS |
| Calibration (standard@8e08c8c) | `7012352617df…`, 50 entries, 128 pre-cap | identical | PASS |
| Pin control syncpack | `ce5ecabea30e…` | identical | PASS |
| Pin control formatjs | `cc4b87e4d63f…` | identical | PASS |
| Pin control polylith | `a77451d9727d…` | identical | PASS |
| T0′ control (syncpack-b100, = META-374) | `5b2c63e87901…`, 568 qualifying, 819 available | identical | PASS |
| Driver↔receipt cross-check, every basis | identical | identical | PASS |
| `npm run check:workspace` (spec validation), every basis | valid, 0 errors | valid, 0 errors | PASS |

## Mining runs (9 bases, frozen driver, no options)

| Label | Basis commit | Available | Extracted | Qualifying (pairsBeforeCap) | Emitted | capBound |
| -- | -- | --: | --: | --: | --: | -- |
| syncpack-pin | `958d30689ac2…` | 919 | 500 | 729 | 50 | true |
| syncpack-b100 | `233a0b37265f…` | 819 | 500 | 568 | 50 | true |
| syncpack-b250 | `e59665142b30…` | 669 | 500 | 784 | 50 | true |
| formatjs-pin | `27c29bf9a40a…` | 6,545 | 500 | 713 | 50 | true |
| formatjs-b100 | `f3f07cd92a7f…` | 6,445 | 500 | 1,242 | 50 | true |
| formatjs-b250 | `50031ffe85c2…` | 6,295 | 500 | 1,776 | 50 | true |
| polylith-pin | `68dab9868274…` | 394 | 394 | 1,658 | 50 | true |
| polylith-b100 | `801e7afa6af1…` | 294 | 294 | 1,406 | 50 | true |
| polylith-b250 | `23c976ba040a…` | 144 | 144 | 327 | 50 | true |

All qualifying counts match the driver receipts exactly (check C2).

## Internal consistency checks (PREREGISTRATION §19)

54/54 PASS: C1 (support ≤ occurrences), C2 (dump count == receipt
pairsBeforeCap), C3 (dump top-50 == artifact coChange, pairwise
files+support+occurrences), C4 (frozen ranking order), C5 (basis identity ==
frozen bases.json), C6 (recomputed history-block digest == recorded) — for
each of the 9 bases.

## Red tests

45/45 CAUGHT: R1 (support > occurrences), R2 (rank swap), R3 (top-50
deletion), R4 (basis SHA one-char alteration), R5 (digest corruption) — for
each of the 9 bases.

## Exposure UNKNOWN audit

Post-hoc verification that the verbatim META-374 static-edge regex guard never
fired: at every basis, `static-edge` UNKNOWN count == pairs with ≥1 absent
endpoint (e.g. syncpack-b250: 690 == 690) and `generated-marker` UNKNOWN count
== both-absent pairs (625 == 625). All UNKNOWNs are absence-driven.

## Artifacts

`runs/` contains, per basis label: `<label>.dump.json` (full qualifying
population with ranks, recency, subwindows), `<label>.characterization.json`
(roles, existence, exposure, held-out overlap, targets),
`<label>.receipt.json` (frozen driver receipt), `<label>.workspace.json`
(produced artifact), plus `aggregate.json` (all tables). SHA-256 prefixes
(first 16 hex):

| Label | dump | characterization | receipt | artifact |
| -- | -- | -- | -- | -- |
| syncpack-pin | 529b66d6326c6dfe | 45cfc2e345f5dbb8 | 70c0b46a7882d773 | 1141be89c394f5d6 |
| syncpack-b100 | b2f4d4b7b0432ac7 | 4a7a29601536a86d | e7f36a5b4a12de94 | 50987b6b610c8591 |
| syncpack-b250 | 50370038dfa90674 | 541f1a370762a598 | 20814533c5f47984 | 8035d54348b44fd7 |
| formatjs-pin | a186bfcf2510fb04 | 49b4d30c061e6b03 | 1c25cce4011e7fd8 | c0e1a5f030f0c4ff |
| formatjs-b100 | 8f9d03f220ff672d | 1d279b8b42a179b1 | 290656fcabd2bad5 | ecafea67326b3275 |
| formatjs-b250 | 9a37ef802c59c030 | 09e04f04bc31589d | 07ae2d612eb23af6 | 930ad607d6778f37 |
| polylith-pin | 768f04517e795763 | 2c0e5efa5b53b72e | 53bafba8166ed63e | 0940c72d0f3abbc6 |
| polylith-b100 | 15280dca8a52f4be | ba672a1902ef1676 | 0e91b8e1092c634f | f11be4571d1368bf |
| polylith-b250 | ed12f0e323e8c840 | 1e8309d89bb9dd9c | 7163e4ae68ac085b | 3291d410c3b1c3d7 |
| aggregate.json | 8e9963fb3cb7f113 | | | |

Analysis scripts: `scripts/dump.mjs`, `scripts/characterize.mjs`,
`scripts/checks.mjs`, `scripts/aggregate.mjs`, `scripts/bases.json` (frozen
basis resolution).

## Deviations

1. **pnpm 10.24.0 vs META-310's recorded 9.0.0.** Install and build succeeded
   with `--frozen-lockfile`; all four tarball digests match META-310's
   recorded pins byte-for-byte, so the toolchain difference is immaterial to
   the mined bytes.
2. **`characterize.mjs` content cache.** A per-file content cache was added
   for performance (9 bases × up to 1,776 pairs × `git show`). Purely an
   implementation detail; no rule, regex, or output semantics changed.
3. **Exposure regex guard.** The META-374 static-edge token regex construction
   was carried verbatim inside a try/catch so a pathological stem could not
   abort the run. The guard never fired (see Exposure UNKNOWN audit).
4. **Basis worktrees.** Mining ran against detached worktrees of full clones
   at each frozen basis SHA rather than separate clones; C5 verifies the mined
   basis identity against `bases.json` for every run.
5. **Post-freeze wording correction in `PREREGISTRATION.md` §3.** The
   sentence describing the syncpack −100 control originally read "is
   byte-identical to META-374's T0′". A Git commit is identified by SHA,
   not by byte-equality of two commits, so the wording was corrected to
   "resolves to the exact same commit SHA as META-374's T0′". This is a
   wording defect fix only: the referenced basis SHA
   `233a0b37265ff278bc96ece91f8c2bbfcaeeb280`, the control's role, and the
   reproduced history-block digest are unchanged, and no measurement rule,
   denominator, classifier, threshold, or output is affected. No other
   retrospective methodology change was made. All §19 checks and red tests
   were re-run after the correction and remain 54/54 PASS and 45/45
   CAUGHT.

## Stopping rule

No preregistered stop condition fired. No repository, basis, target, or
parameter was added, removed, or substituted after characterization output was
observed.
