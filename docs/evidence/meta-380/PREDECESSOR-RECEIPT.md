# PREDECESSOR-RECEIPT — META-380

**Date:** 2026-08-22. **Scope:** verification of immutable predecessor evidence
and mechanical derivation of the exclusion list, before preregistration.

## Verified predecessor SHAs

All SHAs verified remotely via GitHub API on 2026-08-22 before this file was
written.

| Input | Repository | SHA | Verified |
| -- | -- | -- | -- |
| META-289 results | `workspacejson/cli` | `741229352ebacf8c0268cbe30265fbd34260b3ba` | yes |
| META-289 preregistration | `workspacejson/cli` | `8f3f762dbc6ae7006f2317fb6137e6e2a754a92a` | yes |
| META-289 pre-outcome freeze | `workspacejson/cli` | `7bd2f17c1b715875d0dc8dbace5d2002f46a29dd` | yes |
| META-379 diagnostic | `workspacejson/cli` | `e1b2cfa42d75f623455677283a894d21b20d0c53` | yes |

## META-289 disposition

`MIXED_BY_REPOSITORY_OR_TESTING_CULTURE`. Historical source-test co-update (H)
beat both B0 and B1 in 1 of 4 repositories (remult/remult, TypeScript). 429 of
800 (53.6%) source-changing transactions touched no test file.

## META-379 disposition

`HISTORY_RETAINS_RESIDUAL_SIGNAL` on remult/remult (diagnostic only).

Frozen diagnostic values:

| Metric | Value |
| -- | -- |
| H R@10 | 0.6816176471 |
| B2_STATIC R@10 | 0.6181372549 |
| H - B2 | +0.0634803922 |

META-379 was diagnostic only. META-380 tests whether that residual survives
out of sample.

## Exclusion list — mechanically derived

Every repository that contributed an observation to any predecessor in the
META-289/375/377/378/379 chain is excluded by exact `full_name`.

| Source | Excluded `full_name` | Language |
| -- | -- | -- |
| META-289 cohort | `remult/remult` | TypeScript |
| META-289 cohort | `flyteorg/flyte` | Go |
| META-289 cohort | `LuckPerms/LuckPerms` | Java |
| META-289 cohort | `kornia/kornia` | Python |
| META-375 discovery | `formatjs/formatjs` | TypeScript |
| META-375 discovery | `JamieMason/syncpack` | Rust |
| META-375 discovery | `polyfy/polylith` | Clojure |
| META-378 cohort | `nteract/hydrogen` | TypeScript |
| META-378 cohort | `thepowersgang/rust_os` | Rust |
| META-378 cohort | `clojure/core.typed` | Clojure |
| META-378 cohort | `hyperledger/fabric` | Go |
| META-378 cohort | `scikit-image/scikit-image` | Python |
| Self-ownership | any repository whose owner is `workspacejson` | any |

**13 entries (12 named plus the workspacejson org rule).** No repository on
this list may contribute a confirmatory observation to META-380. The
exclusion is enforced mechanically in the eligibility filter (E9) and
re-proven by invariant I-EXCL.

## Method reuse — not redesign

META-380 reuses frozen definitions from META-289 and META-379 without
redesign or tuning:

| Component | Source | Reused from |
| -- | -- | -- |
| SOURCE classifier | META-289 PREREG §6 | verbatim |
| TEST classifier | META-289 PREREG §7 | verbatim (T-JS rule only fires for TypeScript cohort) |
| Transaction unit | META-289 PREREG §8 | verbatim |
| T0 referent | META-289 PREREG §10 | verbatim |
| History window (H) | META-289 PREREG §9 | verbatim |
| B0 popularity baseline | META-289 PREREG §15 | verbatim |
| B1 structural baseline | META-289 PREREG §16 | verbatim |
| Candidate-suite denominator | META-289 PREREG §17 | verbatim |
| K values | META-289 PREREG §18 | verbatim |
| Query classification | META-289 PREREG §19 | verbatim |
| Metrics (recall, precision, MRR, fraction) | META-289 PREREG §21 | verbatim |
| B2_STATIC/v1 | META-379 STATIC-BASELINE-DESIGN.md | verbatim |
| B2 depth = 4 | META-379 | verbatim |
| B2 ranking order | META-379 | verbatim |

No method may be improved after seeing replication outcomes.
