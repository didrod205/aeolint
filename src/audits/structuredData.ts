/** Structured data (JSON-LD / schema.org) presence and completeness. */

import { findings, type Audit } from "../audit.js";

function collectTypes(data: unknown, acc: Set<string>): void {
  if (Array.isArray(data)) {
    for (const item of data) collectTypes(item, acc);
    return;
  }
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    const t = obj["@type"];
    if (typeof t === "string") acc.add(t);
    else if (Array.isArray(t)) for (const v of t) if (typeof v === "string") acc.add(v);
    if (Array.isArray(obj["@graph"])) collectTypes(obj["@graph"], acc);
  }
}

function findNode(data: unknown, type: string): Record<string, unknown> | null {
  if (Array.isArray(data)) {
    for (const item of data) {
      const r = findNode(item, type);
      if (r) return r;
    }
    return null;
  }
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    const t = obj["@type"];
    if (t === type || (Array.isArray(t) && t.includes(type))) return obj;
    if (Array.isArray(obj["@graph"])) return findNode(obj["@graph"], type);
  }
  return null;
}

export const structuredDataAudit: Audit = {
  id: "schema",
  category: "structured-data",
  run({ doc }) {
    const f = findings("schema", "structured-data");
    const out = [];

    if (doc.jsonLd.length === 0) {
      out.push(
        f.error("present", "No JSON-LD structured data found", {
          weight: 3,
          fix: "Add schema.org JSON-LD (e.g. Article, Product, FAQPage) so engines understand the page.",
        }),
      );
      return out;
    }

    const broken = doc.jsonLd.filter((b) => b.error);
    if (broken.length) {
      out.push(
        f.error("valid", `${broken.length} JSON-LD block(s) contain invalid JSON`, {
          weight: 3,
          detail: broken[0]?.error,
          fix: "Fix the JSON syntax — broken structured data is ignored by search engines.",
        }),
      );
    } else {
      out.push(f.pass("valid", "All JSON-LD blocks are valid JSON", { weight: 2 }));
    }

    const types = new Set<string>();
    for (const block of doc.jsonLd) if (block.data) collectTypes(block.data, types);
    out.push(
      types.size
        ? f.pass("types", `Detected schema types: ${[...types].join(", ")}`, { weight: 2 })
        : f.warn("types", "JSON-LD present but no @type detected", { weight: 2 }),
    );

    // Article completeness.
    const article =
      doc.jsonLd.map((b) => findNode(b.data, "Article")).find(Boolean) ??
      doc.jsonLd.map((b) => findNode(b.data, "BlogPosting")).find(Boolean);
    if (article) {
      const missing = ["headline", "author", "datePublished"].filter((k) => !article[k]);
      out.push(
        missing.length
          ? f.warn("article", `Article schema is missing: ${missing.join(", ")}`, {
              fix: "Add headline, author and datePublished for richer article results.",
            })
          : f.pass("article", "Article schema has the key fields"),
      );
    }

    // FAQPage — a strong answer-engine signal.
    const faq = doc.jsonLd.map((b) => findNode(b.data, "FAQPage")).find(Boolean);
    out.push(
      faq
        ? f.pass("faq", "FAQPage schema present (great for AI answers)", { weight: 2 })
        : f.info("faq", "No FAQPage schema — consider adding one if the page answers questions"),
    );

    return out;
  },
};
