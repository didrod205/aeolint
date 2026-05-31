import { describe, it, expect } from "vitest";
import { auditPage, buildReport, toJSON, toMarkdown } from "../src/index.js";

const html = `<!doctype html><html lang="en"><head>
<title>How to Make Sourdough Bread at Home Step by Step</title>
<meta name="description" content="A friendly, complete guide to baking your first loaf of sourdough bread at home with a simple starter and schedule." />
</head><body><h1>Sourdough</h1><p>Mix flour and water.</p></body></html>`;

const report = buildReport([auditPage({ source: "page.html", html })], "1.2.3");

describe("JSON report", () => {
  it("round-trips through JSON.parse", () => {
    const parsed = JSON.parse(toJSON(report));
    expect(parsed.tool).toBe("aeolint");
    expect(parsed.version).toBe("1.2.3");
    expect(parsed.pages).toHaveLength(1);
    expect(parsed.pages[0].source).toBe("page.html");
  });

  it("is stable / pretty-printed", () => {
    expect(toJSON(report)).toContain("\n  ");
  });
});

describe("Markdown report", () => {
  const md = toMarkdown(report);
  it("includes the overall score and per-page section", () => {
    expect(md).toContain("# aeolint report");
    expect(md).toMatch(/Overall: \d+\/100/);
    expect(md).toContain("page.html");
  });
});
