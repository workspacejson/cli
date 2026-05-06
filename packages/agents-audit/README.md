# agents-audit

[![npm version](https://img.shields.io/npm/v/agents-audit.svg)](https://www.npmjs.com/package/agents-audit)
[![npm downloads](https://img.shields.io/npm/dm/agents-audit.svg)](https://www.npmjs.com/package/agents-audit)

CLI for auditing `AGENTS.md` hygiene with deterministic rules and optional `agents.workspace.json` enrichment.

This package is published from the `workspace-json/agents-audit` monorepo.

## Install

```bash
pnpm add -D agents-audit
# or run directly
npx agents-audit scan .
```

## Use

```bash
agents-audit scan .
agents-audit scan . --json
agents-audit scan . --fail-on error
```

Homepage: https://workspacejson.dev/audit/

Package page: https://www.npmjs.com/package/agents-audit
