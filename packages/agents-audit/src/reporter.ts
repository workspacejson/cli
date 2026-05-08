import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import dedent from 'dedent';
import type { AuditResult } from '@workspacejson/rules';
import { isActionable } from './cli-helpers.js';

export async function saveReport(result: AuditResult, repoRoot: string, reportDir: string): Promise<string> {
  const resolvedRoot = resolve(repoRoot);
  const outputDir = resolve(resolvedRoot, reportDir);
  if (!outputDir.startsWith(resolvedRoot + sep)) {
    throw new Error(`reportDir must be within the repo root; got: ${reportDir}`);
  }
  await mkdir(outputDir, { recursive: true });
  const stamp = result.runAt.toISOString().replace(/[:.]/g, '-');
  const outputPath = resolve(outputDir, `agents-audit-${stamp}.md`);

  const actionable = result.findings.filter(isActionable);

  let findingsSection: string;
  if (actionable.length === 0) {
    findingsSection = '_No issues found._';
  } else {
    const rows = actionable
      .map((f) => `| ${f.ruleId} | ${f.severity ?? ''} | ${escapePipe(f.message)} | ${escapePipe(f.evidence.file ?? '')} |`)
      .join('\n');
    findingsSection = dedent`
      | Rule | Severity | Message | File |
      | --- | --- | --- | --- |
      ${rows}
    `;
  }

  const content = dedent`
    # agents-audit report

    - Score: ${result.score.value}/100 (${result.score.grade})
    - Issues: ${actionable.length}
    - Generated: ${result.runAt.toISOString()}

    ## Findings

    ${findingsSection}
  `;

  await writeFile(outputPath, `${content}\n`, 'utf8');
  return outputPath;
}

function escapePipe(value: string): string {
  return value.replace(/\|/g, '\\|');
}
