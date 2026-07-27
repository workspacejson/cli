#!/usr/bin/env node

import { spawnSync } from "node:child_process";

// The repository `.npmrc` reads `//registry.npmjs.org/:_authToken=${NPM_TOKEN}`,
// and npm's project config outranks the userconfig `setup-node` writes. If
// NPM_TOKEN is missing npm does not fall back — it sends the literal string
// `Bearer ${NPM_TOKEN}` and the registry answers 401, which looks identical to a
// revoked or mistyped token. Checking the variable first turns half an hour of
// suspecting the credential into one accurate line.
const token = process.env.NPM_TOKEN;
if (!token || token.startsWith("${")) {
  console.error(
    token
      ? `NPM_TOKEN is present but unexpanded (${JSON.stringify(token)}). The repository .npmrc interpolates it, so npm would send that literal text as the bearer token and the registry would reject it as 401.`
      : "NPM_TOKEN is not set. The repository .npmrc interpolates it, so npm would send the literal text \"${NPM_TOKEN}\" as the bearer token and the registry would reject it as 401 — which reads as a bad credential rather than a missing one.",
  );
  process.exit(1);
}

const username = JSON.parse(run("npm", ["whoami", "--json"]));

// `npm access` reports package visibility or package enumeration; it does not
// reliably expose a granular token's effective publish grants. `whoami` proves
// that the workflow delivered the credential. npm then authorizes the actual
// publish, and the following registry-install verification proves its result.
console.log(`Verified npm publisher identity: ${username}`);

function run(command, args) {
  const result = spawnSync(command, args, { encoding: "utf8" });
  process.stdout.write(result.stdout);
  process.stderr.write(result.stderr);
  if (result.status !== 0) process.exit(result.status ?? 1);
  return result.stdout.trim();
}
