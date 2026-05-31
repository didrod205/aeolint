/** Crawlability: indexability, canonical, robots.txt and sitemap (URL scans). */

import { findings, type Audit } from "../audit.js";

export const crawlabilityAudit: Audit = {
  id: "crawl",
  category: "crawlability",
  run({ doc, robots, sitemap }) {
    const f = findings("crawl", "crawlability");
    const out = [];

    const metaRobots = (doc.metaRobots() ?? "").toLowerCase();
    if (metaRobots.includes("noindex")) {
      out.push(
        f.error("noindex", "Page is set to noindex", {
          weight: 3,
          detail: metaRobots,
          fix: "Remove noindex if this page should appear in search.",
        }),
      );
    } else {
      out.push(f.pass("indexable", "Page is indexable (no noindex)", { weight: 2 }));
    }

    out.push(
      doc.canonical()
        ? f.pass("canonical", "Canonical URL declared")
        : f.warn("canonical", "No canonical URL", { fix: "Add a self-referential canonical link." }),
    );

    // robots.txt / sitemap checks only apply when fetched from a URL.
    if (robots !== null) {
      const hasSitemapDirective = /^\s*sitemap:/im.test(robots);
      out.push(
        hasSitemapDirective
          ? f.pass("robots-sitemap", "robots.txt references a sitemap")
          : f.warn("robots-sitemap", "robots.txt has no Sitemap directive", {
              fix: "Add `Sitemap: https://site/sitemap.xml` to robots.txt.",
            }),
      );
      if (/^\s*disallow:\s*\/\s*$/im.test(robots) && !/allow:/i.test(robots)) {
        out.push(
          f.error("robots-block", "robots.txt disallows the entire site", {
            weight: 3,
            fix: "Remove `Disallow: /` unless you really want to block all crawlers.",
          }),
        );
      }
    }

    if (sitemap !== null) {
      const urls = (sitemap.match(/<loc>/g) ?? []).length;
      out.push(
        urls > 0
          ? f.pass("sitemap", `Sitemap found with ${urls} URL(s)`)
          : f.warn("sitemap", "Sitemap is empty or invalid", { fix: "Generate a valid XML sitemap with <url><loc> entries." }),
      );
    }

    return out;
  },
};
