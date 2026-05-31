import { describe, it, expect } from "vitest";
import { parseDocument } from "../src/parse.js";

const HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>  Sample Title  </title>
    <meta name="description" content="A description." />
    <meta property="og:title" content="OG Title" />
    <link rel="canonical" href="https://example.com/x" />
    <script type="application/ld+json">{"@type":"Article"}</script>
    <script type="application/ld+json">{bad json}</script>
    <style>.a{color:red}</style>
  </head>
  <body>
    <h1>Heading One</h1>
    <h2>How does it work?</h2>
    <p>Some visible text. <script>var hidden = 1;</script></p>
    <img src="/a.png" alt="A" width="10" height="10" loading="lazy" />
    <img src="/b.png" />
    <a href="/link">anchor</a>
    <script src="/app.js" defer></script>
  </body>
</html>`;

describe("parseDocument", () => {
  const doc = parseDocument(HTML);

  it("extracts title (trimmed) and lang", () => {
    expect(doc.title).toBe("Sample Title");
    expect(doc.lang).toBe("en");
  });

  it("excludes script contents from visible text", () => {
    expect(doc.text).toContain("Some visible text");
    expect(doc.text).not.toContain("hidden");
  });

  it("collects headings with levels", () => {
    expect(doc.headings).toEqual([
      { level: 1, text: "Heading One" },
      { level: 2, text: "How does it work?" },
    ]);
  });

  it("collects images with attributes", () => {
    expect(doc.images).toHaveLength(2);
    expect(doc.images[0]).toMatchObject({ alt: "A", width: "10", loading: "lazy" });
    expect(doc.images[1]?.alt).toBeNull();
  });

  it("parses JSON-LD blocks and records parse errors", () => {
    expect(doc.jsonLd).toHaveLength(2);
    expect(doc.jsonLd[0]?.data).toEqual({ "@type": "Article" });
    expect(doc.jsonLd[1]?.data).toBeNull();
    expect(doc.jsonLd[1]?.error).toBeTruthy();
  });

  it("exposes meta + head helpers", () => {
    expect(doc.metaName("description")).toBe("A description.");
    expect(doc.metaProperty("og:title")).toBe("OG Title");
    expect(doc.canonical()).toBe("https://example.com/x");
    expect(doc.hasViewport()).toBe(true);
    expect(doc.hasCharset()).toBe(true);
  });

  it("counts external + inline scripts", () => {
    // one ld+json, one inline (hidden var), one external app.js
    expect(doc.scripts.length).toBeGreaterThanOrEqual(2);
    expect(doc.scripts.some((s) => s.src === "/app.js" && s.defer)).toBe(true);
  });
});
