import boxen from 'boxen';
import dedent from 'dedent';
import Table from 'cli-table3';
import pc from 'picocolors';
import terminalLink from 'terminal-link';
import type { AuditResult, Finding } from '@workspacejson/rules';

const BRAND_COLOR = '\x1b[38;2;74;222;128m';
const RESET = '\x1b[0m';

function brand(text: string): string {
  return `${BRAND_COLOR}${text}${RESET}`;
}

export function renderScoreCard(result: AuditResult, version: string): void {
  const { score } = result;
  const gradeColor = score.grade === 'A' ? pc.green : score.grade === 'B' ? pc.cyan : score.grade === 'C' ? pc.yellow : score.grade === 'D' ? pc.yellow : pc.red;
  const scoreDisplay = gradeColor(`${score.value}/100 (${score.grade})`);
  const summary = dedent`
    ${brand('agents-audit')} ${pc.dim(`v${version}`)}
    ${pc.dim('─'.repeat(48))}
    File:    ${pc.dim(result.agentsMdPath)}
    Score:   ${scoreDisplay}
    Errors:  ${score.breakdown.failCount > 0 ? pc.red(String(score.breakdown.failCount)) : pc.green('0')}
    Warnings: ${score.breakdown.warnCount > 0 ? pc.yellow(String(score.breakdown.warnCount)) : pc.green('0')}
    Time:    ${pc.dim(`${result.durationMs}ms`)}
    ${pc.dim('─'.repeat(48))}
  `;

  console.log(`\n${summary}`);
}

export function renderFindingsTable(findings: Finding[]): void {
  const table = new Table({
    head: [pc.bold('Rule'), pc.bold('Severity'), pc.bold('Message'), pc.bold('File')],
    style: {
      head: [],
      border: ['dim'],
    },
    wordWrap: true,
    colWidths: [25, 10, 50, 30],
  });

  for (const finding of findings) {
    const sev = finding.severity ?? finding.state.toLowerCase();
    const severityColor = sev === 'error' ? pc.red : sev === 'warning' ? pc.yellow : pc.dim;
    table.push([pc.dim(finding.ruleId), severityColor(sev), finding.message, finding.evidence.file ? pc.dim(finding.evidence.file) : '']);
  }

  console.log(table.toString());
  console.log('');
}

export function renderVrekoUpsell(
  workspaceJsonExists: boolean,
  workspaceJsonStatus: AuditResult['workspaceJsonStatus'],
  workspaceJsonErrors: string[],
): void {
  const message = workspaceJsonExists
    ? dedent`
        ${brand('agents.workspace.json')} is stale or invalid.
        Vreko updates it automatically from real codebase activity.
        ${pc.dim(terminalLink('vreko.dev', 'https://vreko.dev'))}
      `
    : dedent`
        agents.workspace.json not found.
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
