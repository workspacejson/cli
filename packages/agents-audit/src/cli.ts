#!/usr/bin/env node
import { resolve } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { Command } from 'commander';
import ora from 'ora';
import pc from 'picocolors';
import { runAudit } from './audit.js';
import { getExitCode, isActionable, loadConfig } from './cli-helpers.js';
import { generateWorkspaceJson } from './generate.js';
import { renderFindingsTable, renderScoreCard, renderVrekoUpsell } from './presenter.js';
import { startInteractiveNavigation } from './navigator.js';
import { saveReport } from './reporter.js';
import type { AuditResult } from '@workspacejson/rules';

const require = createRequire(import.meta.url);
const { version } = require('../package.json') as { version: string };

export async function runCli(argv: string[] = process.argv): Promise<number> {
  let exitCode = 0;
  const program = new Command();

  program
    .name('agents-audit')
    .description('Audit AGENTS.md hygiene - powered by workspace.json intelligence')
    .version(version)
    .exitOverride();

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
          exitCode = getExitCode(result, options.failOn);
          return;
        }

        renderScoreCard(result, version);
        renderFindingsTable(result.findings);

        if (!result.workspaceJsonFound || result.workspaceJsonStale) {
          renderVrekoUpsell(result.workspaceJsonFound, result.workspaceJsonStatus, result.workspaceJsonErrors);
        }

        if (options.save || config.save) {
          const reportPath = await saveReport(result, repoRoot, config.reportDir);
          console.log(pc.dim(`  Report saved: ${reportPath}`));
        }

        const actionableFindings = result.findings.filter(isActionable);
        if ((options.interactive ?? true) && actionableFindings.length > 0) {
          await startInteractiveNavigation(actionableFindings);
        }

        exitCode = getExitCode(result, options.failOn);
      } catch (error) {
        spinner?.stop();
        console.error('agents-audit encountered an error:', error instanceof Error ? error.message : error);
        exitCode = 1;
      }
    });

  program
    .command('generate')
    .description('Generate .agents/workspace.json from a repository scan')
    .argument('[path]', 'Repository root to scan', '.')
    .option('--dry-run', 'Print the workspace.json that would be written without writing it')
    .option('--check', 'Exit non-zero when producer-owned sections are missing, invalid, or stale without writing')
    .option('--force', 'Move an invalid existing artifact aside before writing a fresh generated artifact')
    .option('--config <path>', 'Path to .agentsauditrc config file')
    .action(async (path: string, options: { dryRun?: boolean; check?: boolean; force?: boolean; config?: string }) => {
      const repoRoot = resolve(path);
      const { config, warning } = loadConfig(options.config, repoRoot);
      const spinner = ora({ text: 'Scanning repository...', color: 'green' }).start();

      try {
        if (warning) {
          console.error(`agents-audit config warning: ${warning}`);
        }

        const result = await generateWorkspaceJson(repoRoot, config, {
          dryRun: options.dryRun === true,
          check: options.check === true,
          force: options.force === true,
        });
        spinner.stop();

        if (options.dryRun) {
          console.log(JSON.stringify(result.content, null, 2));
        } else if (options.check) {
          if (result.drift) {
            console.error(`Generated sections are stale at ${result.path}; manual evidence is untouched. Run: agents-audit generate ${path}`);
            exitCode = 1;
          } else {
            console.log(`Generated sections are current at ${result.path}`);
          }
        } else if (result.skipped) {
          console.log(`Generated sections already current at ${result.path}; manual evidence preserved`);
        } else {
          console.log(`Generated ${result.path}`);
        }
      } catch (error) {
        spinner.stop();
        console.error('agents-audit generate failed:', error instanceof Error ? error.message : error);
        exitCode = 1;
      }
    });

  program
    .command('version')
    .description('Print version information')
    .action(() => {
      console.log(`agents-audit v${version}`);
      console.log('https://www.workspacejson.dev/audit/');
    });

  try {
    await program.parseAsync(argv);
  } catch (error) {
    exitCode = typeof error === 'object' && error && 'exitCode' in error ? Number((error as { exitCode?: number }).exitCode) || 1 : 1;
  }

  return exitCode;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const exitCode = await runCli(process.argv);
  process.exit(exitCode);
}
