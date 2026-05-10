# agents-audit

CLI for auditing `AGENTS.md` hygiene and validating `.agents/agents.workspace.json`.

## Install

```bash
npm install -D agents-audit
# or
pnpm add -D agents-audit
```

## Quick start

```bash
agents-audit scan .
```

That's it. Point it at any repository with an `AGENTS.md` and it prints a hygiene score with actionable findings.

## Commands

### `scan` (default)

Scans a repository for `AGENTS.md` hygiene issues and validates `.agents/agents.workspace.json` when present.

```bash
agents-audit scan [path] [options]
agents-audit [path] [options]   # scan is the default command
```

**Arguments**

| Argument | Default | Description |
| --- | --- | --- |
| `path` | `.` | Repository root to scan |

**Options**

| Flag | Description |
| --- | --- |
| `--fail-on <severity>` | Exit non-zero when findings at or above severity exist. Values: `error`, `warning`, `info` |
| `--save` | Write a Markdown audit report to the configured `reportDir` (default: `.agents/audit-history/`) |
| `--json` | Output all findings as JSON instead of the terminal UI |
| `--no-interactive` | Skip the interactive findings navigator |
| `--config <path>` | Path to a `.agentsauditrc` config file (default: `.agentsauditrc` at repo root) |

**Examples**

```bash
# Fail CI on any error-severity finding
agents-audit scan . --fail-on error

# Save a Markdown report alongside scanning
agents-audit scan . --save

# JSON output for programmatic consumption
agents-audit scan . --json | jq '.findings[] | select(.state == "FAIL")'

# Combine: fail on warnings, save report, skip interactive
agents-audit scan . --fail-on warning --save --no-interactive
```

### `generate`

Generates `.agents/agents.workspace.json` from a full repository scan. The file is written to the canonical `.agents/` path and can be committed so that future `scan` runs use richer context.

```bash
agents-audit generate [path] [options]
```

**Options**

| Flag | Description |
| --- | --- |
| `--dry-run` | Print the JSON that would be written without writing it |
| `--config <path>` | Path to a `.agentsauditrc` config file |

**Examples**

```bash
# Generate .agents/agents.workspace.json
agents-audit generate .

# Preview without writing
agents-audit generate . --dry-run
```

### `version`

```bash
agents-audit version
```

## Config file

Place a `.agentsauditrc` (JSON) at the repository root to override defaults:

```json
{
  "stalenessThresholdDays": 30,
  "highActivityCommitCount": 10,
  "conventionMismatchPrecisionMode": true,
  "failOn": "error",
  "save": true,
  "reportDir": ".agents/audit-history",
  "ignore": ["docs/**"]
}
```

**All fields are optional.** Unset fields fall back to the defaults shown above.

| Field | Default | Description |
| --- | --- | --- |
| `stalenessThresholdDays` | `60` | Days since last AGENTS.md edit before staleness fires |
| `highActivityCommitCount` | `20` | Commit count that qualifies a file as high-activity |
| `conventionMismatchPrecisionMode` | `true` | Require higher confidence before firing convention-mismatch |
| `failOn` | `null` | Minimum severity that triggers a non-zero exit (`error`, `warning`, `info`) |
| `save` | `false` | Always save a Markdown report |
| `reportDir` | `.agents/audit-history` | Directory for saved reports (relative to repo root) |
| `ignore` | `[]` | Glob patterns to exclude from scanning |

Pass `--config <path>` to use a config file at a non-default location.

## Rules

| Rule | Severity | Category | What it checks |
| --- | --- | --- | --- |
| `missing-file-reference` | error | integrity | File paths mentioned in AGENTS.md that do not exist in the repo |
| `pattern-zero-match` | warning | integrity | Glob patterns in AGENTS.md that match zero files |
| `framework-drift` | warning | drift | Frameworks detected in code that are not mentioned in AGENTS.md |
| `section-staleness` | warning/info | staleness | AGENTS.md sections that cover recently-changed files but haven't been updated |
| `convention-mismatch` | warning | consistency | Filename conventions declared in AGENTS.md that don't match actual files |

## Exit codes

| Code | Meaning |
| --- | --- |
| `0` | Success (or no findings at or above `--fail-on` severity) |
| `1` | Findings found at or above the configured `--fail-on` severity |
| `1` | Unexpected error during scan |

Without `--fail-on`, the exit code is always `0` regardless of findings.

## .agents/agents.workspace.json

When `.agents/agents.workspace.json` is present and up to date, rules use richer context (topology, CI provider, package graph). When it is missing or stale, the CLI suggests running `agents-audit generate` to create it. Root-path `agents.workspace.json` is still read as a fallback during the v0.x migration window.

```bash
# First time setup
agents-audit generate .
git add .agents/agents.workspace.json

# Keep it fresh in CI
agents-audit generate . && agents-audit scan . --fail-on error
```

## JSON output schema

`--json` writes the full `AuditResult` object:

```json
{
  "findings": [
    {
      "ruleId": "missing-file-reference",
      "state": "FAIL",
      "severity": "error",
      "message": "Referenced file does not exist: src/old-module.ts",
      "evidence": { "file": "src/old-module.ts", "line": 12 },
      "remediation": "Remove the reference or create the file",
      "confidence": 0.95,
      "temporalWeight": 1.0
    }
  ],
  "score": { "value": 74, "grade": "C", "breakdown": { "failCount": 1, "warnCount": 2 } },
  "agentsMdPath": "AGENTS.md",
  "workspaceJsonFound": true,
  "workspaceJsonStatus": "fresh",
  "workspaceJsonErrors": [],
  "runAt": "2026-05-08T12:00:00.000Z",
  "durationMs": 320
}
```

## CI integration

```yaml
# .github/workflows/audit.yml
- name: Audit AGENTS.md
  run: npx agents-audit scan . --fail-on error --save --no-interactive
```

## Package boundary

| File | Purpose |
| --- | --- |
| `src/cli.ts` | Commander-based CLI entry point |
| `src/audit.ts` | Orchestrates scan → parse → validate → rule engine |
| `src/generate.ts` | Writes `agents.workspace.json` from a repo scan |
| `src/presenter.ts` | Terminal rendering (score card, findings table, upsell) |
| `src/reporter.ts` | Saves Markdown reports to disk |
| `src/cli-helpers.ts` | Config loading and exit code logic |
| `src/index.ts` | Public programmatic API |
