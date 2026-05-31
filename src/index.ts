/**
 * aeolint — audit HTML/Markdown for SEO, answer-engine (AEO/GEO) readiness,
 * structured data, content quality, headings, performance risk and crawlability.
 *
 * This module is the programmatic API; see `cli.ts` for the command line.
 */

import { AUDITS } from "./audits/index.js";
import { DEFAULT_CONFIG } from "./config.js";
import { parseDocument } from "./parse.js";
import { gradeFor, overallScore, scoreCategory } from "./score.js";
import { CATEGORIES, type AeolintConfig, type Finding, type PageReport, type Report } from "./types.js";

export * from "./types.js";
export { AUDITS } from "./audits/index.js";
export { DEFAULT_CONFIG, loadConfig } from "./config.js";
export { parseDocument } from "./parse.js";
export { gradeFor } from "./score.js";
export { toJSON } from "./report/json.js";
export { toMarkdown } from "./report/markdown.js";

export interface AuditInput {
  source: string;
  html: string;
  robots?: string | null;
  sitemap?: string | null;
}

/** Audit a single page and produce its report. */
export function auditPage(input: AuditInput, config: AeolintConfig = DEFAULT_CONFIG): PageReport {
  const doc = parseDocument(input.html);
  const ctx = {
    source: input.source,
    doc,
    config,
    robots: input.robots ?? null,
    sitemap: input.sitemap ?? null,
  };

  const findings: Finding[] = [];
  for (const audit of AUDITS) {
    if (config.disableCategories.includes(audit.category)) continue;
    for (const finding of audit.run(ctx)) {
      if (!config.ignore.includes(finding.id)) findings.push(finding);
    }
  }

  const categories = CATEGORIES.filter((c) => !config.disableCategories.includes(c))
    .map((c) => scoreCategory(findings, c))
    .filter((cs) => findings.some((f) => f.category === cs.category && f.severity !== "info"));

  const score = overallScore(categories, config);
  return { source: input.source, title: doc.title, score, grade: gradeFor(score), findings, categories };
}

/** Audit many pages and assemble a full report. */
export function buildReport(pages: PageReport[], version = "0.0.0", now = new Date()): Report {
  const errors = pages.reduce((s, p) => s + p.findings.filter((f) => f.severity === "error").length, 0);
  const warnings = pages.reduce((s, p) => s + p.findings.filter((f) => f.severity === "warning").length, 0);
  const score = pages.length ? Math.round(pages.reduce((s, p) => s + p.score, 0) / pages.length) : 100;
  return {
    tool: "aeolint",
    version,
    generatedAt: now.toISOString(),
    summary: { pages: pages.length, score, grade: gradeFor(score), errors, warnings },
    pages,
  };
}
