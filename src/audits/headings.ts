/** Heading structure: single H1, no skipped levels, no empty headings. */

import { findings, type Audit } from "../audit.js";

export const headingsAudit: Audit = {
  id: "headings",
  category: "headings",
  run({ doc }) {
    const f = findings("headings", "headings");
    const out = [];
    const h1s = doc.headings.filter((h) => h.level === 1);

    if (h1s.length === 0) {
      out.push(f.error("h1", "No <h1> on the page", { weight: 3, fix: "Add exactly one descriptive <h1>." }));
    } else if (h1s.length > 1) {
      out.push(
        f.warn("h1", `Multiple <h1> tags (${h1s.length})`, {
          weight: 2,
          fix: "Use a single <h1>; demote the rest to <h2>.",
        }),
      );
    } else {
      out.push(f.pass("h1", "Exactly one <h1>", { weight: 3 }));
    }

    // Skipped levels (e.g. h2 → h4).
    let skipped = false;
    let prev = 0;
    for (const h of doc.headings) {
      if (prev && h.level > prev + 1) skipped = true;
      prev = h.level;
    }
    out.push(
      skipped
        ? f.warn("order", "Heading levels are skipped", {
            weight: 2,
            fix: "Don't jump levels (e.g. H2 → H4); keep the outline sequential.",
          })
        : f.pass("order", "Heading hierarchy is sequential", { weight: 2 }),
    );

    const empty = doc.headings.filter((h) => h.text.length === 0).length;
    out.push(
      empty
        ? f.warn("empty", `${empty} empty heading(s)`, { fix: "Remove empty headings or give them text." })
        : f.pass("empty", "No empty headings"),
    );

    return out;
  },
};
