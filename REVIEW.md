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
| `Greptile Review` | Greptile | see [Status](#status-of-the-greptile-gate) |
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

## Status of the Greptile gate

`Greptile Review` is **not yet a required branch-protection status** for `main`.

The rollout is deliberately staged: a repo-owned policy lands first, a
disposable canary PR then proves the policy behaves correctly against real
CLI failure classes, and only then is the required-check decision made.

A rule that misses its own positive control is not eligible to become a hard
gate. Making a check required before proving it can fail for the defect it names
would install a gate that reports conformance it never measured — which is the
same defect `.greptile/rules.md` exists to catch in the producer.

Calibration and the resulting decision are tracked on META-321, and this section
is updated with the measured outcome rather than with an intention.

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
