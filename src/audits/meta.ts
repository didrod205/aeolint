/** SEO basics: title, description, canonical, lang, viewport, social cards. */

import { findings, type Audit } from "../audit.js";

export const metaAudit: Audit = {
  id: "meta",
  category: "seo",
  run({ doc, config }) {
    const f = findings("meta", "seo");
    const out = [];
    const t = config.thresholds;

    const title = doc.title;
    if (!title) {
      out.push(f.error("title", "Missing <title> tag", { weight: 3, fix: "Add a unique, descriptive <title>." }));
    } else if (title.length < t.titleMin) {
      out.push(
        f.warn("title", `Title is short (${title.length} chars)`, {
          weight: 2,
          detail: title,
          fix: `Aim for ${t.titleMin}–${t.titleMax} characters.`,
        }),
      );
    } else if (title.length > t.titleMax) {
      out.push(
        f.warn("title", `Title may be truncated in results (${title.length} chars)`, {
          weight: 2,
          detail: title,
          fix: `Keep it under ${t.titleMax} characters.`,
        }),
      );
    } else {
      out.push(f.pass("title", `Title length looks good (${title.length} chars)`, { weight: 3 }));
    }

    const desc = doc.metaName("description");
    if (!desc) {
      out.push(
        f.error("description", "Missing meta description", {
          weight: 3,
          fix: "Add a <meta name=\"description\"> that summarizes the page.",
        }),
      );
    } else if (desc.length < t.descriptionMin || desc.length > t.descriptionMax) {
      out.push(
        f.warn("description", `Meta description length is off (${desc.length} chars)`, {
          weight: 2,
          detail: desc,
          fix: `Aim for ${t.descriptionMin}–${t.descriptionMax} characters.`,
        }),
      );
    } else {
      out.push(f.pass("description", "Meta description length looks good", { weight: 3 }));
    }

    out.push(
      doc.lang
        ? f.pass("lang", `Document language declared (lang="${doc.lang}")`)
        : f.warn("lang", "Missing <html lang> attribute", {
            fix: 'Add lang to <html>, e.g. <html lang="en">.',
          }),
    );

    out.push(
      doc.hasViewport()
        ? f.pass("viewport", "Responsive viewport meta present")
        : f.warn("viewport", "Missing viewport meta", {
            fix: 'Add <meta name="viewport" content="width=device-width, initial-scale=1">.',
          }),
    );

    out.push(
      doc.hasCharset()
        ? f.pass("charset", "Character encoding declared")
        : f.warn("charset", "Missing charset declaration", { fix: 'Add <meta charset="utf-8">.' }),
    );

    out.push(
      doc.canonical()
        ? f.pass("canonical", "Canonical URL present", { weight: 2 })
        : f.warn("canonical", "Missing canonical link", {
            weight: 2,
            fix: 'Add <link rel="canonical" href="..."> to avoid duplicate-content issues.',
          }),
    );

    const ogTitle = doc.metaProperty("og:title");
    const ogDesc = doc.metaProperty("og:description");
    const ogImage = doc.metaProperty("og:image");
    if (ogTitle && ogDesc && ogImage) {
      out.push(f.pass("og", "Open Graph tags present (title, description, image)", { weight: 2 }));
    } else {
      out.push(
        f.warn("og", "Incomplete Open Graph tags", {
          weight: 2,
          detail: `missing: ${[!ogTitle && "og:title", !ogDesc && "og:description", !ogImage && "og:image"].filter(Boolean).join(", ")}`,
          fix: "Add og:title, og:description and og:image for rich link previews.",
        }),
      );
    }

    return out;
  },
};
