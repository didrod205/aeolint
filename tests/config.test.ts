import { describe, it, expect } from "vitest";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DEFAULT_CONFIG, loadConfig, isCategoryEnabled } from "../src/config.js";

function withTempDir(fn: (dir: string) => void) {
  const dir = mkdtempSync(join(tmpdir(), "aeolint-"));
  try {
    fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

describe("loadConfig", () => {
  it("returns defaults when no config file is present", () => {
    withTempDir((dir) => {
      expect(loadConfig(undefined, dir)).toEqual(DEFAULT_CONFIG);
    });
  });

  it("deep-merges a config file over the defaults", () => {
    withTempDir((dir) => {
      writeFileSync(
        join(dir, "aeolint.config.json"),
        JSON.stringify({ minScore: 80, thresholds: { minWords: 500 } }),
      );
      const cfg = loadConfig(undefined, dir);
      expect(cfg.minScore).toBe(80);
      expect(cfg.thresholds.minWords).toBe(500);
      // untouched threshold keeps its default
      expect(cfg.thresholds.titleMax).toBe(DEFAULT_CONFIG.thresholds.titleMax);
    });
  });

  it("throws a clear error on invalid JSON", () => {
    withTempDir((dir) => {
      const file = join(dir, "broken.json");
      writeFileSync(file, "{ not json ");
      expect(() => loadConfig(file, dir)).toThrow(/invalid JSON/);
    });
  });

  it("throws when an explicit config path is missing", () => {
    withTempDir((dir) => {
      expect(() => loadConfig("does-not-exist.json", dir)).toThrow(/not found/);
    });
  });
});

describe("isCategoryEnabled", () => {
  it("reflects disableCategories", () => {
    expect(isCategoryEnabled(DEFAULT_CONFIG, "seo")).toBe(true);
    expect(
      isCategoryEnabled({ ...DEFAULT_CONFIG, disableCategories: ["seo"] }, "seo"),
    ).toBe(false);
  });
});
