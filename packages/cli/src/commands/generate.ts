import { resolve } from 'node:path';
import ora from 'ora';
import pc from 'picocolors';
import { generateWorkspaceJson } from '../producer/generate.js';
import type { ProducerConfig } from '../producer/config.js';
import type { ProducerIdentity } from '../producer/generate.js';

export interface GenerateCommandOptions {
  dryRun?: boolean;
  check?: boolean;
  force?: boolean;
}

/**
 * The `generate` command, extracted verbatim from the historical
 * `agents-audit generate` action (META-247).
 *
 * `agents-audit` calls this same function so the two commands cannot drift:
 * one implementation, two entry points. `producer` and `commandName` are the
 * only things the caller varies, so the compatibility package can keep its
 * historical provenance stamp and its historical remediation hint.
 */
export async function runGenerate(
  path: string,
  options: GenerateCommandOptions,
  context: {
    config: ProducerConfig;
    configWarning?: string | undefined;
    producer?: ProducerIdentity | undefined;
    commandName: string;
  },
): Promise<number> {
  const repoRoot = resolve(path);
  const spinner = ora({ text: 'Scanning repository...', color: 'green' }).start();

  try {
    if (context.configWarning) {
      console.error(`${context.commandName} config warning: ${context.configWarning}`);
    }

    const result = await generateWorkspaceJson(repoRoot, context.config, {
      dryRun: options.dryRun === true,
      check: options.check === true,
      force: options.force === true,
      commandName: context.commandName,
      ...(context.producer === undefined ? {} : { producer: context.producer }),
    });
    spinner.stop();

    if (options.check) {
      if (result.drift) {
        console.error(`Generated sections are stale at ${result.path}; manual evidence is untouched. Run: ${context.commandName} generate ${path}`);
        if (options.dryRun) {
          console.log(JSON.stringify(result.content, null, 2));
        }
        return 1;
      }
      console.log(`Generated sections are current at ${result.path}`);
      if (options.dryRun) {
        console.log(JSON.stringify(result.content, null, 2));
      }
    } else if (options.dryRun) {
      console.log(JSON.stringify(result.content, null, 2));
    } else if (result.skipped) {
      console.log(`Generated sections already current at ${result.path}; manual evidence preserved`);
    } else if (result.invalidFileMoved) {
      console.log(`Generated ${result.path}`);
      console.log(pc.yellow(`  Previous file was invalid and has been moved aside: ${result.invalidFileMoved}`));
      console.log(pc.yellow('  Manual evidence from the previous file was not recovered (it could not be parsed/validated).'));
    } else {
      console.log(`Generated ${result.path}`);
    }

    return 0;
  } catch (error) {
    spinner.stop();
    console.error(`${context.commandName} generate failed:`, error instanceof Error ? error.message : error);
    return 1;
  }
}
