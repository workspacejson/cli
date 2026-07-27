#!/usr/bin/env node
import { realpathSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { Command } from 'commander';
import { runGenerate } from './commands/generate.js';
import { DEFAULT_PRODUCER_CONFIG } from './producer/config.js';

const require = createRequire(import.meta.url);
const { version } = require('../package.json') as { version: string };

export async function runCli(argv: string[] = process.argv): Promise<number> {
  let exitCode = 0;
  const program = new Command();

  program
    .name('workspacejson')
    .description('Generate .agents/workspace.json — the workspace.json producer')
    .version(version)
    .exitOverride();

  program
    .command('generate', { isDefault: true })
    .description('Generate .agents/workspace.json from a repository scan')
    .argument('[path]', 'Repository root to scan', '.')
    .option('--dry-run', 'Print the workspace.json that would be written without writing it')
    .option('--check', 'Exit non-zero when producer-owned sections are missing, invalid, or stale without writing')
    .option('--force', 'Move an invalid existing artifact aside before writing a fresh generated artifact')
    .action(async (path: string, options: { dryRun?: boolean; check?: boolean; force?: boolean }) => {
      // Config-file support is deliberately absent for now. `agents-audit`
      // reads `.agentsauditrc`, which is an audit-shaped name the neutral
      // producer should not inherit by default. Naming a neutral config file is
      // a public-surface decision and belongs with the OSS polish issue, not
      // with this structural change (META-247).
      exitCode = await runGenerate(path, options, {
        config: DEFAULT_PRODUCER_CONFIG,
        commandName: 'workspacejson',
      });
    });

  program
    .command('version')
    .description('Print version information')
    .action(() => {
      console.log(`workspacejson v${version}`);
      console.log('https://workspacejson.dev');
    });

  try {
    await program.parseAsync(argv);
  } catch (error) {
    // `.exitOverride()` makes commander throw instead of exiting, including on
    // the success paths: `--help` and `--version` raise a CommanderError whose
    // exitCode is 0. The previous `Number(...) || 1` collapsed that legitimate
    // zero into 1, so `workspacejson --help` reported failure to every shell and
    // CI job that checked it. Distinguish "no usable exitCode" from "exitCode is
    // zero" instead of leaning on falsiness.
    const reported =
      typeof error === 'object' && error !== null && 'exitCode' in error
        ? Number((error as { exitCode?: number }).exitCode)
        : Number.NaN;
    exitCode = Number.isInteger(reported) ? reported : 1;
  }

  return exitCode;
}

// npm exposes package bins through node_modules/.bin symlinks. Resolve both
// paths before comparing them so the executable runs whether invoked directly
// or through npx/npm exec.
if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
  const exitCode = await runCli(process.argv);
  process.exit(exitCode);
}
