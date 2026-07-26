---
"agents-audit": patch
---

**Changed:** `scan` no longer prints a vendor notice when `.agents/workspace.json` is missing or stale. It now names the command that actually fixes the problem — `agents-audit generate` — and still reports the same validation errors. Ratified in META-236: vendor promotion never enters the neutral producer, and is removed or made opt-in in this compatibility package. Exit codes are unchanged and `scan --json` output is byte-identical, so nothing consuming machine-readable output is affected. Human-readable `scan` output does change; this is recorded as an intentional difference in `migration/parity-expected-differences.txt` and enforced by the CI parity gate.
