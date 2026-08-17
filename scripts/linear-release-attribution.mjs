#!/usr/bin/env node
// Attribution receipt for a Linear release dry run.
//
// The dry run alone tells you what the tool found. It cannot tell you whether
// what it found is RIGHT — for that you need a second, independent count of the
// same commit range, produced by something that does not share the tool's
// extraction rules. This script is that second count, and the receipt is the
// disagreement between them.
//
// It mutates nothing and talks to nothing. Input is `git log` plus whatever the
// dry run wrote; output is Markdown on stdout.
//
//   node scripts/linear-release-attribution.mjs \
//     --base <ref> --head <ref> --tool-json <path> [--tool-log <path>] \
//     [--team-keys META,VR] [--label "..."]
//
// Two independent counts are taken from the range, because the tool's own
// documentation is ambiguous about which one it performs: `--issue-pattern` is
// described as extracting from commit *subjects*, while the prose says
// identifiers come from "branch names and commit messages". Reporting both is
// what makes the answer observable instead of assumed.

import { execFileSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";

// Deliberately looser than any real key: this is the shape a naive reader would
// treat as an issue, so it is the shape whose false positives we want to see.
const TOKEN = /\b([A-Z][A-Z0-9]{1,6})-(\d+)\b/g;

const args = process.argv.slice(2);
const arg = (name, fallback = null) => {
  const i = args.indexOf(`--${name}`);
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
};

const base = arg("base");
const head = arg("head");
const toolJsonPath = arg("tool-json");
const toolLogPath = arg("tool-log");
const label = arg("label", `${base}..${head}`);
const teamKeys = new Set(
  (arg("team-keys", "") || "")
    .split(",")
    .map((k) => k.trim().toUpperCase())
    .filter(Boolean),
);

if (!base || !head) {
  console.error("usage: --base <ref> --head <ref> [--tool-json <path>] [--tool-log <path>]");
  process.exit(2);
}

const git = (...a) => execFileSync("git", a, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });

const range = `${base}..${head}`;
const shas = git("rev-list", range).split("\n").filter(Boolean);
const subjects = shas.length ? git("log", "--format=%s", range).split("\n").filter(Boolean) : [];
const full = shas.length ? git("log", "--format=%s%n%b", range) : "";

const collect = (text) => {
  const found = new Set();
  for (const m of text.matchAll(TOKEN)) found.add(m[0].toUpperCase());
  return found;
};

const fromSubjects = collect(subjects.join("\n"));
const fromMessages = collect(full);

// Every string anywhere in the tool's JSON is searched, rather than one expected
// field. The output shape is not contractually documented, and a receipt that
// silently reported zero because it read the wrong key would be worse than none.
const walkStrings = (node, out = []) => {
  if (typeof node === "string") out.push(node);
  else if (Array.isArray(node)) for (const v of node) walkStrings(v, out);
  else if (node && typeof node === "object") for (const v of Object.values(node)) walkStrings(v, out);
  return out;
};

let toolIds = null;
let toolNote = "";
if (toolJsonPath && existsSync(toolJsonPath)) {
  const raw = readFileSync(toolJsonPath, "utf8").trim();
  if (!raw) {
    toolNote = "the dry run produced an empty JSON file";
  } else {
    try {
      toolIds = collect(walkStrings(JSON.parse(raw)).join("\n"));
    } catch (err) {
      toolNote = `the dry run's JSON did not parse (${err.message}); falling back to its text output`;
    }
  }
} else {
  toolNote = "no dry-run JSON was supplied";
}

if (toolIds === null && toolLogPath && existsSync(toolLogPath)) {
  toolIds = collect(readFileSync(toolLogPath, "utf8"));
  toolNote += toolNote ? "; identifiers taken from the text output instead" : "";
}

const sorted = (s) => [...s].sort();
const fmt = (s) => (s.size ? sorted(s).map((v) => `\`${v}\``).join(", ") : "_none_");
const suspects = (s) => new Set(sorted(s).filter((v) => !teamKeys.has(v.split("-")[0])));

const out = [];
out.push(`### Attribution receipt — ${label}`);
out.push("");
out.push(`\`${range}\` · **${shas.length}** commit(s) scanned`);
out.push("");
out.push("| Independent count | Identifiers |");
out.push("| -- | -- |");
out.push(`| From commit **subjects** only | ${fmt(fromSubjects)} |`);
out.push(`| From full commit **messages** | ${fmt(fromMessages)} |`);

if (teamKeys.size) {
  const bodyOnly = new Set(sorted(fromMessages).filter((v) => !fromSubjects.has(v)));
  const junk = suspects(fromMessages);
  out.push(`| Present in bodies but not subjects | ${fmt(bodyOnly)} |`);
  out.push(`| **Not a known team key** (false-positive shape) | ${fmt(junk)} |`);
}
out.push("");

if (toolIds === null) {
  out.push(`> Discovery not measured — ${toolNote}. Commit counts above still hold.`);
} else {
  const expected = fromSubjects;
  const matched = new Set(sorted(toolIds).filter((v) => expected.has(v)));
  const unexpected = new Set(sorted(toolIds).filter((v) => !expected.has(v)));
  const missing = new Set(sorted(expected).filter((v) => !toolIds.has(v)));

  out.push("| Measure | Value |");
  out.push("| -- | -- |");
  out.push(`| Commits scanned | ${shas.length} |`);
  out.push(`| Issues discovered by the dry run | ${toolIds.size} |`);
  out.push(`| Expected matched | ${matched.size}/${expected.size} |`);
  out.push(`| Unexpected (found, not expected) | ${unexpected.size} |`);
  out.push(`| Missing (expected, not found) | ${missing.size} |`);
  out.push("");
  out.push(`- Discovered: ${fmt(toolIds)}`);
  out.push(`- Unexpected: ${fmt(unexpected)}`);
  out.push(`- Missing: ${fmt(missing)}`);
  if (toolNote) out.push(`- Note: ${toolNote}.`);
  out.push("");
  out.push(
    unexpected.size === 0 && missing.size === 0
      ? "**Attribution agrees with the subject-only baseline.**"
      : "**Attribution diverges from the subject-only baseline** — read the two lists above before enabling live sync.",
  );
}

out.push("");
out.push("<details><summary>Commit subjects in range</summary>");
out.push("");
out.push(subjects.length ? subjects.map((s) => `- ${s}`).join("\n") : "_no commits in range_");
out.push("");
out.push("</details>");

console.log(out.join("\n"));
