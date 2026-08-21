# REPORT — META-375 prospective co-change projection characterization

**Date:** 2026-08-21. **Freeze:** `PREREGISTRATION.md` committed at
`8ae661ec24b6539c19a5237dcd232644d7490cfd` before any characterization result
was computed. **Controls and checks:** `RECEIPT.md`. **Raw per-relationship
records:** `runs/<label>.characterization.json`; full qualifying populations:
`runs/<label>.dump.json`; aggregates: `runs/aggregate.json`.

## Exact question

> Across preregistered repositories and historical bases, what fraction and
> kinds of qualifying historical relationships survive the current
> workspace.json projection at decision time, and what does the global top-N
> projection systematically omit or stale out?

No model was run. Nothing below is a statement about agent utility, impact,
risk, correctness, or actionability.

## Cohort

3 repositories (exactly the META-310 public corpus) × 3 bases (pin, −100,
−250 first-parent transitions) = 9 bases. All selections frozen before mining.

| Basis | Qualifying | Emitted | Omitted | Omitted % | Extracted | Truncated |
| -- | --: | --: | --: | --: | --: | -- |
| syncpack-pin | 729 | 50 | 679 | 93.1% | 500 | yes |
| syncpack-b100 | 568 | 50 | 518 | 91.2% | 500 | yes |
| syncpack-b250 | 784 | 50 | 734 | 93.6% | 500 | yes |
| formatjs-pin | 713 | 50 | 663 | 93.0% | 500 | yes |
| formatjs-b100 | 1,242 | 50 | 1,192 | 96.0% | 500 | yes |
| formatjs-b250 | 1,776 | 50 | 1,726 | 97.2% | 500 | yes |
| polylith-pin | 1,658 | 50 | 1,608 | 97.0% | 394 | no |
| polylith-b100 | 1,406 | 50 | 1,356 | 96.4% | 294 | no |
| polylith-b250 | 327 | 50 | 277 | 84.7% | 144 | no |

**The cap is the binding constraint at every basis.** The projection emits 50
of a qualifying population that ranges from 327 to 1,776; it omits between
84.7% and 97.2% of qualifying relationships.

## Survival: do emitted relationships exist at decision time?

Endpoint existence at the basis tree (`git ls-tree`, exact path identity):

| Basis | Both current | One absent | Both absent |
| -- | -- | -- | -- |
| syncpack-pin | 443/729 (60.8%) | 164/729 (22.5%) | 122/729 (16.7%) |
| syncpack-b100 | 152/568 (26.8%) | 95/568 (16.7%) | 321/568 (56.5%) |
| syncpack-b250 | 94/784 (12.0%) | 65/784 (8.3%) | 625/784 (79.7%) |
| formatjs-pin | 710/713 (99.6%) | 3/713 (0.4%) | 0/713 (0.0%) |
| formatjs-b100 | 1,111/1,242 (89.5%) | 88/1,242 (7.1%) | 43/1,242 (3.5%) |
| formatjs-b250 | 1,421/1,776 (80.0%) | 113/1,776 (6.4%) | 242/1,776 (13.6%) |
| polylith-pin | 1,013/1,658 (61.1%) | 480/1,658 (29.0%) | 165/1,658 (10.0%) |
| polylith-b100 | 805/1,406 (57.3%) | 442/1,406 (31.4%) | 159/1,406 (11.3%) |
| polylith-b250 | 245/327 (74.9%) | 54/327 (16.5%) | 28/327 (8.6%) |

The qualifying *population* goes stale as the basis recedes — at
syncpack-b250, 79.7% of qualifying relationships have both endpoints absent
from the basis tree. Existence filtering is entirely the frozen producer's
behavior (ranking by support); nothing in the projection deletes dead pairs.

## What the global top-50 emits vs omits

### Endpoint roles (emitted, top classes)

| Basis | Emitted composition (top) |
| -- | -- |
| syncpack-pin | source↔source 27, manifest-lock↔manifest-lock 12, docs↔manifest-lock 5, source↔test 5 |
| syncpack-b100 | source↔source 23, manifest-lock↔manifest-lock 10, source↔test 6 |
| syncpack-b250 | source↔source 31, manifest-lock↔manifest-lock 10, docs↔manifest-lock 5 |
| formatjs-pin | manifest-lock↔manifest-lock 33, manifest-lock↔tooling-ci 7 |
| formatjs-b100 | tooling-ci↔tooling-ci 38, manifest-lock↔manifest-lock 8 |
| formatjs-b250 | tooling-ci↔tooling-ci 46, manifest-lock↔manifest-lock 4 |
| polylith-pin | docs↔source 13, docs↔docs 12, UNKNOWN↔docs 10 |
| polylith-b100 | docs↔source 15, docs↔docs 8, UNKNOWN↔docs 6 |
| polylith-b250 | source↔source 18, docs↔source 11, source↔test 4 |

The emitted slice's composition is repository-specific and shifts as the basis
moves (formatjs drifts from manifest-lock pairs toward tooling-ci pairs;
syncpack stays source-heavy throughout). UNKNOWN is preserved, never coerced
(polylith carries UNKNOWN endpoints because `.edn`, `.bb`, and shell paths
match no preregistered role).

### Age of most recent supporting observation (transitions before basis)

Emitted share in the freshest bucket (Δpos 0–24) exceeds the omitted share at
**every** basis:

| Basis | Emitted 0–24 | Omitted 0–24 | Omitted 250–499 |
| -- | -- | -- | -- |
| syncpack-pin | 26/50 (52%) | 34/679 (5.0%) | 149/679 (21.9%) |
| syncpack-b100 | 28/50 (56%) | 120/518 (23.2%) | 320/518 (61.8%) |
| syncpack-b250 | 20/50 (40%) | 17/734 (2.3%) | 505/734 (68.8%) |
| formatjs-pin | 26/50 (52%) | 34/663 (5.1%) | 149/663 (22.5%) |
| formatjs-b100 | 10/50 (20%) | 76/1,192 (6.4%) | 642/1,192 (53.9%) |
| formatjs-b250 | 4/50 (8%) | 300/1,726 (17.4%) | 530/1,726 (30.7%) |
| polylith-pin | 33/50 (66%) | 113/1,608 (7.0%) | 233/1,608 (14.5%) |
| polylith-b100 | 26/50 (52%) | 618/1,356 (45.6%) | 126/1,356 (9.3%) |
| polylith-b250 | 27/50 (54%) | 96/277 (34.7%) | 0/277 |

**Named exception:** formatjs-b250, where the emitted 50 are concentrated in
Δpos 100–249 (46/50) — an old tooling-configuration cluster — while the
omitted tail holds more 0–24 relationships (300) than the emitted list does
(4). Recency skew favors the emitted list everywhere else.

### Persistence across subwindows (X of eligible 100-transition subwindows)

Eligible subwindows: 5 (all 500-transition bases), 4 (polylith-pin), 3
(polylith-b100), 2 (polylith-b250). Full distributions in `runs/aggregate.json`
(`perBasis.<label>.persistence`). Emitted relationships persist at least as
broadly as omitted ones; e.g. syncpack-pin emitted: 2/5×18, 3/5×18, 4/5×6,
5/5×8 (no emitted pair appears in only one subwindow); omitted: 1/5×32,
2/5×221, 3/5×371, 4/5×37, 5/5×2.

### Current-tree mechanical exposure

"No preregistered exposure class" (recorded state, never
undiscoverability proof):

| Basis | Emitted none | Omitted none |
| -- | -- | -- |
| syncpack-pin | 1/50 | 184/679 (27.1%) |
| syncpack-b100 | 5/50 | 186/518 (35.9%) |
| syncpack-b250 | 13/50 | 437/734 (59.5%) |
| formatjs-pin | 2/50 | 35/663 (5.3%) |
| formatjs-b100 | 1/50 | 84/1,192 (7.0%) |
| formatjs-b250 | 0/50 | 100/1,726 (5.8%) |
| polylith-pin | 16/50 | 581/1,608 (36.1%) |
| polylith-b100 | 23/50 | 528/1,356 (38.9%) |
| polylith-b250 | 14/50 | 86/277 (31.0%) |

Per-class matched/unknown counts for both groups are in
`runs/aggregate.json` (`perBasis.<label>.exposure`); exposure UNKNOWNs are
exactly the endpoint-absence cases (verified per basis in `RECEIPT.md`).

## Held-out overlap (observational)

Transactions over (basis, pin], per the frozen META-373 transaction-unit rule
(fallback: each first-parent commit), classification regexes carried verbatim
from META-374. "Usable" = non-merge, non-bulk, non-release, non-revert,
non-dependency. Pin bases have 0 held-out transactions by definition.

| Basis | Tx total | Bulk | Release | Revert | Dep | Usable |
| -- | --: | --: | --: | --: | --: | --: |
| syncpack-b100 | 100 | 3 | 12 | 0 | 15 | 70 |
| syncpack-b250 | 250 | 5 | 35 | 0 | 37 | 173 |
| formatjs-b100 | 100 | 2 | 7 | 0 | 71 | 22 |
| formatjs-b250 | 250 | 10 | 19 | 0 | 168 | 61 |
| polylith-b100 | 100 | 4 | 21 | 0 | 5 | 72 |
| polylith-b250 | 250 | 27 | 24 | 4 | 6 | 193 |

Overlap = a later transaction touched both endpoints. Rates, usable
transactions (all-transaction rates in `runs/aggregate.json`):

| Basis | Emitted overlap | Omitted overlap |
| -- | -- | -- |
| syncpack-b100 | 16/50 (32.0%) | 94/518 (18.1%) |
| syncpack-b250 | 9/50 (18.0%) | 56/734 (7.6%) |
| formatjs-b100 | 6/50 (12.0%) | 9/1,192 (0.8%) |
| formatjs-b250 | 4/50 (8.0%) | 55/1,726 (3.2%) |
| polylith-b100 | 22/50 (44.0%) | 154/1,356 (11.4%) |
| polylith-b250 | 19/50 (38.0%) | 71/277 (25.6%) |

Emitted relationships overlap the held-out observed changed-file sets at a
higher rate than omitted ones at **all six** bases with held-out data. This is
an agreement measurement over what later transactions happened to touch —
never a claim that the omitted endpoints were required, impacted, or correct.

Note: formatjs usable denominators are thin (22/100, 61/250) because 71–168 of
its post-basis transactions are dependency bumps; formatjs-b250's
all-transaction overlap (emitted 50/50, omitted 1,051/1,726) is dominated by
that traffic and is reported separately, not pooled.

## File-centric availability (META-323 targets)

| Basis | Target | State | Partners | In top-50 | Omitted |
| -- | -- | -- | --: | --: | --: |
| syncpack-pin | src/commands/lint.rs | present | 18 | 4 | 14 |
| syncpack-pin | src/instance.rs | present | 34 | 3 | 31 |
| syncpack-pin | src/context.rs | present | 52 | 9 | 43 |
| syncpack-b100 | lint.rs | present | 4 | 0 | 4 |
| syncpack-b100 | instance.rs | **absent at basis** | — | — | — |
| syncpack-b100 | context.rs | present | 25 | 9 | 16 |
| syncpack-b250 | lint.rs | present, zero partners | 0 | 0 | 0 |
| syncpack-b250 | instance.rs | present | 17 | 4 | 13 |
| syncpack-b250 | context.rs | present | 16 | 2 | 14 |
| formatjs (all 3) | packages/cli-lib/extract.ts | present, **zero partners** | 0 | 0 | 0 |
| polylith-pin | command/core.clj | present | 51 | 1 | 50 |
| polylith-b100 | command/core.clj | present | 51 | 3 | 48 |
| polylith-b250 | command/core.clj | present | 32 | 5 | 27 |

For the syncpack and polylith targets, the qualifying population reachable
file-centrically is 2–10× larger than what the global top-50 emits for those
files, at every basis where partners exist. For the formatjs target, the
mined population itself contains zero qualifying relationships at all three
bases — a population gap, not a cap omission, and consistent with META-323's
preserved 0-vs-0 negative.

## Hypotheses

- **H1 (emitted skews toward trivial structure classes vs omitted): NOT
  SUPPORTED as stated.** The emitted slice has *fewer* no-exposure
  relationships than the omitted tail at 8/9 bases (1–26% vs 5–60%), i.e. the
  emitted list is more explainable by the frozen exposure classes, not less.
  What varies is composition (role classes), which is repository-specific.
- **H2 (omitted are disproportionately stale): SUPPORTED.** Omitted share in
  Δpos 250–499 reaches 68.8% (syncpack-b250) and 53.9% (formatjs-b100);
  emitted share in 0–24 exceeds omitted at every basis.
- **H3 (the top-50 projects recently concentrated history): SUPPORTED with one
  named exception.** Holds at 8/9 bases; formatjs-b250 emits a Δpos 100–249
  tooling-config cluster (46/50) while fresher relationships sit in the
  omitted tail.
- **H4 (file-centric finds qualifying relationships the global list omits):
  SUPPORTED for syncpack and polylith targets; VACUOUS for formatjs** (zero
  qualifying partners at all three bases).
- **H5 (some registered pairs reference endpoints absent at the basis):
  SUPPORTED, strongly repo-dependent.** 0/713 (formatjs-pin) to 625/784
  (syncpack-b250); polylith carries 8.6–11.3% both-absent plus 16.5–31.4%
  one-absent at every basis.
- **H6 (persistent relationships whose endpoints no longer exist): SUPPORTED.**
  syncpack-b250: 415/487 persistent relationships have an absent endpoint;
  polylith-pin: 213/808; polylith-b100: 197/469; syncpack-pin: 247/516.

## Known unknowns and limits

- Threshold sensitivity was not explored (frozen per the prior-art check);
  minSupport 3 and cap 50 bound every number here.
- polylith's window is truncated (394/294/144 transitions); its persistence
  denominators are 4/3/2 subwindows.
- Roles are path-based with a content check only for the generated class;
  UNKNOWN is a large real category in polylith (reported, not coerced).
- The static-edge exposure class uses the verbatim META-374 token heuristic
  (basename stem + parent module name); it is intentionally crude.
- Age is in first-parent transitions, not wall-clock days; commit-time
  non-uniformity is not corrected.
- Renames are not stitched across identity changes; a renamed path is absent
  at later bases by construction.
- Held-out usable denominators are thin for formatjs (22–61 transactions).
- One repository per "family"; no generality claim beyond this cohort.
- syncpack-b100 doubles as META-374's T0′ control (reproduced exactly), so its
  numbers are partially anticipated by that work.

## Disposition

**MIXED_BY_REPOSITORY_OR_BASIS.** Named conditional pattern:

1. The cap is the binding constraint at every basis (84.7–97.2% of the
   qualifying population omitted).
2. What the top-50 emits is systematically the fresher and more
   subsequently-reconfirmed slice: emitted relationships beat the omitted tail
   on recency at every basis and on held-out overlap at all six bases with
   held-out data.
3. What it omits is dominated by stale or dead-endpoint relationships (H2,
   H5, H6) plus a large classable tail that simply lost the support ranking.
4. The formatjs family behaves differently: renovate-saturated history leaves
   thin usable held-out denominators, one basis (formatjs-b250) emits a stale
   tooling-config cluster, and the META-323 target has zero qualifying
   partners at every basis — a population gap the projection cannot fix.

Under the frozen decision rule, this supports the successor agent test for
syncpack/polylith-like histories and confirms a projection-limitation pattern
for formatjs-like ones. No projection fix is made in this issue; META-376 is
not executed.
