/** Configuration loading & defaults. */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { AeolintConfig, Category } from "./types.js";

export const DEFAULT_CONFIG: AeolintConfig = {
  disableCategories: [],
  ignore: [],
  thresholds: {
    titleMin: 30,
    titleMax: 60,
    descriptionMin: 70,
    descriptionMax: 160,
    minWords: 300,
    maxDomNodes: 1500,
    maxBlockingScripts: 5,
    answerMaxChars: 320,
  },
  categoryWeights: {
    seo: 1,
    aeo: 1.3,
    "structured-data": 1.1,
    content: 1,
    headings: 0.8,
    performance: 0.8,
    crawlability: 0.7,
  },
  minScore: 0,
};

/** File names looked up automatically when no `--config` is passed. */
export const CONFIG_FILENAMES = ["aeolint.config.json", ".aeolintrc.json", ".aeolintrc"];

function deepMerge<T>(base: T, override: Partial<T>): T {
  const out = { ...base } as Record<string, unknown>;
  for (const [key, value] of Object.entries(override ?? {})) {
    const current = out[key];
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      current &&
      typeof current === "object" &&
      !Array.isArray(current)
    ) {
      out[key] = deepMerge(current, value as Record<string, unknown>);
    } else if (value !== undefined) {
      out[key] = value;
    }
  }
  return out as T;
}

/** Load and merge a config file over the defaults. */
export function loadConfig(explicitPath?: string, cwd = process.cwd()): AeolintConfig {
  let file: string | undefined = explicitPath ? resolve(cwd, explicitPath) : undefined;
  if (!file) {
    for (const name of CONFIG_FILENAMES) {
      const candidate = resolve(cwd, name);
      if (existsSync(candidate)) {
        file = candidate;
        break;
      }
    }
  }
  if (!file) return DEFAULT_CONFIG;
  if (!existsSync(file)) {
    throw new Error(`aeolint: config file not found: ${file}`);
  }
  let parsed: Partial<AeolintConfig>;
  try {
    parsed = JSON.parse(readFileSync(file, "utf8")) as Partial<AeolintConfig>;
  } catch (e) {
    throw new Error(`aeolint: invalid JSON in config ${file}: ${(e as Error).message}`);
  }
  return deepMerge(DEFAULT_CONFIG, parsed);
}

export function isCategoryEnabled(config: AeolintConfig, category: Category): boolean {
  return !config.disableCategories.includes(category);
}
