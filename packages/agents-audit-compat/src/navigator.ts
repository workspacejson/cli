import readline from 'node:readline';
import pc from 'picocolors';
import type { Finding } from '@workspacejson/rules';

export async function startInteractiveNavigation(findings: Finding[]): Promise<void> {
  if (findings.length === 0 || !process.stdin.isTTY) {
    return;
  }

  console.log(pc.dim('\nPress ↑↓ to explore findings, Enter to expand, q to exit\n'));

  let index = 0;
  let expanded = false;

  await new Promise<void>((resolve) => {
    const render = (): void => {
      const finding = findings[index]!;
      const severityColor = finding.severity === 'error' ? pc.red : finding.severity === 'warning' ? pc.yellow : pc.dim;
      const counter = pc.dim(`[${index + 1}/${findings.length}]`);
      const severity = severityColor(`[${finding.severity}]`);
      const rule = pc.dim(finding.ruleId);

      let output = `${counter} ${severity} ${rule}\n  ${finding.message}`;
      if (expanded) {
        if (finding.evidence.file) output += `\n  ${pc.dim('File:')} ${finding.evidence.file}`;
        if (finding.evidence.line !== undefined) output += `\n  ${pc.dim('Line:')} ${finding.evidence.line}`;
        if (finding.evidence.snippet) output += `\n  ${pc.dim('Snippet:')} ${finding.evidence.snippet}`;
        if (finding.remediation) output += `\n  ${pc.dim('Fix:')} ${finding.remediation}`;
      }

      process.stdout.write(`\u001b[2J\u001b[H${output}\n`);
    };

    const cleanup = (): void => {
      process.stdin.setRawMode?.(false);
      process.stdin.pause();
      process.stdin.removeAllListeners('keypress');
      resolve();
    };

    process.stdin.setRawMode?.(true);
    process.stdin.resume();
    readline.emitKeypressEvents(process.stdin);

    process.stdin.on('keypress', (_str, key) => {
      if (key.name === 'q' || (key.ctrl && key.name === 'c')) {
        cleanup();
        return;
      }
      if (key.name === 'up') {
        index = Math.max(0, index - 1);
        expanded = false;
        render();
        return;
      }
      if (key.name === 'down') {
        index = Math.min(findings.length - 1, index + 1);
        expanded = false;
        render();
        return;
      }
      if (key.name === 'return') {
        expanded = !expanded;
        render();
      }
    });

    render();
  });
}
