---
"agents-audit": patch
---

**Changed:** `generate` now emits `specVersion: "0.4"` and populates
`generated.conventions` (META-203). The conventions emitter had been
disconnected since `a3fa85a` while the spec moved to v0.4. v0.4 is a strict
superset of v0.3, so existing readers are unaffected; readers wanting the new
field should check `generated.specVersion === "0.4"`. `coChange` and
`fragility` remain unemitted — optional in v0.4. Console output, exit codes,
manual-evidence preservation and refusal/force behavior are unchanged.
