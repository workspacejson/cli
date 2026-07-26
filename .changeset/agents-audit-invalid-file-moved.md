---
"agents-audit": patch
---

**Added:** `generate` now surfaces `invalidFileMoved` (result data that has existed since 0.4.3 but was never displayed): when a previous `.agents/workspace.json` was invalid and moved aside, the CLI prints where it was relocated to and that its manual evidence could not be recovered.
