import { readdirSync } from "node:fs";
import { join } from "node:path";

import type { DbtModel } from "./join.js";

interface ManifestNode {
  resource_type?: string;
  unique_id?: string;
  original_file_path?: string;
}

export interface DbtManifest {
  nodes?: Record<string, ManifestNode>;
}

/** Extract model nodes (resource_type === "model") from a parsed manifest.json. */
export function extractModels(manifest: DbtManifest): DbtModel[] {
  const models: DbtModel[] = [];
  for (const node of Object.values(manifest.nodes ?? {})) {
    if (node.resource_type === "model" && node.original_file_path) {
      models.push({
        uniqueId: node.unique_id ?? node.original_file_path,
        originalFilePath: node.original_file_path,
      });
    }
  }
  return models;
}

const DEFAULT_IGNORE = new Set(["node_modules", ".git", "target", "dbt_packages", "dist"]);

/**
 * Enumerate every dbt project under `root` — a directory containing a
 * `dbt_project.yml`. VR-640's multi-project guard: real repos hold more than one
 * dbt project, so the shim must never assume a single knowable project dir.
 */
export function findDbtProjects(root: string, ignore: Set<string> = DEFAULT_IGNORE): string[] {
  const found: string[] = [];
  const walk = (dir: string): void => {
    let entries: ReturnType<typeof readdirSync>;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return; // unreadable dir — skip, don't crash the sweep
    }
    for (const entry of entries) {
      if (entry.isFile() && entry.name === "dbt_project.yml") {
        found.push(dir);
      } else if (entry.isDirectory() && !ignore.has(entry.name)) {
        walk(join(dir, entry.name));
      }
    }
  };
  walk(root);
  return found.sort();
}
