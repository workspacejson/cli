export {
  generateWorkspaceJson,
  writeWorkspaceAtomically,
  GenerateRefusalError,
  THIS_PRODUCER,
} from './producer/generate.js';
export type { GenerateResult, ProducerIdentity } from './producer/generate.js';
export { DEFAULT_PRODUCER_CONFIG, detectCiProvider } from './producer/config.js';
export type { ProducerConfig } from './producer/config.js';
export { findAgentsMdPath, readTextOrEmpty } from './producer/fs.js';

// The `generate` command implementation is deliberately public. `agents-audit`
// invokes it so that both binaries route through exactly one implementation
// and their output cannot drift apart during the compatibility window
// (META-247).
export { runGenerate } from './commands/generate.js';
export type { GenerateCommandOptions } from './commands/generate.js';
