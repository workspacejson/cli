---
"agents-audit": patch
---

**Added:** `renderMissingArtifactNotice`, the neutral replacement used by `scan`. `renderVrekoUpsell` remains exported and unchanged for API compatibility — it is simply no longer called by the CLI, so callers who want it can still invoke it. This export set is additive; no historical export was removed.
