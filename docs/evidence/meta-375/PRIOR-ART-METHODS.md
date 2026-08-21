# PRIOR-ART-METHODS — META-375 bounded methodology check

**Date:** 2026-08-21. **Scope:** methodology alignment only. This is not a
literature review. No published performance number from any source below is
imported as evidence about workspace.json, and none appears in any META-375
result table.

## Attribution discipline (per execution ruling)

A paper is cited as informing a measurement choice **only where source text
supporting that specific point was actually inspected**. Inspection method for
all four entries: verbatim passages from the papers surfaced through
bibliographic search results (publisher pages, author-mirrored PDFs, dblp/ACM
records), retrieved 2026-08-21. A direct full-text fetch of the Zimmermann TSE
2005 PDF returned undecodable binary in this environment, so **no full text of
any paper was inspected**; attribution is limited to the inspected passages
quoted in search results, and each entry says exactly which passages those were.

Where a META-375 protocol choice has no inspected-text backing, it is declared
**internally preregistered** — it stands on the frozen META-373/META-374
protocols and the requirements of this experiment, and needs no literature
citation to be valid.

## Sources actually used

### 1. Zimmermann, Weißgerber, Diehl, Zeller — "Mining Version Histories to Guide Software Changes"

IEEE Transactions on Software Engineering 31(6), pp. 429-445, June 2005.
DOI `10.1109/TSE.2005.72`.

**Status: PARTIALLY_INSPECTED.** Inspected: abstract, section-3 ROSE
description passages, and evaluation-summary passages quoted verbatim in
search results. Not inspected: full text, including the precise evaluation
protocol.

**Informs, from inspected text:**

- The mining unit: association-rule mining over items changed together in
  version-archive transactions ("Programmers who changed these functions also
  changed..."). Supports META-375's use of one commit's changed-file set as
  the transaction unit — which is in any case already frozen by the META-310
  producer contract.
- The support/confidence vocabulary for co-change observations. META-375 uses
  the producer's frozen counts (`support`, `occurrences`); confidence is not
  computed.
- The claim that history-derived coupling can be "undetectable by program
  analysis". This motivates measuring current-tree mechanical exposure as a
  **separate** state (state 5 of the six-state distinction in META-375),
  never conflated with the historical observation itself.

**Explicitly not taken from it:** the evaluation protocol details (not
inspected) and the reported top-3 suggestion accuracy (>70% over eight OSS
projects). Neither informs any META-375 protocol decision or expectation.

### 2. Gall, Hajek, Jazayeri — "Detection of Logical Coupling Based on Product Release History"

ICSM 1998, pp. 190-197. DOI `10.1109/ICSM.1998.738508`.

**Status: PARTIALLY_INSPECTED.** Inspected: abstract and CSA/CRA
process-description passages quoted verbatim from an author-mirrored PDF.

**Informs, from inspected text:**

- Logical coupling is computable from release/change history alone, at module
  granularity, without code-level dependency data ("dependencies not evident
  in the source code"). Supports treating the historical observation (state 1)
  and current-tree structure (state 5) as distinct, separately measured
  properties.

**Not taken:** their release-sequence pattern machinery (CSA/CRA) — META-375
does not adopt it.

### 3. D'Ambros, Lanza, Robbes — "On the Relationship Between Change Coupling and Software Defects"

WCRE 2009, pp. 135-144. DOI `10.1109/WCRE.2009.19`.

**Status: PARTIALLY_INSPECTED.** Inspected: abstract and results-section
passages quoted verbatim, including the description of coupling measures
(NOCC, SOC, EWSOC, LWSOC) and the threshold parameter `n` over which reported
correlations are plotted.

**Informs, from inspected text:**

- Reported change-coupling results vary with the support threshold chosen.
  This is treated as a **confounder convention**: META-375 freezes `minSupport
  3` and all thresholds before any result is computed, and does not tune them
  afterward. Threshold sensitivity is recorded as a standing limit, not
  explored.

**Not taken:** any defect-correlation finding. META-375 measures projection
behavior, not defects.

### 4. Kagdi, Yusuf, Maletic — "Mining Sequences of Changed-files from Version Histories"

MSR 2006, pp. 47-53. DOI `10.1145/1137983.1137996`.

**Status: PARTIALLY_INSPECTED.** Inspected: abstract and methodology passages
quoted verbatim, including "log-entries consisting of more than ten files were
pruned ... to discard noisy change-sets" and the exclusion of single-event
transactions.

**Informs, from inspected text:**

- Pruning very large change-sets before mining is an established convention.
  META-375 therefore treats the producer's frozen `fileCount > 50` event
  exclusion as within convention. The exact value (50) is **internally frozen**
  by the META-310 contract (META-289 v2.2.1), not literature-derived.

**Not taken:** the sequence-mining ordering heuristics. META-375 relationships
are symmetric observations.

## Protocol choices that stand WITHOUT external authority (internally preregistered)

- **Temporal held-out rule** — carried verbatim from META-373's frozen
  transaction-unit rule as applied by META-374. No citation needed or claimed.
- **Age in first-parent transitions** (Δpos convention from the frozen
  producer) rather than wall-clock days. Commit-time non-uniformity makes
  transitions the defensible unit for this experiment; that is an internal
  decision.
- **100-transition persistence subwindows** — internal construction, frozen in
  `PREREGISTRATION.md` §11.
- **Endpoint-existence and rename/delete treatment** — internal; follows
  ADR-006 path identity and the producer's `-M50%` extraction behavior.
- **Overlap-only held-out measurement** — no precision/recall or ranking
  quality metric is computed; "observed subsequent changed-file set" overlap
  is observational. Internal decision per META-375's contract.
- **Endpoint-role taxonomy** — internal, frozen in `PREREGISTRATION.md` §9.

## Known pitfalls recorded (from the inspected sources above, applied as cautions)

- Threshold choices move results (D'Ambros et al.) → everything frozen
  pre-compute; no post-hoc tuning permitted by the stopping/no-replacement
  rules.
- Bulk change-sets pollute co-change counts (Kagdi et al.) → the frozen
  producer already excludes them; excluded commits are named, not just
  counted.
- History-derived coupling and code-visible coupling are different things
  (Zimmermann et al.; Gall et al.) → the six-state distinction in META-375 is
  maintained throughout; agreement between states is reported, never
  interpreted as causality or recommendation.
