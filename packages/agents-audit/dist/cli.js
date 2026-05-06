import {
  renderFindingsTable,
  renderScoreCard,
  renderVrekoUpsell,
  runAudit,
  saveReport,
  startInteractiveNavigation
} from "./chunk-LHVEGUWO.js";

// src/cli.ts
import { resolve as resolve2 } from "path";
import { createRequire } from "module";
import { Command } from "commander";
import ora from "ora";

// src/cli-helpers.ts
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
var DEFAULT_CLI_CONFIG = {
  stalenessThresholdDays: 60,
  highActivityCommitCount: 20,
  conventionMismatchPrecisionMode: true,
  failOn: null,
  save: false,
  reportDir: ".agents/audit-history",
  ignore: []
};
function getExitCode(result, failOn) {
  if (!failOn) return 0;
  const severity = failOn;
  const hasMatchingFinding = result.findings.some((finding) => {
    if (severity === "info") return true;
    if (severity === "warning") return finding.severity === "warning" || finding.severity === "error";
    if (severity === "error") return finding.severity === "error";
    return false;
  });
  return hasMatchingFinding ? 1 : 0;
}
function loadConfig(configPath, repoRoot) {
  const rcPath = configPath ? resolve(repoRoot, configPath) : resolve(repoRoot, ".agentsauditrc");
  if (!existsSync(rcPath)) {
    return { config: { ...DEFAULT_CLI_CONFIG } };
  }
  try {
    const raw = JSON.parse(readFileSync(rcPath, "utf8"));
    return { config: { ...DEFAULT_CLI_CONFIG, ...raw } };
  } catch (error) {
    return {
      config: { ...DEFAULT_CLI_CONFIG },
      warning: `Ignoring invalid config file at ${rcPath}: ${error instanceof Error ? error.message : String(error)}.`
    };
  }
}

// src/cli.ts
var require2 = createRequire(import.meta.url);
var { version } = require2("../package.json");
var program = new Command();
program.name("agents-audit").description("Audit AGENTS.md hygiene - powered by workspace.json intelligence").version(version);
program.command("scan", { isDefault: true }).description("Scan a repository for AGENTS.md hygiene issues").argument("[path]", "Repository root to scan", ".").option("--fail-on <severity>", "Exit non-zero if findings at severity level exist (error|warning|info)").option("--save", "Save audit report to .agents/audit-history/").option("--json", "Output findings as JSON").option("--no-interactive", "Disable interactive findings navigation").option("--config <path>", "Path to .agentsauditrc config file").action(async (path, options) => {
  const repoRoot = resolve2(path);
  const { config, warning } = loadConfig(options.config, repoRoot);
  const spinner = options.json ? null : ora({
    text: "Scanning AGENTS.md...",
    color: "green"
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
    console.error("agents-audit encountered an error:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
});
program.command("version").description("Print version information").action(() => {
  console.log(`agents-audit v${version}`);
  console.log("https://workspacejson.dev/audit/");
});
await program.parseAsync(process.argv);
