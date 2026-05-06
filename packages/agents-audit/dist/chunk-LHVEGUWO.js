// src/audit.ts
import { existsSync } from "fs";
import { readdir, readFile } from "fs/promises";
import { resolve } from "path";
import { AgentsMdParser, RepoScanner, RuleEngine, WorkspaceJsonValidator, computeHygieneScore, conventionMismatch, frameworkDrift, missingFileReference, patternZeroMatch, sectionStaleness } from "@workspacejson/rules";
var DEFAULT_AUDIT_CONFIG = {
  stalenessThresholdDays: 60,
  highActivityCommitCount: 20,
  conventionMismatchPrecisionMode: true,
  failOn: null,
  save: false,
  reportDir: ".agents/audit-history",
  ignore: []
};
async function runAudit(repoRoot, config = {}) {
  const resolvedRoot = resolve(repoRoot);
  const fullConfig = { ...DEFAULT_AUDIT_CONFIG, ...config };
  const scanner = new RepoScanner();
  const parser = new AgentsMdParser();
  const validator = new WorkspaceJsonValidator();
  const engine = new RuleEngine();
  engine.register(missingFileReference);
  engine.register(patternZeroMatch);
  engine.register(frameworkDrift);
  engine.register(sectionStaleness);
  engine.register(conventionMismatch);
  const agentsMdPath = await findAgentsMdPath(resolvedRoot);
  const agentsMdContent = await readTextOrEmpty(agentsMdPath);
  const agentsMd = await parser.parse(agentsMdPath, agentsMdContent);
  const repo = await scanner.scan(resolvedRoot);
  repo.gitHistory.agentsMdLastModified = agentsMd.lastModified;
  const { workspaceJson, workspaceJsonFound, workspaceJsonStale, workspaceJsonStatus, workspaceJsonErrors } = await loadWorkspaceJson(resolvedRoot, agentsMd.lastModified, validator);
  const ctx = {
    agentsMd,
    repo,
    config: fullConfig
  };
  if (workspaceJson !== void 0) {
    ctx.workspace = workspaceJson;
  }
  const run = await engine.run(ctx);
  const score = computeHygieneScore(run.findings);
  return {
    findings: run.findings,
    score,
    agentsMdPath,
    workspaceJsonFound,
    workspaceJsonStale,
    workspaceJsonStatus,
    workspaceJsonErrors,
    runAt: /* @__PURE__ */ new Date(),
    durationMs: run.durationMs,
    workspaceJson
  };
}
async function findAgentsMdPath(repoRoot) {
  const rootPath = resolve(repoRoot, "AGENTS.md");
  if (existsSync(rootPath)) {
    return rootPath;
  }
  try {
    const entries = await readdir(repoRoot, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const candidate = resolve(repoRoot, entry.name, "AGENTS.md");
      if (existsSync(candidate)) {
        return candidate;
      }
    }
  } catch {
  }
  return rootPath;
}
async function loadWorkspaceJson(repoRoot, agentsMdLastModified, validator) {
  const workspacePath = resolve(repoRoot, ".agents/agents.workspace.json");
  if (!existsSync(workspacePath)) {
    return {
      workspaceJsonFound: false,
      workspaceJsonStale: true,
      workspaceJsonStatus: "missing",
      workspaceJsonErrors: []
    };
  }
  try {
    const raw = await readFile(workspacePath, "utf8");
    const workspaceJson = JSON.parse(raw);
    const validation = validator.validate(workspaceJson);
    const generatedAt = typeof workspaceJson === "object" && workspaceJson !== null ? Reflect.get(workspaceJson, "generatedAt") : void 0;
    const generatedDate = typeof generatedAt === "string" ? new Date(generatedAt) : /* @__PURE__ */ new Date(0);
    const stale = !validation.valid || Number.isNaN(generatedDate.getTime()) || generatedDate < agentsMdLastModified;
    const errors = validation.valid ? [] : validation.errors;
    return {
      workspaceJsonFound: true,
      workspaceJsonStale: stale,
      workspaceJsonStatus: validation.valid ? generatedDate < agentsMdLastModified ? "stale" : "fresh" : "invalid",
      workspaceJsonErrors: errors,
      workspaceJson
    };
  } catch {
    return {
      workspaceJsonFound: true,
      workspaceJsonStale: true,
      workspaceJsonStatus: "invalid",
      workspaceJsonErrors: ["Unable to parse .agents/agents.workspace.json"]
    };
  }
}
async function readTextOrEmpty(filePath) {
  try {
    return await readFile(filePath, "utf8");
  } catch {
    return "";
  }
}

// src/presenter.ts
import boxen from "boxen";
import dedent from "dedent";
import Table from "cli-table3";
import pc from "picocolors";
import terminalLink from "terminal-link";
var BRAND_COLOR = "\x1B[38;2;74;222;128m";
var RESET = "\x1B[0m";
function brand(text) {
  return `${BRAND_COLOR}${text}${RESET}`;
}
function renderScoreCard(result, version) {
  const { score } = result;
  const gradeColor = score.grade === "A" ? pc.green : score.grade === "B" ? pc.cyan : score.grade === "C" ? pc.yellow : score.grade === "D" ? pc.yellow : pc.red;
  const scoreDisplay = gradeColor(`${score.value}/100 (${score.grade})`);
  const summary = dedent`
    ${brand("agents-audit")} ${pc.dim(`v${version}`)}
    ${pc.dim("\u2500".repeat(48))}
    File:    ${pc.dim(result.agentsMdPath)}
    Score:   ${scoreDisplay}
    Errors:  ${score.errorCount > 0 ? pc.red(String(score.errorCount)) : pc.green("0")}
    Warnings: ${score.warningCount > 0 ? pc.yellow(String(score.warningCount)) : pc.green("0")}
    Info:    ${pc.dim(String(score.infoCount))}
    Time:    ${pc.dim(`${result.durationMs}ms`)}
    ${pc.dim("\u2500".repeat(48))}
  `;
  console.log(`
${summary}`);
}
function renderFindingsTable(findings) {
  const table = new Table({
    head: [pc.bold("Rule"), pc.bold("Severity"), pc.bold("Message"), pc.bold("File")],
    style: {
      head: [],
      border: ["dim"]
    },
    wordWrap: true,
    colWidths: [25, 10, 50, 30]
  });
  for (const finding of findings) {
    const severityColor = finding.severity === "error" ? pc.red : finding.severity === "warning" ? pc.yellow : pc.dim;
    table.push([pc.dim(finding.ruleId), severityColor(finding.severity), finding.message, finding.evidence.file ? pc.dim(finding.evidence.file) : ""]);
  }
  console.log(table.toString());
  console.log("");
}
function renderVrekoUpsell(workspaceJsonExists, workspaceJsonStatus, workspaceJsonErrors) {
  const message = workspaceJsonExists ? dedent`
        ${brand("agents.workspace.json")} is stale or invalid.
        Vreko updates it automatically from real codebase activity.
        ${pc.dim(terminalLink("vreko.dev", "https://vreko.dev"))}
      ` : dedent`
        agents.workspace.json not found.
        Vreko generates it automatically from real codebase structure and activity,
        unlocking richer audit findings.
        ${pc.dim(terminalLink("vreko.dev", "https://vreko.dev"))}
      `;
  console.log(boxen(message, {
    padding: { top: 0, bottom: 0, left: 1, right: 1 },
    borderStyle: "round",
    borderColor: "green",
    dimBorder: true
  }));
  if (workspaceJsonStatus === "invalid" && workspaceJsonErrors.length > 0) {
    console.log(pc.yellow(`
workspace.json validation issues:`));
    for (const error of workspaceJsonErrors) {
      console.log(pc.yellow(`- ${error}`));
    }
  }
  console.log("");
}

// src/navigator.ts
import readline from "readline";
import pc2 from "picocolors";
async function startInteractiveNavigation(findings) {
  if (findings.length === 0 || !process.stdin.isTTY) {
    return;
  }
  console.log(pc2.dim("\nPress \u2191\u2193 to explore findings, Enter to expand, q to exit\n"));
  let index = 0;
  let expanded = false;
  await new Promise((resolve3) => {
    const render = () => {
      const finding = findings[index];
      const severityColor = finding.severity === "error" ? pc2.red : finding.severity === "warning" ? pc2.yellow : pc2.dim;
      const counter = pc2.dim(`[${index + 1}/${findings.length}]`);
      const severity = severityColor(`[${finding.severity}]`);
      const rule = pc2.dim(finding.ruleId);
      let output = `${counter} ${severity} ${rule}
  ${finding.message}`;
      if (expanded) {
        if (finding.evidence.file) output += `
  ${pc2.dim("File:")} ${finding.evidence.file}`;
        if (finding.evidence.line !== void 0) output += `
  ${pc2.dim("Line:")} ${finding.evidence.line}`;
        if (finding.evidence.snippet) output += `
  ${pc2.dim("Snippet:")} ${finding.evidence.snippet}`;
        if (finding.remediation) output += `
  ${pc2.dim("Fix:")} ${finding.remediation}`;
      }
      process.stdout.write(`\x1B[2J\x1B[H${output}
`);
    };
    const cleanup = () => {
      process.stdin.setRawMode?.(false);
      process.stdin.pause();
      process.stdin.removeAllListeners("keypress");
      resolve3();
    };
    process.stdin.setRawMode?.(true);
    process.stdin.resume();
    readline.emitKeypressEvents(process.stdin);
    process.stdin.on("keypress", (_str, key) => {
      if (key.name === "q" || key.ctrl && key.name === "c") {
        cleanup();
        return;
      }
      if (key.name === "up") {
        index = Math.max(0, index - 1);
        expanded = false;
        render();
        return;
      }
      if (key.name === "down") {
        index = Math.min(findings.length - 1, index + 1);
        expanded = false;
        render();
        return;
      }
      if (key.name === "return") {
        expanded = !expanded;
        render();
      }
    });
    render();
  });
}

// src/reporter.ts
import { mkdir, writeFile } from "fs/promises";
import { resolve as resolve2 } from "path";
import dedent2 from "dedent";
async function saveReport(result, repoRoot, reportDir) {
  const outputDir = resolve2(repoRoot, reportDir);
  await mkdir(outputDir, { recursive: true });
  const stamp = result.runAt.toISOString().replace(/[:.]/g, "-");
  const outputPath = resolve2(outputDir, `agents-audit-${stamp}.md`);
  const rows = result.findings.map((finding) => `| ${finding.ruleId} | ${finding.severity} | ${escapePipe(finding.message)} | ${escapePipe(finding.evidence.file ?? "")} |`).join("\n");
  const content = dedent2`
    # agents-audit report

    - Score: ${result.score.value}/100 (${result.score.grade})
    - Findings: ${result.findings.length}
    - Generated: ${result.runAt.toISOString()}

    | Rule | Severity | Message | File |
    | --- | --- | --- | --- |
    ${rows || "| - | - | - | - |"}
  `;
  await writeFile(outputPath, `${content}
`, "utf8");
  return outputPath;
}
function escapePipe(value) {
  return value.replace(/\|/g, "\\|");
}

export {
  DEFAULT_AUDIT_CONFIG,
  runAudit,
  renderScoreCard,
  renderFindingsTable,
  renderVrekoUpsell,
  startInteractiveNavigation,
  saveReport
};
