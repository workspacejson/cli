---
"agents-audit": minor
---

**Changed (breaking): `generate --check --dry-run` now fires the drift gate.** It
exits 1 with "manual evidence is untouched" instead of the dry-run branch
silently winning and exiting 0; the JSON projection is still printed under
`--dry-run`. Deferred from 0.4.4 (META-157) precisely because it changes
exit-code semantics; landed here as its own reviewed change with regression
tests watched red against the pre-change CLI.

This is the reason the release is a minor rather than a patch. Exit codes are the
machine-readable contract of a CLI, and a pipeline running
`agents-audit generate --check --dry-run` goes from green to red on upgrade.
