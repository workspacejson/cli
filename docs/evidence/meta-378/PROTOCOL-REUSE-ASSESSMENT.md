# PROTOCOL-REUSE-ASSESSMENT — META-378

**Phase 0. Reuse before inventing.**

Assesses Linear META-312 (*Preregister the random-repository co-change
validation protocol*) and META-313 (*Execute the preregistered random-repository
validation cohort*) for protocol mechanics reusable by META-378.

## Status of the source issues

Both META-312 and META-313 are in **Backlog** and have never been executed.
Neither has produced a committed protocol artifact, a repository-universe
snapshot, a seed, or a cohort. There is therefore **no frozen protocol document
to inherit** — only the rule intentions stated in their issue descriptions.

META-378 does not execute META-312 or META-313. It reuses their compatible rule
intentions and freezes the smallest dedicated protocol for the replication
question, as the META-378 contract permits when the prior protocol is
incomplete.

## Fundamental compatibility check

META-312/313 measure a **maintainer-validation** outcome: relationship validity
(confirmed / corrected / obvious / misleading / missing), usefulness, pull, and
response. Their measurement referent is *human judgement about a co-change
artifact*.

META-378's measurement referent is **observational held-out co-touch
recurrence** — whether both endpoints of a relationship later appeared together
in a qualifying subsequent changed-file set. No human is consulted and nobody is
contacted.

The sampling and preservation scaffolding transfers. The outcome layer does not,
and importing it would change the measurement referent, which the META-378
contract forbids.

## Rule-by-rule assessment

| # | META-312/313 rule | Disposition | Why |
| -- | -- | -- | -- |
| 1 | Repository universe + snapshot date | **REUSED** | Adopted directly. META-378 freezes a GitHub Search universe, records the exact query strings and a UTC snapshot timestamp, and commits the full materialized result set to `raw/universe.json` so the universe survives future API drift. |
| 2 | Eligibility based only on metadata available before co-change output | **REUSED** | Adopted directly and strengthened. Every eligibility predicate in META-378 is metadata-only (language, stars, created/pushed dates, fork/archived flags, size) plus one post-selection *mechanical* check (`git rev-list --count --first-parent`) that reads commit topology only and never touches co-change or recurrence output. |
| 3 | Inclusion and exclusion criteria | **ADAPTED** | Adopted, plus a META-378-specific exclusion that META-312 had no reason to state: the three META-375 discovery repositories are excluded by exact `full_name`. This is the anti-leak rule and it is enforced by a deterministic invariant, not by convention. |
| 4 | Sampling method + reproducible seed | **REUSED** | Adopted directly. META-378 freezes a seed string and selects by ascending `sha256(seed + ":" + full_name)` over the committed snapshot, so the cohort reproduces exactly from the recorded universe. |
| 5 | Selection preserved *before* running the miner | **REUSED** | Adopted directly and made a commit boundary: `SELECTION-RECEIPT.md` and `raw/selection.json` are committed before any mining output exists. |
| 6 | Exact miner commit/package version, not a moving branch reference | **REUSED** | Adopted directly. META-378 pins `@workspacejson/mining-core` by **git tree SHA** `1ab4f087a39f4526d49484e7260b080443d217f9`, verified byte-identical to the META-310 producer pin `031c3504a0977b8d90ac518c82a39a2f4ec741a9` that META-375 used. |
| 7 | Target revision selection rule | **ADAPTED** | META-312 needed one target revision per repository. META-378 needs a pin plus two historical bases per repository, so the rule is extended to META-375's frozen basis-resolution rule (`rev-list --first-parent <pin>`, lines 101 and 251) to keep the replication measurement-compatible with discovery. |
| 8 | Denominator preservation | **REUSED** | Adopted directly. Every selected repository and basis stays in the denominator. Bases that yield sparse or one-sided cells are reported, never dropped. |
| 9 | No replacement because output is sparse, obvious, or uninteresting | **REUSED** | Adopted directly and tightened. Replacement is permitted **only** for the mechanical pre-outcome verification failures frozen in §7 of the preregistration, drawn in frozen order from the ranked list, with every skip recorded and its mechanical reason named. No entity may be replaced after any co-change or recurrence output is visible. |
| 10 | Missing / sparse / negative result preservation | **REUSED** | Adopted directly. `NEGATIVE-SPARSE-RESULTS.md` is a required artifact; all `EMPTY` / `EMITTED_ONLY` / `OMITTED_ONLY` / `SPARSE` cells are reported. |
| 11 | Stopping rule | **ADAPTED** | META-312's stopping rule was tied to outreach response accumulation. META-378 has no outreach, so the stopping rule becomes mechanical: the cohort is fixed at selection and analysis stops when every selected basis is mined and characterized. |
| 12 | Prohibition on retrospective threshold/eligibility/classification tuning | **REUSED** | Adopted directly. Reinforced by carrying META-377's comparability threshold, age buckets, existence rule, and transaction filters verbatim rather than re-deriving them. |
| 13 | Artifact format + reproduction command | **REUSED** | Adopted as `MANIFEST.json` + `rerun.sh`. |
| 14 | Maintainer contact / outreach message design | **NOT_APPLICABLE** | META-378 contacts nobody. Explicitly forbidden by the contract. |
| 15 | Outcome taxonomy: confirmed / corrected / obvious / misleading / missing | **NOT_APPLICABLE** | This is a human-judgement taxonomy. META-378's outcome is observational co-touch recurrence. Importing it would change the measurement referent. |
| 16 | Usefulness / pull / adoption outcomes | **NOT_APPLICABLE** | Forbidden by the contract and outside the measurement referent. META-378 establishes nothing about usefulness. |
| 17 | Response / nonresponse handling ("nonresponse is never disagreement") | **NOT_APPLICABLE** | No responses are solicited. |
| 18 | Entry gate on META-311 pilot outreach being exercised | **NOT_APPLICABLE** | META-378 has no outreach dependency. |
| 19 | Screening/pilot repository exclusion | **ADAPTED** | The analogous concept in META-378 is the discovery-data exclusion (rule 3). No pilot cohort exists to exclude. |

## Summary

**REUSED: 10 · ADAPTED: 4 · NOT_APPLICABLE: 5**

The sampling, preservation, pinning, and anti-tuning scaffolding of META-312/313
is fully compatible and is adopted. Their entire outcome layer is incompatible
because it measures human judgement rather than observational recurrence, and
importing it would change META-378's measurement referent and require contacting
maintainers — both forbidden.

Because neither source issue has been executed and neither produced a committed
protocol artifact, META-378 freezes the smallest dedicated protocol sufficient
for the replication question in `PREREGISTRATION.md`, built from the reusable
rules above plus the measurement definitions carried verbatim from META-375 and
META-377.

## Disclosure

Before freezing the universe query, a **count-only** feasibility probe was run
against the GitHub Search API — one request per language stratum returning
`total_count` and no repository records. It confirmed every stratum is non-empty
(TypeScript 2,012 · Rust 775 · Clojure 48 · Go 1,408 · Python 2,358). No
repository identity was observed, and no eligibility predicate was chosen or
adjusted in response. It is disclosed here because it preceded the freeze.
