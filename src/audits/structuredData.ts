/**
 * Structured data audit: JSON-LD presence & validity, plus **Google rich-result
 * eligibility** — for every recognised schema.org type, check the required and
 * recommended properties Google documents for that feature and report whether
 * the page would actually win the rich result. See ../richResults.ts.
 */

import { findings, type Audit } from "../audit.js";
import { collectNodes, evaluateRichResults } from "../richResults.js";

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
          fix: "Add schema.org JSON-LD (e.g. Article, Product, FAQPage) so engines understand the page and can render rich results.",
        }),
      );
      return out;
    }

    // 1. Valid JSON.
    const broken = doc.jsonLd.filter((b) => b.error);
    if (broken.length) {
      out.push(
        f.error("valid", `${broken.length} JSON-LD block(s) contain invalid JSON`, {
          weight: 3,
          detail: broken[0]?.error,
          fix: "Fix the JSON syntax — broken structured data is ignored entirely by search engines.",
        }),
      );
    } else {
      out.push(f.pass("valid", "All JSON-LD blocks are valid JSON", { weight: 2 }));
    }

    // 2. Detected types.
    const types = new Set<string>();
    for (const block of doc.jsonLd) if (block.data) collectTypes(block.data, types);
    out.push(
      types.size
        ? f.pass("types", `Detected schema types: ${[...types].join(", ")}`, { weight: 2 })
        : f.warn("types", "JSON-LD present but no @type detected", {
            weight: 2,
            fix: "Give each JSON-LD object an @type (e.g. \"@type\": \"Article\").",
          }),
    );

    // 3. Rich-result eligibility per recognised feature (the deep check).
    const nodes = doc.jsonLd.flatMap((b) => (b.data ? collectNodes(b.data) : []));
    const evals = evaluateRichResults(nodes);

    if (evals.length === 0) {
      out.push(
        f.info("rich", "No rich-result-eligible types detected (Article, Product, FAQPage, …)", {
          fix: "If this page is an article, product, FAQ, recipe, event, etc., add the matching schema.org type to qualify for a rich result.",
        }),
      );
    }

    for (const e of evals) {
      const slug = e.type.toLowerCase();
      if (!e.eligible) {
        out.push(
          f.error(`rich.${slug}`, `${e.feature} (${e.type}) is NOT eligible for a rich result`, {
            weight: 3,
            detail: `Missing required: ${e.missingRequired.join(", ")}`,
            fix: `Add the required propertie(s) so Google can render the ${e.feature} rich result. See ${e.doc}`,
          }),
        );
        continue;
      }

      if (e.missingRecommended.length) {
        out.push(
          f.warn(`rich.${slug}`, `${e.feature} (${e.type}) is eligible, but missing recommended fields`, {
            weight: 2,
            detail: `Recommended: ${e.missingRecommended.join(", ")}`,
            fix: `Add the recommended propertie(s) for a richer ${e.feature} result. See ${e.doc}`,
          }),
        );
      } else {
        out.push(
          f.pass(`rich.${slug}`, `${e.feature} (${e.type}) is eligible for a rich result`, {
            weight: 3,
          }),
        );
      }
    }

    return out;
  },
};
