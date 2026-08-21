# SELECTION-RECEIPT — META-289

**Committed before any evaluation transaction outcome existed.**

**Seed:** `META-289/OQ-15/source-test-coupdate/v1`

**Ordering rule:** ascending sha256(SEED + ":" + full_name), lowercase hex, lexical

The order depends only on the seed and the repository name, so it was fixed
before any repository property beyond §5.2 eligibility was consulted, and it is
reproducible from the committed snapshot alone. Because the order was frozen
before any clone existed, the §5.6 backfill **cannot be steered**.

## Selected cohort — exactly four repositories, one per stratum

| Stratum | Repository | Rank taken | First-parent commits | Pin | Source files @ pin | Test files @ pin |
| -- | -- | --: | --: | -- | --: | --: |
| Go | `flyteorg/flyte` | 9 | 2,410 | `6fadb90d65af` | 463 | 275 |
| Java | `LuckPerms/LuckPerms` | 6 | 2,266 | `9b4fe67791e8` | 969 | 84 |
| Python | `kornia/kornia` | 5 | 2,411 | `b4f5a78a1389` | 521 | 279 |
| TypeScript | `remult/remult` | 1 | 2,913 | `85bb4884ed94` | 725 | 142 |

**Four repositories with materially different testing cultures. None is a
META-375 discovery repository, a META-378 cohort repository, or owned by
`workspacejson`.**

## Full pin SHAs

| Stratum | Repository | Pin SHA | Committed |
| -- | -- | -- | -- |
| Go | `flyteorg/flyte` | `6fadb90d65af26f4db908ec1c5f5af546a3e4299` | 2026-08-21T16:44:32Z |
| Java | `LuckPerms/LuckPerms` | `9b4fe67791e899778162f18df7c8a4df0fa58c77` | 2026-08-15T20:39:06+01:00 |
| Python | `kornia/kornia` | `b4f5a78a13891c7ac4c1cd9695941380273e981d` | 2026-08-18T17:25:23+02:00 |
| TypeScript | `remult/remult` | `85bb4884ed9428248258e3b8de477c860b9bc60f` | 2026-08-18T10:55:38+03:00 |

## Verification attempts and backfill (PREREGISTRATION §5.5, §5.6)

Every attempt is recorded, including every skip and its mechanical reason.
Backfill fired **only** for V1–V6 failures — never because a result was sparse,
negative, obvious or inconvenient. **No source↔test outcome existed when any of
these decisions was made**; V4/V5/V6 read repository content and changed-file
paths only, and V6 asks solely whether a transaction changed a SOURCE file,
which is the §12 query definition rather than the outcome.

### Go

| Rank | Repository | Outcome | Mechanical detail |
| --: | -- | -- | -- |
| 1 | `nsqio/nsq` | `INELIGIBLE_ON_VERIFICATION` (V3) | first-parent commits = 1,169 < 1500 |
| 2 | `1Panel-dev/KubePi` | `INELIGIBLE_ON_VERIFICATION` (V3) | first-parent commits = 921 < 1500 |
| 3 | `SeldonIO/seldon-core` | `INELIGIBLE_ON_VERIFICATION` (V3) | first-parent commits = 1,218 < 1500 |
| 4 | `aquasecurity/tfsec` | `INELIGIBLE_ON_VERIFICATION` (V3) | first-parent commits = 1,102 < 1500 |
| 5 | `openfaas/faas` | `INELIGIBLE_ON_VERIFICATION` (V4) | source files at pin = 40 < 100 |
| 6 | `postgres-ai/database-lab-engine` | `INELIGIBLE_ON_VERIFICATION` (V3) | first-parent commits = 923 < 1500 |
| 7 | `Azure/aztfexport` | `INELIGIBLE_ON_VERIFICATION` (V3) | first-parent commits = 372 < 1500 |
| 8 | `apache/dubbo-admin` | `INELIGIBLE_ON_VERIFICATION` (V3) | first-parent commits = 563 < 1500 |
| 9 | `flyteorg/flyte` | **SELECTED** | fp=2,410 src=463 test=275 scan=200 |

### Java

| Rank | Repository | Outcome | Mechanical detail |
| --: | -- | -- | -- |
| 1 | `Skykai521/StickerCamera` | `INELIGIBLE_ON_VERIFICATION` (V3) | first-parent commits = 56 < 1500 |
| 2 | `Etar-Group/Etar-Calendar` | `INELIGIBLE_ON_VERIFICATION` (V5) | test files at pin = 14 < 30 |
| 3 | `fizzgate/fizz-gateway-node` | `INELIGIBLE_ON_VERIFICATION` (V3) | first-parent commits = 483 < 1500 |
| 4 | `docker-java/docker-java` | `INELIGIBLE_ON_VERIFICATION` (V3) | first-parent commits = 1,308 < 1500 |
| 5 | `redsolution/xabber-android` | `INELIGIBLE_ON_VERIFICATION` (V3) | first-parent commits = 1,091 < 1500 |
| 6 | `LuckPerms/LuckPerms` | **SELECTED** | fp=2,266 src=969 test=84 scan=200 |

### Python

| Rank | Repository | Outcome | Mechanical detail |
| --: | -- | -- | -- |
| 1 | `akfamily/akshare` | `INELIGIBLE_ON_VERIFICATION` (V3) | first-parent commits = 466 < 1500 |
| 2 | `amidaware/tacticalrmm` | `INELIGIBLE_ON_VERIFICATION` (V5) | test files at pin = 29 < 30 |
| 3 | `lightly-ai/lightly` | `INELIGIBLE_ON_VERIFICATION` (V3) | first-parent commits = 1,086 < 1500 |
| 4 | `layumi/Person_reID_baseline_pytorch` | `INELIGIBLE_ON_VERIFICATION` (V3) | first-parent commits = 209 < 1500 |
| 5 | `kornia/kornia` | **SELECTED** | fp=2,411 src=521 test=279 scan=200 |

### TypeScript

| Rank | Repository | Outcome | Mechanical detail |
| --: | -- | -- | -- |
| 1 | `remult/remult` | **SELECTED** | fp=2,913 src=725 test=142 scan=200 |

## Integrity

| File | sha256 |
| -- | -- |
| `raw/ranked-order.json` | `3ca59bb2e07d4748ebc678ea283b033b2de27b35194352097cedbf854349e6c7` |
| `raw/cohort.json` | `aed759cd36aba0de7ea55bbba1d754ffe5ae8b88754e638b63dbca7d215d4eb9` |
