/** The audit interface, context, and a small Finding factory. */

import type { ParsedDocument } from "./parse.js";
import type { AeolintConfig, Category, Finding, Severity } from "./types.js";

export interface AuditContext {
  source: string;
  doc: ParsedDocument;
  config: AeolintConfig;
  /** robots.txt content, when available (URL scans). */
  robots: string | null;
  /** sitemap.xml content, when available (URL scans). */
  sitemap: string | null;
}

export interface Audit {
  id: string;
  category: Category;
  run(ctx: AuditContext): Finding[];
}

interface FindingOptions {
  detail?: string;
  fix?: string;
  weight?: number;
}

/** Build severity-tagged findings with a shared `audit`/`category`. */
export function findings(audit: string, category: Category) {
  const make =
    (severity: Severity) =>
    (id: string, message: string, opts: FindingOptions = {}): Finding => ({
      id: `${audit}.${id}`,
      audit,
      category,
      severity,
      message,
      detail: opts.detail,
      fix: opts.fix,
      weight: opts.weight ?? 1,
    });
  return {
    pass: make("pass"),
    warn: make("warning"),
    error: make("error"),
    info: make("info"),
  };
}
