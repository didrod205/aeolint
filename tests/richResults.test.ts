import { describe, expect, it } from "vitest";
import { collectNodes, evaluateRichResults } from "../src/richResults.js";

function evalOf(jsonLd: unknown) {
  return evaluateRichResults(collectNodes(jsonLd));
}

describe("collectNodes", () => {
  it("collects top-level items and @graph members, not nested properties", () => {
    const data = {
      "@graph": [
        { "@type": "Article", author: { "@type": "Person", name: "X" } },
        { "@type": "WebSite", url: "https://x.com" },
      ],
    };
    const nodes = collectNodes(data);
    const types = nodes.flatMap((n) => n.types).sort();
    // Person (nested under author) must NOT be collected as a standalone item.
    expect(types).toEqual(["Article", "WebSite"]);
  });

  it("handles a bare array of items", () => {
    expect(collectNodes([{ "@type": "FAQPage" }, { "@type": "Product" }])).toHaveLength(2);
  });
});

describe("evaluateRichResults — Product", () => {
  it("is NOT eligible without offers/review/aggregateRating", () => {
    const [e] = evalOf({ "@type": "Product", name: "Widget" });
    expect(e?.eligible).toBe(false);
    expect(e?.missingRequired.join()).toContain("one of: offers");
  });

  it("is eligible with a complete offer", () => {
    const [e] = evalOf({
      "@type": "Product",
      name: "Widget",
      offers: { "@type": "Offer", price: "9.99", priceCurrency: "USD" },
    });
    expect(e?.eligible).toBe(true);
  });

  it("flags an incomplete nested offer as missing required", () => {
    const [e] = evalOf({
      "@type": "Product",
      name: "Widget",
      offers: { "@type": "Offer", price: "9.99" }, // no priceCurrency
    });
    expect(e?.eligible).toBe(false);
    expect(e?.missingRequired).toContain("offers.priceCurrency");
  });

  it("reports missing recommended fields when eligible", () => {
    const [e] = evalOf({
      "@type": "Product",
      name: "Widget",
      offers: { price: "9.99", priceCurrency: "USD" },
    });
    expect(e?.eligible).toBe(true);
    expect(e?.missingRecommended).toContain("image");
  });
});

describe("evaluateRichResults — other features", () => {
  it("Article has no hard requirements (always eligible)", () => {
    const [e] = evalOf({ "@type": "Article", headline: "Hi" });
    expect(e?.feature).toBe("Article");
    expect(e?.eligible).toBe(true);
    expect(e?.missingRecommended).toContain("image");
  });

  it("FAQPage needs a question with an accepted answer", () => {
    const bad = evalOf({ "@type": "FAQPage", mainEntity: [{ "@type": "Question", name: "Q?" }] })[0];
    expect(bad?.eligible).toBe(false);
    expect(bad?.missingRequired.join()).toContain("acceptedAnswer.text");

    const good = evalOf({
      "@type": "FAQPage",
      mainEntity: [{ "@type": "Question", name: "Q?", acceptedAnswer: { "@type": "Answer", text: "A." } }],
    })[0];
    expect(good?.eligible).toBe(true);
  });

  it("BreadcrumbList needs positioned list items", () => {
    const good = evalOf({
      "@type": "BreadcrumbList",
      itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: "https://x.com" }],
    })[0];
    expect(good?.eligible).toBe(true);
  });

  it("Event needs name, startDate and location", () => {
    const [e] = evalOf({ "@type": "Event", name: "Launch" });
    expect(e?.eligible).toBe(false);
    expect(e?.missingRequired).toEqual(expect.arrayContaining(["startDate", "location"]));
  });

  it("WebSite sitelinks searchbox needs a SearchAction with query-input", () => {
    const [e] = evalOf({
      "@type": "WebSite",
      url: "https://x.com",
      potentialAction: { "@type": "SearchAction", target: "https://x.com/s?q={q}" },
    });
    expect(e?.eligible).toBe(false);
    expect(e?.missingRequired).toContain("potentialAction.query-input");
  });

  it("ignores types that have no rich-result spec", () => {
    expect(evalOf({ "@type": "Thing", name: "x" })).toHaveLength(0);
  });
});
