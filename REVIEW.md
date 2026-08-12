# Review and merge policy — `workspacejson/cli`

This is the repo-owned review contract. The semantic rules the automated
reviewer applies live in [`.greptile/rules.md`](./.greptile/rules.md) and
[`.greptile/config.json`](./.greptile/config.json); this document covers what
the checks mean, what they do not mean, and what has to be true before a change
merges.

## What runs on a pull request

| Check | App | Required for merge |
| -- | -- | -- |
| `test (20)`, `test (22)` | GitHub Actions | yes |
| `Compatibility parity vs frozen source` | GitHub Actions | yes |
| `Greptile Review` | Greptile | **no**, by measured decision — see [Status](#status-of-the-greptile-gate) |
| `Sourcery review` | Sourcery | **no**, by decision — see below |
| `Socket Security` | Socket | no |

Branch protection on `main` additionally requires branches to be up to date
before merging (`strict`) and requires conversation resolution.

## Check completion is not semantic approval

A completed `Greptile Review` check means the review **ran to completion on that
commit**. It does not mean the change was approved, and a green check is not
evidence that a finding was addressed.

The two are carried by different mechanisms, and conflating them is the failure
this section exists to prevent:

* the **status check** answers "did review complete on this head?"
* **conversation resolution** answers "was every actionable finding dealt with?"

A pull request with a green Greptile check and an unresolved actionable thread
has not satisfied review. Required conversation resolution is what makes that
enforceable rather than aspirational.

## The current-head rule

Review evidence is bound to the commit it was produced on. `triggerOnUpdates` is
enabled, so a new push re-runs review against the new head, and evidence from an
earlier head does not carry forward to it.

This means:

* a review completed on an earlier commit does not satisfy the gate for a later
  one;
* `strict: true` prevents merging a branch that is behind `main`, so the head
  that was reviewed is the head that merges;
* re-requesting review after a push is not optional politeness — the previous
  result describes code that is no longer what would merge.

Do not treat a check run you can see in the PR timeline as current without
confirming its `head_sha` matches the head you intend to merge.

## Reconciling findings

Every actionable finding is reconciled **individually**, on its own thread, with
either a fix or a stated reason it does not apply.

Bulk resolution is not evidence. Resolving a batch of threads in one action
records that someone clicked resolve, not that each finding was considered, and
it is specifically not accepted as reconciliation for the rules in
`.greptile/rules.md`.

A finding may be closed as not-applicable. Say why on the thread. "Not
applicable" without a reason is indistinguishable from "not read".

## Greptile and Sourcery are different layers

They are not redundant reviewers and are not treated as interchangeable.

**Greptile** is the semantic layer. It reads the repo-owned rules in
`.greptile/`, which encode this repository's actual producer failure classes. It
found the PR #20 P1 — an explicit history refresh that could fall back to stale
preserved evidence without telling the caller — which is the concrete evidence
that CLI-specific semantic rules catch things generic review does not.

**Sourcery** is a second-review and reconciliation layer, explicitly triggered.
It is **not** a required GitHub check, and it does not become one merely because
a `Sourcery review` check run exists on recent heads. Promoting it to a hard gate
requires its own calibration evidence, on the same terms Greptile was held to.
Until that exists, it remains defense-in-depth.

The META-321 canary produced evidence on this point rather than leaving it
assumed: on the head carrying all three deliberate producer defects,
`Sourcery review` concluded **success**. That reinforces the existing
calibration instead of overturning it, so its non-required status stands.

## Status of the Greptile gate

**Calibrated 2026-08-12 (META-321, canary PR #23). `Greptile Review` is not a
required branch-protection status, and that is a decision on evidence rather
than a deferral.**

The rules work. The check status does not carry the result.

### The rules caught every positive control

Three deliberate producer defects were pushed on a disposable canary, each
mapped to one rule so attribution was unambiguous:

| Defect | Rule cited by the reviewer | Caught |
| -- | -- | -- |
| A refused history refresh made invisible to the caller | `history-refresh-refusal-observable` | yes, P1 |
| Mining default inverted so ordinary generation reads the commit graph | `ordinary-generation-never-mines` | yes, P1 |
| `compareUtf8` replaced with bare `<=` in canonical ordering | `canonical-utf8-endpoint-order` | yes, P1 |

3/3, each citing `Rule Used: … (source: .greptile)`, which also proves the
branch-local repo-owned configuration is read rather than a default profile.
`pnpm typecheck` was clean on all three — none of these is visible to the
compiler, which is the whole reason the semantic layer exists.

### Why the check is still not required

The check **conclusion is not a function of whether actionable findings exist**,
measured in both directions:

* **Cannot-ever-fail.** On PR #22 the reviewer posted a P1 at 13:30:16 and the
  `Greptile Review` check concluded **success** at 13:30:18. A required check
  that goes green with an open P1 adds no guarantee.
* **Cannot-ever-pass.** On the canary's revert head, whose diff netted to empty
  against `main`, **no `Greptile Review` check run was posted at all**. A
  required context that never appears can never be satisfied, and the PR would
  be permanently unmergeable.

Requiring it would install a status that neither reliably blocks a bad head nor
reliably clears a good one. That is exactly the vacuous-check shape
`.greptile/rules.md` prohibits, so it is not installed here either.

### What actually enforces review

**Required conversation resolution**, which is already enabled and was measured
directly. On PR #22 with the status rollup at `SUCCESS` and the branch
`MERGEABLE`, the pull request sat at `mergeStateStatus: BLOCKED` on a single
unresolved thread, and moved to `CLEAN` the moment that thread was resolved —
head SHA and check rollup unchanged, so resolution was the only variable.

So the enforceable gate is: required CI on the current head, plus every
actionable finding reconciled on its own thread. The Greptile check remains
valuable as the thing that *produces* those findings; it is not the thing that
counts them.

### Current required contexts on `main`

`test (20)`, `test (22)`, `Compatibility parity vs frozen source`, with
`strict: true` and `required_conversation_resolution: true`. Unchanged by this
calibration.

Revisit if Greptile's check conclusion becomes a documented function of finding
severity. Until then, treat a green Greptile check as "review ran", never as
"review passed".

## For agents and automated contributors

* Read [`OWNERSHIP.md`](./OWNERSHIP.md) before changing anything: this
  repository consumes the standard, it does not define it.
* Read [`.greptile/rules.md`](./.greptile/rules.md) before changing
  `packages/cli/src/producer/**` or `packages/mining-core/src/**`. Most rules
  there describe a defect that has actually shipped somewhere in this
  ecosystem.
* Do not weaken a producer guard, a parity expectation, or a validator call to
  make a change pass. Adjusting the measurement to match the behavior is the
  violation, not the fix.
* Report `not run`, `unavailable`, `unsupported`, and `absent` distinctly from
  pass and fail when recording evidence. Exit 0 alone is not a receipt.
