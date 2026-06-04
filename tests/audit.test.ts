import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { auditPage, buildReport, type AuditInput } from "../src/index.js";
import { DEFAULT_CONFIG } from "../src/config.js";

const good = readFileSync(resolve(__dirname, "../examples/good.html"), "utf8");
const bad = readFileSync(resolve(__dirname, "../examples/bad.html"), "utf8");

/** IDs of findings that are problems (error/warning), ignoring passes/info. */
function problemIds(input: AuditInput) {
  return new Set(
    auditPage(input)
      .findings.filter((f) => f.severity === "error" || f.severity === "warning")
      .map((f) => f.id),
  );
}

describe("end-to-end audit", () => {
  it("scores an optimized page much higher than a poor one", () => {
    const g = auditPage({ source: "good", html: good });
    const b = auditPage({ source: "bad", html: bad });
    expect(g.score).toBeGreaterThan(b.score);
    expect(g.grade).toBe("A");
    expect(b.grade).toBe("F");
  });

  it("flags the obvious problems in the bad page", () => {
    const found = problemIds({ source: "bad", html: bad });
    expect(found).toContain("meta.title");
    expect(found).toContain("meta.description");
    // The bad page's Product lacks offers/review/aggregateRating → not eligible.
    expect(found).toContain("schema.rich.product");
    expect(found).toContain("crawl.noindex");
  });

  it("does not flag those problems on the good page", () => {
    const found = problemIds({ source: "good", html: good });
    expect(found).not.toContain("meta.title");
    expect(found).not.toContain("crawl.noindex");
  });

  it("produces deterministic results (same input → same score)", () => {
    const a = auditPage({ source: "good", html: good });
    const b = auditPage({ source: "good", html: good });
    expect(a.score).toBe(b.score);
    expect(a.findings.length).toBe(b.findings.length);
  });

  it("honours disableCategories and ignore", () => {
    const noSeo = auditPage(
      { source: "bad", html: bad },
      { ...DEFAULT_CONFIG, disableCategories: ["seo"] },
    );
    expect(noSeo.findings.some((f) => f.category === "seo")).toBe(false);

    const ignored = auditPage(
      { source: "bad", html: bad },
      { ...DEFAULT_CONFIG, ignore: ["meta.title-missing"] },
    );
    expect(ignored.findings.some((f) => f.id === "meta.title-missing")).toBe(false);
  });

  it("builds a multi-page report summary", () => {
    const pages = [
      auditPage({ source: "good", html: good }),
      auditPage({ source: "bad", html: bad }),
    ];
    const report = buildReport(pages, "9.9.9");
    expect(report.tool).toBe("aeolint");
    expect(report.version).toBe("9.9.9");
    expect(report.summary.pages).toBe(2);
    expect(report.summary.errors).toBeGreaterThan(0);
  });
});
