# SELECTION-RECEIPT — META-380

**Committed before any evaluation transaction outcome existed.**

**Seed:** `META-380/OQ-15/source-test-coupdate-replication/v1`

**Ordering rule:** ascending sha256(SEED + ":" + full_name), lowercase hex, lexical

The order depends only on the seed and the repository name, so it was fixed
before any repository property beyond §5.2 eligibility was consulted, and it
is reproducible from the committed snapshot alone. Because the order was
frozen before any clone existed, the §5.4 backfill **cannot be steered**.

## Selected cohort — exactly five TypeScript repositories

| # | Repository | Rank taken | First-parent commits | Pin | Source files @ pin | Test files @ pin | tsconfig.json count |
| --: | -- | --: | --: | -- | --: | --: | --: |
| 1 | `glideapps/quicktype` | 3 | 1,637 | `10cdaef27353` | 225 | 65 | 10 |
| 2 | `solidjs/solid-start` | 4 | 1,771 | `22f07b8bbeeb` | 162 | 92 | 10 |
| 3 | `tinymce/tinymce` | 5 | 8,862 | `9c1ee77ca039` | 2,360 | 1,591 | 24 |
| 4 | `tutao/tutanota` | 9 | 10,653 | `0f34397ae95d` | 1,541 | 342 | 3 |
| 5 | `refined-github/refined-github` | 11 | 4,886 | `cc22fe3434b0` | 306 | 31 | 1 |

**Five previously unseen TypeScript repositories. None is a META-289 cohort
repository, a META-375 discovery repository, a META-378 cohort repository, or
owned by `workspacejson`.**

## Full pin SHAs

| # | Repository | Pin SHA |
| -- | -- | -- |
| 1 | `glideapps/quicktype` | `10cdaef273530caef2fdf9afdc07cdd0d1f9cae7` |
| 2 | `solidjs/solid-start` | `22f07b8bbeeb17b52660d32be0132acc9841e8ad` |
| 3 | `tinymce/tinymce` | `9c1ee77ca0398837538115afa39e960e1a25c122` |
| 4 | `tutao/tutanota` | `0f34397ae95db354b707ab963bec84cdcbd8f5b6` |
| 5 | `refined-github/refined-github` | `cc22fe3434b082a982da1efcfbd4f14b4518c747` |

## Verification attempts and backfill (PREREGISTRATION §5.4)

Every attempt is recorded, including every skip and its mechanical reason.
Backfill fired **only** for V1-V7 failures — never because a result was sparse,
negative, obvious or inconvenient. **No source-test outcome existed when any
of these decisions was made.**

| Rank | Repository | Outcome | Mechanical detail |
| --: | -- | -- | -- |
| 1 | `rejetto/hfs` | `INELIGIBLE_ON_VERIFICATION` (V5) | test files at pin < 30 |
| 2 | `shfshanyue/Daily-Question` | `INELIGIBLE_ON_VERIFICATION` (V3) | first-parent commits < 1500 |
| 3 | `glideapps/quicktype` | **SELECTED** | fp=1,637 src=225 test=65 tsconfig=10 scan=200 |
| 4 | `solidjs/solid-start` | **SELECTED** | fp=1,771 src=162 test=92 tsconfig=10 scan=200 |
| 5 | `tinymce/tinymce` | **SELECTED** | fp=8,862 src=2,360 test=1,591 tsconfig=24 scan=200 |
| 6 | `steveukx/git-js` | `INELIGIBLE_ON_VERIFICATION` (V3) | first-parent commits < 1500 |
| 7 | `lyswhut/lx-music-mobile` | `INELIGIBLE_ON_VERIFICATION` (V3) | first-parent commits < 1500 |
| 8 | `callstack/react-native-testing-library` | `INELIGIBLE_ON_VERIFICATION` (V3) | first-parent commits < 1500 |
| 9 | `tutao/tutanota` | **SELECTED** | fp=10,653 src=1,541 test=342 tsconfig=3 scan=200 |
| 10 | `ytmdesktop/ytmdesktop` | `INELIGIBLE_ON_VERIFICATION` (V3) | first-parent commits < 1500 |
| 11 | `refined-github/refined-github` | **SELECTED** | fp=4,886 src=306 test=31 tsconfig=1 scan=200 |

## Integrity

| File | sha256 |
| -- | -- |
| `raw/ranked-order.json` | `efd816e171244accfeb9f05f730d499172cab936e01ce60e18933ecf1a1779c0` |
| `raw/cohort.json` | `819e472dee866b5b5652e70e899749a0ed30b3cc67c49b0e114f3091a1072c4d` |
