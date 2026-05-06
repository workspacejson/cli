import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import dedent from 'dedent';
import type { AuditResult } from '@workspacejson/rules';

export async function saveReport(result: AuditResult, repoRoot: string, reportDir: string): Promise<string> {
  const outputDir = resolve(repoRoot, reportDir);
  await mkdir(outputDir, { recursive: true });
  const stamp = result.runAt.toISOString().replace(/[:.]/g, '-');
  const outputPath = resolve(outputDir, `agents-audit-${stamp}.md`);

  const rows = result.findings
    .map((finding) => `| ${finding.ruleId} | ${finding.severity} | ${escapePipe(finding.message)} | ${escapePipe(finding.evidence.file ?? '')} |`)
    .join('\n');

  const content = dedent`
    # agents-audit report

    - Score: ${result.score.value}/100 (${result.score.grade})
    - Findings: ${result.findings.length}
    - Generated: ${result.runAt.toISOString()}

    | Rule | Severity | Message | File |
    | --- | --- | --- | --- |
    ${rows || '| - | - | - | - |'}
  `;

  await writeFile(outputPath, `${content}\n`, 'utf8');
  return outputPath;
}

function escapePipe(value: string): string {
  return value.replace(/\|/g, '\\|');
}
