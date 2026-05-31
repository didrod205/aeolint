#!/usr/bin/env node
/** aeolint command-line interface. */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { cac } from "cac";
import pkg from "../package.json";
import { DEFAULT_CONFIG, loadConfig } from "./config.js";
import { auditPage, buildReport } from "./index.js";
import { loadInputs } from "./loader.js";
import { printReport } from "./report/console.js";
import { toJSON } from "./report/json.js";
import { toMarkdown } from "./report/markdown.js";
import type { Report } from "./types.js";

const CONFIG_FILE = "aeolint.config.json";
const cli = cac("aeolint");

interface ScanOptions {
  config?: string;
  json?: string;
  md?: string;
  minScore?: string;
  quiet?: boolean;
}

cli
  .command("scan [...targets]", "Audit HTML/Markdown files, a directory, or a URL")
  .option("--config <file>", "Path to a config file")
  .option("--json <file>", "Write a JSON report to this path")
  .option("--md <file>", "Write a Markdown report to this path")
  .option("--min-score <n>", "Exit non-zero if the overall score is below this (CI gate)")
  .option("--quiet", "Only show errors and warnings")
  .example("aeolint scan ./public --md report.md")
  .example("aeolint scan https://example.com --min-score 80")
  .action(async (targets: string[], options: ScanOptions) => {
    if (!targets || targets.length === 0) {
      console.error("aeolint: provide at least one target (file, directory, or URL).");
      process.exit(2);
    }
    try {
      const config = loadConfig(options.config);
      const minScore = options.minScore !== undefined ? Number(options.minScore) : config.minScore;
      const inputs = await loadInputs(targets);
      const pages = inputs.map((input) => auditPage(input, config));
      const report = buildReport(pages, pkg.version);

      printReport(report, Boolean(options.quiet));
      if (options.json) {
        writeFileSync(resolve(options.json), toJSON(report));
        console.log(`\nWrote JSON report → ${options.json}`);
      }
      if (options.md) {
        writeFileSync(resolve(options.md), toMarkdown(report));
        console.log(`Wrote Markdown report → ${options.md}`);
      }
      if (report.summary.score < minScore) {
        console.error(`\naeolint: score ${report.summary.score} is below the minimum ${minScore}.`);
        process.exit(1);
      }
    } catch (e) {
      console.error(`aeolint: ${(e as Error).message}`);
      process.exit(2);
    }
  });

cli
  .command("report <input>", "Render a saved JSON report as Markdown")
  .option("--md <file>", "Write Markdown to this path instead of stdout")
  .action((input: string, options: { md?: string }) => {
    try {
      const report = JSON.parse(readFileSync(resolve(input), "utf8")) as Report;
      const md = toMarkdown(report);
      if (options.md) {
        writeFileSync(resolve(options.md), md);
        console.log(`Wrote ${options.md}`);
      } else {
        process.stdout.write(md);
      }
    } catch (e) {
      console.error(`aeolint: ${(e as Error).message}`);
      process.exit(2);
    }
  });

cli
  .command("init", "Create an aeolint config file with the defaults")
  .option("--force", "Overwrite an existing config")
  .action((options: { force?: boolean }) => {
    const file = resolve(CONFIG_FILE);
    if (existsSync(file) && !options.force) {
      console.error(`aeolint: ${CONFIG_FILE} already exists (use --force to overwrite).`);
      process.exit(1);
    }
    writeFileSync(file, JSON.stringify(DEFAULT_CONFIG, null, 2) + "\n");
    console.log(`Created ${CONFIG_FILE}`);
  });

cli.help();
cli.version(pkg.version);
cli.parse();
