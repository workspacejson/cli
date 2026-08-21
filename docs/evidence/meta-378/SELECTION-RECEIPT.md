# SELECTION-RECEIPT — META-378

**Committed before any mining output existed.**

**Seed:** `META-378/OQ-14/replication/v1`

**Ordering rule:** ascending sha256(SEED + ":" + full_name), lowercase hex, lexical

The order depends only on the seed and the repository name, so it was fixed
before any repository property beyond §6 eligibility was consulted, and it is
reproducible from the committed snapshot alone. Because the order was frozen
before any clone existed, the §7 backfill cannot be steered.

## Selected cohort

| Stratum | Repository | Rank taken | First-parent commits | Pin | −100 basis | −250 basis |
| -- | -- | --: | --: | -- | -- | -- |
| TypeScript | `nteract/hydrogen` | 4 | 1,324 | `9f353f103312` | `81c58fc9185f` | `a9d8c15da945` |
| Rust | `thepowersgang/rust_os` | 1 | 1,907 | `f1d2f7731a3c` | `36aea6b8c27f` | `ff8135977bbb` |
| Clojure | `clojure/core.typed` | 1 | 2,615 | `e0e7ae735072` | `0df8ae7788e3` | `ccd62310eb25` |
| Go | `hyperledger/fabric` | 1 | 9,284 | `0c423ac47fd8` | `4755dafa1023` | `97853f3063b9` |
| Python | `scikit-image/scikit-image` | 1 | 3,812 | `745baa05fc5d` | `bfded8096f82` | `ef21164f9649` |

**Five unseen repositories. None is a META-375 discovery repository.**

## Full basis SHAs and dates

| Basis label | Repository | SHA | Committed |
| -- | -- | -- | -- |
| `hydrogen-pin` | `nteract/hydrogen` | `9f353f10331218558fe401da65b32210c54e71b0` | 2026-07-18T22:45:37-07:00 |
| `hydrogen-b100` | `nteract/hydrogen` | `81c58fc9185f5d246d6e5f4598834b5722deedaf` | 2020-02-12T06:45:14+09:00 |
| `hydrogen-b250` | `nteract/hydrogen` | `a9d8c15da94515aa11c8f1f67a1f09fb76230451` | 2019-01-08T12:29:09-05:00 |
| `rustos-pin` | `thepowersgang/rust_os` | `f1d2f7731a3cca5f0623969e8f32fe37f9ed6bbb` | 2026-04-21T22:23:25+08:00 |
| `rustos-b100` | `thepowersgang/rust_os` | `36aea6b8c27f011f32f81947240dc56f8ed8d85a` | 2025-05-11T09:38:00+08:00 |
| `rustos-b250` | `thepowersgang/rust_os` | `ff8135977bbb8bba2d5007bd2a22f561714f9726` | 2024-04-03T09:59:48+08:00 |
| `coretyped-pin` | `clojure/core.typed` | `e0e7ae73507201c7ca74adde592a59112cf0ca96` | 2026-01-05T19:44:21-06:00 |
| `coretyped-b100` | `clojure/core.typed` | `0df8ae7788e3d973521f7cc20cb13001c18eb860` | 2020-01-23T07:40:27-05:00 |
| `coretyped-b250` | `clojure/core.typed` | `ccd62310eb25a3bbf584ac6bf42bf99a5ed1f858` | 2018-11-04T20:12:19-05:00 |
| `fabric-pin` | `hyperledger/fabric` | `0c423ac47fd87fc3d4084eb06d6589bc518ed1ff` | 2026-08-05T15:23:23+03:00 |
| `fabric-b100` | `hyperledger/fabric` | `4755dafa1023fbfcc7a0d11bba951b00c12f05bb` | 2025-11-16T22:56:05+01:00 |
| `fabric-b250` | `hyperledger/fabric` | `97853f3063b96f0662a69f4f68eb68be36e133ec` | 2025-01-08T12:24:00+02:00 |
| `scikitimage-pin` | `scikit-image/scikit-image` | `745baa05fc5d39c5e9679ee1ab8f19b432403ab0` | 2026-08-17T06:07:08-05:00 |
| `scikitimage-b100` | `scikit-image/scikit-image` | `bfded8096f82f41726577612954169280a7f1652` | 2026-01-13T17:29:21+01:00 |
| `scikitimage-b250` | `scikit-image/scikit-image` | `ef21164f9649759675bcfa3e1e1d8bf44ba2f807` | 2025-02-03T17:01:31-08:00 |

## Verification attempts and backfill (PREREGISTRATION §7)

Every attempt is recorded, including every skip and its mechanical reason.
Backfill fired **only** for §7 V1–V3 failures, never because a result was
sparse, negative, obvious, or inconvenient — no co-change or recurrence
output existed at this point.

| Stratum | Rank | Repository | Status | Mechanical reason |
| -- | --: | -- | -- | -- |
| TypeScript | 1 | `brunnolou/react-morph` | INELIGIBLE_ON_VERIFICATION | V3 firstParentCount=71 < 751 |
| TypeScript | 2 | `homebridge/HAP-NodeJS` | INELIGIBLE_ON_VERIFICATION | V3 firstParentCount=706 < 751 |
| TypeScript | 3 | `ixartz/Next-js-Boilerplate` | INELIGIBLE_ON_VERIFICATION | V3 firstParentCount=681 < 751 |
| TypeScript | 4 | `nteract/hydrogen` | **SELECTED** | V1–V3 pass, firstParent=1,324 |
| Rust | 1 | `thepowersgang/rust_os` | **SELECTED** | V1–V3 pass, firstParent=1,907 |
| Clojure | 1 | `clojure/core.typed` | **SELECTED** | V1–V3 pass, firstParent=2,615 |
| Go | 1 | `hyperledger/fabric` | **SELECTED** | V1–V3 pass, firstParent=9,284 |
| Python | 1 | `scikit-image/scikit-image` | **SELECTED** | V1–V3 pass, firstParent=3,812 |

**3 skips, all in the TypeScript stratum, all for V3** — fewer than
751 first-parent commits, so a 500-transition window at the
−250 basis is not satisfiable. That bound was fixed in §7 before selection.

## Replication scope

# `CROSS_REPOSITORY_REPLICATION`

All five repositories are absent from the META-375 corpus, and no new basis
was taken inside any of the three prior repositories. The cohort contains no
temporal-only component, so nothing is pooled across scopes.

## Measurement compatibility with discovery

META-375 mined each basis in a detached worktree; META-378 mines via
`mine(repoRoot, { basisRevision })` against a partial clone. Those are
interchangeable only if they produce identical output, so the META-378 harness
was used to re-derive a META-375 basis and compared against the committed
META-375 evidence.

Reference basis: `233a0b37265ff278bc96ece91f8c2bbfcaeeb280` (syncpack −100). Reading discovery data is
permitted by the anti-leak rule solely to *verify compatibility*; this basis
contributes no numerator, denominator, sign, or disposition to META-378 and is
not in the confirmation cohort.

| Check | Proves | Result |
| -- | -- | -- |
| `K1:qualifying-count` | identical qualifying population size | PASS (568 vs 568) |
| `K2:emitted-count` | identical emitted count under the frozen cap | PASS (50 vs 50) |
| `K3:ranking-identical` | identical rank order across the whole population | PASS (0 positions differ) |
| `K4:support-occurrences-identical` | identical support and occurrences per pair | PASS (0 pairs differ) |
| `K5:endpoint-existence-identical` | identical endpoint existence — the D4 input R1 depends on | PASS (0 pairs differ) |
| `K6:age-delta-identical` | identical age delta — the D5 input R2 depends on | PASS (0 pairs differ) |

**6/6 PASS.** The harness reproduces a discovery basis exactly,
so replication results are measured on the same footing as discovery.
