# agents-audit

CLI for auditing `AGENTS.md` hygiene and validating `agents.workspace.json` at the repository root.

This package is published from the `agents-audit` workspace and is the primary
end-user entrypoint for the project.

## Install

```bash
pnpm add -D agents-audit
```

## Run

```bash
agents-audit scan .
agents-audit scan . --json
agents-audit scan . --fail-on error
```

## What It Does

- scans a repository for `AGENTS.md` hygiene issues
- validates `agents.workspace.json` when present
- can generate workspace metadata from a repository scan
- returns a non-zero exit code when configured to fail on findings

## Package Boundary

- `src/cli.ts` defines the command-line interface
- `src/index.ts` exposes the public API
- `src/audit.ts` performs the repository scan and validation
- `src/generate.ts` writes `agents.workspace.json`
