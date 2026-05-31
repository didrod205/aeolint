/** Static performance-risk heuristics (no headless browser needed). */

import { findings, type Audit } from "../audit.js";

export const performanceAudit: Audit = {
  id: "perf",
  category: "performance",
  run({ doc, config }) {
    const f = findings("perf", "performance");
    const out = [];
    const t = config.thresholds;

    // Render-blocking scripts (sync <script src> with no async/defer).
    const blocking = doc.scripts.filter((s) => s.src && !s.async && !s.defer).length;
    out.push(
      blocking <= t.maxBlockingScripts
        ? f.pass("blocking", `Few render-blocking scripts (${blocking})`)
        : f.warn("blocking", `${blocking} render-blocking scripts`, {
            weight: 2,
            fix: "Add async/defer or move scripts to the end of <body>.",
          }),
    );

    // Images without explicit dimensions → layout shift (CLS) risk.
    const noDims = doc.images.filter((i) => !i.width || !i.height).length;
    if (doc.images.length) {
      out.push(
        noDims === 0
          ? f.pass("dimensions", "All images have width/height (no layout shift)", { weight: 2 })
          : f.warn("dimensions", `${noDims} image(s) missing width/height (CLS risk)`, {
              weight: 2,
              fix: "Set width and height (or aspect-ratio) on images to prevent layout shift.",
            }),
      );

      const lazy = doc.images.filter((i) => (i.loading ?? "") === "lazy").length;
      out.push(
        lazy > 0 || doc.images.length <= 2
          ? f.pass("lazy", "Images use lazy-loading where appropriate")
          : f.info("lazy", "Consider loading=\"lazy\" on below-the-fold images"),
      );

      const base64 = doc.images.filter((i) => i.src.startsWith("data:")).length;
      if (base64) {
        out.push(
          f.warn("base64", `${base64} base64-inlined image(s)`, {
            fix: "Large data: URIs bloat the HTML and block rendering — serve real image files.",
          }),
        );
      }
    }

    // Big inline blobs.
    const inlineScript = doc.scripts.reduce((s, x) => s + x.inlineLength, 0);
    if (inlineScript > 50_000) {
      out.push(
        f.warn("inline-js", `Large inline script (${Math.round(inlineScript / 1024)} KB)`, {
          fix: "Move large inline JS to a cacheable external file.",
        }),
      );
    }
    if (doc.inlineStyleLength > 50_000) {
      out.push(
        f.warn("inline-css", `Large inline CSS (${Math.round(doc.inlineStyleLength / 1024)} KB)`, {
          fix: "Extract large inline CSS to an external stylesheet.",
        }),
      );
    }

    // DOM size.
    out.push(
      doc.domNodeCount <= t.maxDomNodes
        ? f.pass("dom", `Reasonable DOM size (${doc.domNodeCount} nodes)`)
        : f.warn("dom", `Large DOM (${doc.domNodeCount} nodes)`, {
            fix: `Keep the DOM under ~${t.maxDomNodes} nodes for snappy rendering.`,
          }),
    );

    return out;
  },
};
