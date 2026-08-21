# PREREGISTRATION — META-378

**Frozen before any repository is selected and before any replication
recurrence result is computed.** The commit introducing this file is the freeze
point; the git history is the proof.

This is a **confirmatory** replication. Unlike META-377, which was exploratory on
a corpus whose aggregate answer was already known, META-378 fixes its acceptance
arithmetic in advance and reports whatever that arithmetic returns.

## 1. Exact question

> Do the two strongest conditional patterns discovered in META-377 —
> endpoint-existence dilution/reversal within `BOTH_CURRENT` (R1) and
> age-conditioned reversal (R2) — reproduce on unseen historical bases and/or
> unseen repositories under a preregistered protocol?

Fibery **OQ-14** owns the durable question. Linear **META-378** owns execution.

## 2. Authoritative inputs

| | |
| -- | -- |
| META-375 evidence | `workspacejson/cli@0af756a18cf376ee5b7063a98ce63deb2ad97ff4`, `docs/evidence/meta-375/` |
| META-377 evidence | `workspacejson/cli@59ca94a37b05f33d556e9fcd28bf6197648dff68`, `docs/evidence/meta-377/` |
| META-377 disposition | `MIXED_CONDITIONAL_EFFECTS` (\|C\|=94, P=64, Z=6, N=24) |

Both SHAs verified to exist remotely before this file was written.

## 3. Hard anti-leak rule

These nine repository × basis observations are **DISCOVERY DATA** and may not
contribute a numerator, denominator, sign, disposition, or confirmatory result:

```
formatjs pin / -100 / -250      (formatjs/formatjs)
syncpack pin / -100 / -250      (JamieMason/syncpack)
polylith pin / -100 / -250      (polyfy/polylith)
```

They may be read **only** to reproduce definitions, reuse scripts and
invariants, understand the prior result, and verify compatibility.

Enforcement is mechanical, not conventional:

- the three repositories are excluded from the universe by exact `full_name`;
- invariant **A1** asserts zero confirmation rows originate from any of the nine
  discovery bases;
- red test **X1** deliberately injects one discovery basis and must be caught.

## 4. Replication scope

| Label | Condition |
| -- | -- |
| `CROSS_REPOSITORY_REPLICATION` | the cohort contains repositories absent from the META-375 corpus |
| `TEMPORAL_REPLICATION_ONLY` | the cohort contains only new bases within the three prior repositories |

The universe excludes the three prior repositories by construction, so the
cohort can only be cross-repository. Should both scopes ever be present they are
preserved separately and never pooled. **Cross-repository generalization is
never claimed from temporal-only replication.**

## 5. Repository universe

**Source.** GitHub Search API, `search/repositories`, `sort=stars`,
`order=desc`, `per_page=100`, paginated to GitHub's hard 1,000-result cap.

**Strata.** Five language strata, frozen here before selection:

```
TypeScript · Rust · Clojure · Go · Python
```

TypeScript, Rust, and Clojure mirror the discovery corpus's ecosystems; Go and
Python broaden it so a cross-repository claim is not confined to the languages
the pattern was discovered in.

**Frozen query template**, `{LANG}` substituted per stratum:

```
language:{LANG} stars:800..25000 created:<2022-01-01 pushed:>2026-01-01
fork:false archived:false size:2000..250000
```

**Snapshot identity.** The full materialized result set — every repository
record returned, in API order — is committed verbatim to `raw/universe.json`
together with the exact query strings, the UTC snapshot timestamp, and per-page
result counts. **The committed snapshot, not the live API, is the universe.**
Selection reproduces from that file regardless of later API drift.

## 6. Eligibility — metadata only

A repository is eligible iff **all** hold. Every predicate is decidable from
repository metadata alone, without running the miner and without observing any
co-change or recurrence output.

| # | Predicate |
| -- | -- |
| E1 | present in the committed universe snapshot for its stratum |
| E2 | `fork == false` |
| E3 | `archived == false` and `disabled == false` |
| E4 | `default_branch` is non-empty |
| E5 | `stargazers_count` in `[800, 25000]` |
| E6 | `created_at < 2022-01-01` |
| E7 | `pushed_at > 2026-01-01` |
| E8 | `size` in `[2000, 250000]` (KB) |
| E9 | **`full_name` is not one of `formatjs/formatjs`, `JamieMason/syncpack`, `polyfy/polylith`** (anti-leak) |

E2–E8 are re-verified from the snapshot record rather than trusted from the
query, so the eligibility filter is auditable offline.

## 7. Post-selection mechanical verification

Applied **after** selection and **before** any mining output exists. Reads
commit topology only; touches no co-change or recurrence output.

| # | Check |
| -- | -- |
| V1 | a full, non-shallow clone succeeds |
| V2 | the `default_branch` HEAD resolves to a commit SHA |
| V3 | `git rev-list --count --first-parent <pin> >= 751` |

**V3 rationale.** The `-250` basis is the 251st first-parent commit from the
pin, and the miner's window is 500 first-parent transitions. A satisfiable
500-transition window at that basis therefore requires at least
`250 + 500 + 1 = 751` first-parent commits. This is a mechanical feasibility
bound, fixed here before selection.

**Backfill rule.** A selected repository failing V1–V3 is recorded as
`INELIGIBLE_ON_VERIFICATION` with its failing check, remains visible in the
selection receipt, and is replaced by the next repository in the **already
frozen** ranked order for that stratum. Because the order is fixed by §8 before
any output exists, backfill cannot be steered.

**No entity may be replaced for any other reason, and none may be replaced after
any co-change or recurrence output is visible** — including because a result is
sparse, negative, obvious, or inconvenient.

## 8. Sampling method, seed, cohort size, stopping rule

**Seed**, frozen:

```
META-378/OQ-14/replication/v1
```

**Rule.** Within each stratum, order eligible repositories ascending by

```
sha256(SEED + ":" + full_name)   (lowercase hex, lexical ascending)
```

and take the first repository passing §7 verification, backfilling down that
frozen order on mechanical failure.

The ordering depends only on the seed and the repository name, so it is fixed
before any repository property beyond eligibility is consulted, and it is
reproducible from the committed snapshot alone.

**Cohort size.** Exactly **one repository per stratum — five repositories.**
Each contributes three bases (§10): a pin plus two historical bases. Pin bases
carry an empty held-out window by definition and contribute zero recurrence
observations, so the cohort yields **10 recurrence-contributing bases** against
the six in discovery.

**Stopping rule.** The cohort is fixed at selection. Analysis stops when every
selected basis has been mined and characterized. No repository, basis, stratum,
threshold, or bucket may be added, removed, substituted, or retuned afterwards.

**Never** select a repository because its co-change structure is already known
to be interesting. Nothing beyond §6 metadata and §7 topology is consulted.

## 9. Miner and producer identity

| | |
| -- | -- |
| Package | `@workspacejson/mining-core` |
| Pinned by | git tree SHA `1ab4f087a39f4526d49484e7260b080443d217f9` |
| Compatibility | **byte-identical** to the tree at META-310 producer pin `031c3504a0977b8d90ac518c82a39a2f4ec741a9`, which META-375 used (`git diff` over `packages/mining-core` between that pin and this branch is empty) |
| Pipeline | `mine(repoRoot)` → `score(observations)` → `select(scored, { minSupport: 3 })` |
| History window | **500 first-parent transitions** (`DEFAULT_WINDOW_TRANSITIONS`), the META-375 window. No mechanical incompatibility was identified. |
| Qualification | `support >= 3` |

Invariant **A4** asserts the tree SHA at run time.

## 10. Basis selection

Per repository, carried verbatim from META-375's frozen rule:

| Basis | Rule |
| -- | -- |
| `<repo>-pin` | `default_branch` HEAD at the universe snapshot, recorded as an exact SHA |
| `<repo>-b100` | `git rev-list --first-parent <pin> \| sed -n '101p'` |
| `<repo>-b250` | `git rev-list --first-parent <pin> \| sed -n '251p'` |

The pin is frozen at snapshot time and never re-resolved against moving upstream
state.

## 11. Emitted / omitted definition

Current global projection, unchanged:

```
rank by  support DESC,
         occurrences ASC,
         compareUtf8(files[0]),
         compareUtf8(files[1])
cap = 50
```

`emitted` = rank ≤ 50. `omitted` = every other qualifying relationship. The cap,
the ranking, and the qualification threshold are **not** modified, tuned, or
rescued.

## 12. Endpoint existence (D4)

Carried verbatim from META-375/377. A path exists at a basis iff it is present in
that basis's tree listing. Exactly three states:

```
BOTH_CURRENT   existsA && existsB
ONE_ABSENT     existsA !== existsB
BOTH_ABSENT    !existsA && !existsB
```

R1's primary state is **`BOTH_CURRENT`**.

## 13. Age buckets (D5)

Age is `mostRecentSupport.deltaPos` — the producer's Δpos convention over scored
first-parent transitions, 0 = newest. Buckets carried verbatim, **exactly**:

```
0-24     25-99     100-249     250-499
```

**No rebucketing, before or after outcomes.** A `none` state is retained in the
schema for a relationship with no most-recent-support record and is reported if
populated. No decay function is inferred, no recency weighting is added, and no
age-normalized support score is created.

## 14. Held-out window and transaction filters

**Window.** `(basis, pin]`, first-parent. A pin basis has an empty window **by
definition** and contributes exactly zero recurrence observations.

**Transaction classification**, carried verbatim from META-375's
`characterize.mjs` (subject lowercased):

```
mergeOnFirstParent   parents.length > 1
bulk                 files.length > 50
release              /^(chore\(release\)|release[:(]|chore: release)/ ||
                     /^v?\d+\.\d+\.\d+/ ||
                     (/^chore/ && /\brelease\b/)
revert               /^revert/
dependency           /^(chore|fix|build)\(deps(-dev)?\)/ ||
                     /^(chore|build): (update|bump) / ||
                     /\b(bump|update)\b.*\b(to v?\d|dependency|dependencies|lockfile)\b/
```

| Filter | Definition | Role |
| -- | -- | -- |
| **`overlapUsable`** | transaction is none of merge / bulk / release / revert / dependency | **PRIMARY** |
| `overlapAll` | transaction is non-merge | **SECONDARY sensitivity only** |

`overlapUsable` is primary because it is the measure behind META-375's headline
6/6 and META-377's primary disposition. **`overlapAll` is never substituted for
the primary**, including if it looks cleaner. META-377 showed the choice can flip
the disposition; META-378 measures whether that sensitivity itself persists out
of sample.

The two filters are computed on separate keys and an invariant asserts they are
never conflated.

## 15. Comparability threshold

META-377's threshold, adopted unchanged for direct comparability:

```
COMPARABLE  iff  emitted N >= 10  AND  omitted N >= 10
```

Cell classification:

| Class | Rule |
| -- | -- |
| `EMPTY` | emitted N == 0 and omitted N == 0 |
| `EMITTED_ONLY` | emitted N > 0, omitted N == 0 |
| `OMITTED_ONLY` | emitted N == 0, omitted N > 0 |
| `SPARSE` | both > 0 but below the threshold |
| `COMPARABLE` | emitted N ≥ 10 and omitted N ≥ 10 |

**All non-empty cells are reported.** Sparse cells are never deleted and never
pooled opportunistically — not across strata, bases, repositories, or buckets.
**The threshold is not relaxed after seeing sparse results.** If it yields
insufficient support, the frozen answer is `INDETERMINATE`, which is a valid
result.

## 16. R1 confirmatory rule — endpoint existence

Restricted to bases with a **COMPARABLE** `BOTH_CURRENT` cell.

For each such basis:

```
d_cond   = emittedRate(BOTH_CURRENT) − omittedRate(BOTH_CURRENT)
d_uncond = emittedRate(all)          − omittedRate(all)

REVERSAL    iff d_cond < 0
ATTENUATION iff d_cond < d_uncond
```

`d_uncond` is reported at every basis alongside `d_cond` so endpoint-liveness
attenuation is **observed rather than inferred**.

Let `K` = bases with a comparable `BOTH_CURRENT` cell, `Rv` = reversals,
`At` = attenuations. Evaluated **in order**:

1. **`R1_INDETERMINATE`** if `K < 4`.
2. **`R1_REPLICATED`** if `Rv/K >= 1/3` **and** `At/K >= 1/2`.
3. **`R1_NOT_REPLICATED`** if `Rv == 0` **and** `At/K < 1/2`.
4. **`R1_INDETERMINATE`** otherwise.

**Bar provenance, stated before outcomes.** Discovery observed reversal at
2 of 6 comparable bases (`syncpack-b100`, `syncpack-b250`) — a rate of 1/3. The
replication bar is set at that discovered rate, not above it, and attenuation
must additionally be the majority phenomenon. Setting a confirmatory bar from the
discovery effect size is the intended design; it is named here so it cannot be
mistaken for a threshold chosen after seeing replication results.

**The rule deliberately does not require every repository to move the same way.**
Discovery itself was heterogeneous — 2 of 6 bases reversed while 4 survived — so
demanding uniformity would test a pattern that was never claimed.

Branches 2 and 3 are mutually exclusive (branch 2 requires `Rv > 0`, branch 3
requires `Rv == 0`); branch 4 is exhaustive.

## 17. R2 confirmatory rule — age

Over all **COMPARABLE** cells of (age bucket × eligible held-out basis). Let
`C2` = comparable age cells, and `P2` / `Z2` / `N2` = cells with
`d > 0` / `d == 0` / `d < 0` where `d = emittedRate − omittedRate`.

Evaluated **in order**:

1. **`R2_INDETERMINATE`** if `C2 < 8`.
2. **`R2_REPLICATED`** if `N2 >= P2`.
3. **`R2_NOT_REPLICATED`** if `P2 / C2 >= 2/3`.
4. **`R2_INDETERMINATE`** otherwise.

**Bar provenance, stated before outcomes.** Discovery found D5 net negative:
5 positive, 1 tie, 7 negative across 13 comparable cells. The confirmatory claim
under test is that *the emitted advantage continues to disappear or reverse
within like-aged strata*, so the bar is reversals at least matching survivals.
`C2 < 8` guards against deciding on thinner support than discovery's 13 cells.
Branch 3 is the clear opposite outcome — the advantage reproducing positively in
a supermajority of age strata.

Branches 2 and 3 are mutually exclusive (`N2 >= P2` implies `P2/C2 <= 1/2`);
branch 4 is exhaustive.

## 18. Overall composite disposition

Determined mechanically from the two component dispositions:

| Composite | Condition |
| -- | -- |
| `BOTH_PATTERNS_REPLICATE` | `R1_REPLICATED` and `R2_REPLICATED` |
| `ENDPOINT_ONLY_REPLICATES` | `R1_REPLICATED` and `R2_NOT_REPLICATED` |
| `AGE_ONLY_REPLICATES` | `R2_REPLICATED` and `R1_NOT_REPLICATED` |
| `NEITHER_PATTERN_REPLICATES` | `R1_NOT_REPLICATED` and `R2_NOT_REPLICATED` |
| `INSUFFICIENT_REPLICATION_SUPPORT` | either component is `INDETERMINATE` |

Exhaustive over the nine component combinations. No other composite may be
introduced, and no favourable interpretation may be invented after results.

## 19. Secondary transaction-filter sensitivity

After **all** primary `overlapUsable` results are computed and committed, the
identical cohort, bases, grouping, thresholds, and disposition rules are re-run
under `overlapAll`. Reported separately:

- is the direction unchanged;
- does the magnitude change materially;
- does the R1 disposition change;
- does the R2 disposition change;
- does the overall composite change.

This is **secondary**. It never replaces the primary.

## 20. Outcome isolation

Selection, mining, characterization, and the denominator audit run in **Phase A**
and must not read the held-out recurrence outcome. Phase A data structures carry
no `overlapUsable` / `overlapAll` keys, and an assertion fails the run if they
appear. **Phase B** is the only stage permitted to read the outcome.

The selected cohort, the bases, and the denominator audit are **committed before
Phase B runs**.

## 21. Scope restriction — R1 and R2 only

META-378 is confirmatory for **R1 and R2 only**. It does **not** promote,
confirm, or test:

- exposure classes E1–E5;
- persistence effects;
- role-pair effects;
- joint views J1 / J2 / J3;
- repository-specific FormatJS / Polylith patterns.

Nothing outside R1 and R2 receives a disposition. META-378 is not another
exploratory search.

## 22. Interpretation boundary

Even a fully successful replication establishes only:

> historical same-transaction observations show a reproducible conditional
> pattern in later observational co-touch recurrence.

It establishes **nothing** about dependency, causality, semantic coupling,
required companion edits, impact, blast radius, risk, correctness, agent planning
value, or any reason the standard should tell an agent what to do.

No workspace.json schema change, producer change, ranking change, cap change,
threshold change, bucket change, or transaction-filter change is authorized by
this issue. **META-376 is not executed and remains blocked.**

## 23. Deviation policy

Any departure from this plan is recorded verbatim in `RECEIPT.md` with its
reason, and every affected result is marked. Silent revision is a stop condition.
