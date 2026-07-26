import boxen from 'boxen';
import dedent from 'dedent';
import Table from 'cli-table3';
import pc from 'picocolors';
import terminalLink from 'terminal-link';
import type { AuditResult, Finding } from '@workspacejson/rules';
import { isActionable } from './cli-helpers.js';

const BRAND_COLOR = '\x1b[38;2;74;222;128m';
const RESET = '\x1b[0m';

function brand(text: string): string {
  return `${BRAND_COLOR}${text}${RESET}`;
}

export function renderScoreCard(result: AuditResult, version: string): void {
  const { score } = result;
  const gradeColor = score.grade === 'A' ? pc.green : score.grade === 'B' ? pc.cyan : score.grade === 'C' ? pc.yellow : pc.red;
  const scoreDisplay = gradeColor(`${score.value}/100 (${score.grade})`);
  const summary = dedent`
    ${brand('agents-audit')} ${pc.dim(`v${version}`)}
    ${pc.dim('─'.repeat(48))}
    File:     ${pc.dim(result.agentsMdPath)}
    Score:    ${scoreDisplay}
    Errors:   ${score.breakdown.failCount > 0 ? pc.red(String(score.breakdown.failCount)) : pc.green('0')}
    Warnings: ${score.breakdown.warnCount > 0 ? pc.yellow(String(score.breakdown.warnCount)) : pc.green('0')}
    Time:     ${pc.dim(`${result.durationMs}ms`)}
    ${pc.dim('─'.repeat(48))}
  `;

  console.log(`\n${summary}`);
}

export function renderFindingsTable(findings: Finding[]): void {
  const actionable = findings.filter(isActionable);

  if (actionable.length === 0) {
    console.log(pc.green('  ✓ All checks passed\n'));
    return;
  }

  const table = new Table({
    head: [pc.bold('Rule'), pc.bold('Severity'), pc.bold('Message'), pc.bold('File')],
    style: {
      head: [],
      border: ['dim'],
    },
    wordWrap: true,
    colWidths: [25, 10, 50, 30],
  });

  for (const finding of actionable) {
    const sev = finding.severity ?? finding.state.toLowerCase();
    const severityColor = sev === 'error' ? pc.red : sev === 'warning' ? pc.yellow : pc.dim;
    const message = finding.remediation
      ? `${finding.message}\n${pc.dim(`→ ${finding.remediation}`)}`
      : finding.message;
    table.push([pc.dim(finding.ruleId), severityColor(sev), message, finding.evidence.file ? pc.dim(finding.evidence.file) : '']);
  }

  console.log(table.toString());
  console.log('');
}

/**
 * Neutral replacement for `renderVrekoUpsell` in default CLI output (META-236).
 *
 * The old notice pointed users at a vendor site. A neutral, Apache-2.0 producer
 * on a standards-donation track should not advertise one implementation in its
 * default output — but the underlying signal is genuinely useful, and the fix
 * for "workspace.json is missing" is a command this very tool provides. So the
 * signal and the validation errors are kept and the promotion is replaced by
 * the actual remediation command.
 *
 * `renderVrekoUpsell` remains exported for API compatibility; it is simply no
 * longer called by the CLI.
 */
export function renderMissingArtifactNotice(
  workspaceJsonExists: boolean,
  workspaceJsonStatus: AuditResult['workspaceJsonStatus'],
  workspaceJsonErrors: string[],
): void {
  const message = workspaceJsonExists
    ? dedent`
        ${brand('workspace.json')} is stale or invalid.
        Regenerate it with: ${pc.bold('agents-audit generate')}
      `
    : dedent`
        ${brand('workspace.json')} not found.
        Generate it with: ${pc.bold('agents-audit generate')}
        A committed artifact unlocks richer audit findings.
      `;

  console.log(boxen(message, {
    padding: { top: 0, bottom: 0, left: 1, right: 1 },
    borderStyle: 'round',
    borderColor: 'green',
    dimBorder: true,
  }));

  if (workspaceJsonStatus === 'invalid' && workspaceJsonErrors.length > 0) {
    console.log(pc.yellow(`\nworkspace.json validation issues:`));
    for (const error of workspaceJsonErrors) {
      console.log(pc.yellow(`- ${error}`));
    }
  }

  console.log('');
}

/** @deprecated Retained only for API compatibility; no longer used by the CLI (META-236). */
export function renderVrekoUpsell(
  workspaceJsonExists: boolean,
  workspaceJsonStatus: AuditResult['workspaceJsonStatus'],
  workspaceJsonErrors: string[],
): void {
  const message = workspaceJsonExists
    ? dedent`
        ${brand('workspace.json')} is stale or invalid.
        Vreko updates it automatically from real codebase activity.
        ${pc.dim(terminalLink('vreko.dev', 'https://vreko.dev'))}
      `
    : dedent`
        workspace.json not found.
        Vreko generates it automatically from real codebase structure and activity,
        unlocking richer audit findings.
        ${pc.dim(terminalLink('vreko.dev', 'https://vreko.dev'))}
      `;

  console.log(boxen(message, {
    padding: { top: 0, bottom: 0, left: 1, right: 1 },
    borderStyle: 'round',
    borderColor: 'green',
    dimBorder: true,
  }));

  if (workspaceJsonStatus === 'invalid' && workspaceJsonErrors.length > 0) {
    console.log(pc.yellow(`\nworkspace.json validation issues:`));
    for (const error of workspaceJsonErrors) {
      console.log(pc.yellow(`- ${error}`));
    }
  }

  console.log('');
}
