---
---

`@workspacejson/cli` adopts `agents-audit`'s version line at `0.5.0`, set
directly in `packages/cli/package.json` rather than derived from a changeset —
changesets bumps relative to the current version and cannot jump `0.1.0` to
`0.5.0`. This changeset is intentionally empty so `changeset status` stays clean
for a release whose number was chosen, not computed.

From `0.5.0` onward the normal flow applies: add a changeset, run
`pnpm changeset version`, tag `cli-vX.Y.Z` to match.
