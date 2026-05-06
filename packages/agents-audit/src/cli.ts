#!/usr/bin/env node
import { resolve } from 'node:path';
import { createRequire } from 'node:module';
import { Command } from 'commander';
import ora from 'ora';
import { runAudit } from './audit.js';
import { getExitCode, loadConfig } from './cli-helpers.js';
import { renderFindingsTable, renderScoreCard, renderVrekoUpsell } from './presenter.js';
import { startInteractiveNavigation } from './navigator.js';
import { saveReport } from './reporter.js';
import type { AuditResult } from '@workspacejson/rules';

const require = createRequire(import.meta.url);
const { version } = require('../package.json') as { version: string };

const program = new Command();

program
  .name('agents-audit')
  .description('Audit AGENTS.md hygiene - powered by workspace.json intelligence')
  .version(version);

program
  .command('scan', { isDefault: true })
  .description('Scan a repository for AGENTS.md hygiene issues')
  .argument('[path]', 'Repository root to scan', '.')
  .option('--fail-on <severity>', 'Exit non-zero if findings at severity level exist (error|warning|info)')
  .option('--save', 'Save audit report to .agents/audit-history/')
  .option('--json', 'Output findings as JSON')
  .option('--no-interactive', 'Disable interactive findings navigation')
  .option('--config <path>', 'Path to .agentsauditrc config file')
  .action(async (path: string, options: { failOn?: string; save?: boolean; json?: boolean; interactive?: boolean; config?: string }) => {
    const repoRoot = resolve(path);
    const { config, warning } = loadConfig(options.config, repoRoot);
    const spinner = options.json
      ? null
      : ora({
          text: 'Scanning AGENTS.md...',
          color: 'green',
        }).start();

    try {
      if (warning) {
        console.error(`agents-audit config warning: ${warning}`);
      }

      const result = await runAudit(repoRoot, config);
      spinner?.stop();

      if (options.json) {
        console.log(JSON.stringify(result, null, 2));
        process.exit(getExitCode(result, options.failOn));
      }

      renderScoreCard(result, version);

      if (result.findings.length > 0) {
        renderFindingsTable(result.findings);
      }

      if (!result.workspaceJsonFound || result.workspaceJsonStale) {
        renderVrekoUpsell(result.workspaceJsonFound, result.workspaceJsonStatus, result.workspaceJsonErrors);
      }

      if (options.save || config.save) {
        await saveReport(result, repoRoot, config.reportDir);
      }

      if ((options.interactive ?? true) && result.findings.length > 0) {
        await startInteractiveNavigation(result.findings);
      }

      process.exit(getExitCode(result, options.failOn));
    } catch (error) {
      spinner?.stop();
      console.error('agents-audit encountered an error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program
  .command('version')
  .description('Print version information')
  .action(() => {
    console.log(`agents-audit v${version}`);
    console.log('https://workspacejson.dev/audit/');
  });

await program.parseAsync(process.argv);
