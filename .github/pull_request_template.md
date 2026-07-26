# Summary

Describe what changed and why.

## Verification

- [ ] `pnpm -r typecheck`
- [ ] `pnpm -r test`
- [ ] `pnpm -r build`
- [ ] `node packages/agents-audit-compat/dist/cli.js scan . --fail-on error`
- [ ] `bash migration/parity-agents-audit-runtime.sh` (required if anything `agents-audit` exposes changed)

## Notes

Call out any user-facing behavior, release impact, or follow-up work.
