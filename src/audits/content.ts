/** Content quality: depth, readability, image alts, link text. */

import { findings, type Audit } from "../audit.js";
import { fleschReadingEase, wordCount } from "../utils/text.js";

const GENERIC_LINKS = /^(click here|here|read more|learn more|this|link|more)\.?$/i;

export const contentAudit: Audit = {
  id: "content",
  category: "content",
  run({ doc, config }) {
    const f = findings("content", "content");
    const out = [];

    const wc = wordCount(doc.text);
    if (wc < config.thresholds.minWords) {
      out.push(
        f.warn("length", `Thin content (${wc} words)`, {
          weight: 2,
          fix: `Aim for at least ${config.thresholds.minWords} words of substantive content.`,
        }),
      );
    } else {
      out.push(f.pass("length", `Good content depth (${wc} words)`, { weight: 2 }));
    }

    if (wc >= 50) {
      const ease = fleschReadingEase(doc.text);
      if (ease >= 50) {
        out.push(f.pass("readability", `Readable (Flesch ${ease})`));
      } else if (ease >= 30) {
        out.push(f.warn("readability", `Fairly difficult to read (Flesch ${ease})`, { fix: "Shorten sentences and words." }));
      } else {
        out.push(f.warn("readability", `Hard to read (Flesch ${ease})`, { weight: 2, fix: "Simplify — short sentences, plain words." }));
      }
    }

    // Image alt coverage.
    const imgs = doc.images;
    if (imgs.length) {
      const missing = imgs.filter((i) => i.alt === null || i.alt.trim() === "").length;
      out.push(
        missing === 0
          ? f.pass("img-alt", `All ${imgs.length} image(s) have alt text`, { weight: 2 })
          : f.error("img-alt", `${missing}/${imgs.length} image(s) missing alt text`, {
              weight: 2,
              fix: "Add descriptive alt text — helps SEO and accessibility.",
            }),
      );
    }

    // Generic link text.
    const generic = doc.links.filter((l) => GENERIC_LINKS.test(l.text)).length;
    out.push(
      generic === 0
        ? f.pass("link-text", "Link text is descriptive")
        : f.warn("link-text", `${generic} non-descriptive link(s) like "click here"`, {
            fix: "Use descriptive anchor text that says where the link goes.",
          }),
    );

    return out;
  },
};
