/**
 * Google rich-result eligibility engine.
 *
 * Search engines only render a rich result (review stars, FAQ accordions, recipe
 * cards, job postings, …) when the page's schema.org markup carries the
 * **required** properties Google documents for that feature — and they render a
 * *better* one when the **recommended** properties are present too. Those
 * requirements are an exact, documented spec, which makes them perfect for a
 * deterministic check: this module encodes the spec and evaluates a page's
 * JSON-LD against it. No network, no guessing, no Rich Results Test copy-paste.
 *
 * Sources: Google Search Central "structured data" feature guides.
 */

export type JsonObject = Record<string, unknown>;

/** A schema.org node flattened out of the JSON-LD graph, with its declared types. */
export interface SchemaNode {
  types: string[];
  node: JsonObject;
}

export interface RichSpec {
  /** schema.org @type values this feature applies to (aliases included). */
  types: string[];
  /** Google feature name, e.g. "Product (Merchant listing)". */
  feature: string;
  /** Properties that MUST be present for eligibility. */
  required: string[];
  /** At least one of these must be present (e.g. Product needs offers|review|aggregateRating). */
  requireOneOf?: string[];
  /** Properties Google recommends for a richer result. */
  recommended: string[];
  /** Documentation URL. */
  doc: string;
  /** Extra nested validation (e.g. offers.price). Returns missing-required paths. */
  validate?: (node: JsonObject) => string[];
}

// --- helpers -------------------------------------------------------------

function present(node: JsonObject, key: string): boolean {
  if (!(key in node)) return false;
  return nonEmpty(node[key]);
}

function nonEmpty(v: unknown): boolean {
  if (v === null || v === undefined) return false;
  if (typeof v === "string") return v.trim().length > 0;
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === "object") return Object.keys(v as object).length > 0;
  return true; // numbers, booleans
}

/** Resolve a property to its first object value (handles arrays / single objects). */
function firstObject(v: unknown): JsonObject | null {
  const candidate = Array.isArray(v) ? v[0] : v;
  return candidate && typeof candidate === "object" ? (candidate as JsonObject) : null;
}

function requireNestedOffer(node: JsonObject): string[] {
  const offer = firstObject(node["offers"]);
  if (!offer) return [];
  const missing: string[] = [];
  const hasPrice =
    present(offer, "price") || present(offer, "lowPrice") || present(offer, "priceSpecification");
  if (!hasPrice) missing.push("offers.price");
  if (!present(offer, "priceCurrency") && !present(offer, "priceSpecification")) {
    missing.push("offers.priceCurrency");
  }
  return missing;
}

function requireRating(node: JsonObject, path: string): string[] {
  const r = firstObject(node[path === "" ? "aggregateRating" : path]);
  if (!r) return [];
  const missing: string[] = [];
  if (!present(r, "ratingValue")) missing.push(`${path || "aggregateRating"}.ratingValue`);
  if (!present(r, "reviewCount") && !present(r, "ratingCount")) {
    missing.push(`${path || "aggregateRating"}.reviewCount`);
  }
  return missing;
}

// --- the spec table ------------------------------------------------------

const DOCS = "https://developers.google.com/search/docs/appearance/structured-data";

export const RICH_SPECS: RichSpec[] = [
  {
    types: ["Article", "NewsArticle", "BlogPosting"],
    feature: "Article",
    required: [],
    recommended: ["headline", "image", "author", "datePublished", "dateModified", "publisher"],
    doc: `${DOCS}/article`,
  },
  {
    types: ["Product", "ProductGroup"],
    feature: "Product snippet / Merchant listing",
    required: ["name"],
    requireOneOf: ["offers", "review", "aggregateRating"],
    recommended: ["image", "description", "brand", "sku", "gtin", "mpn", "review", "aggregateRating"],
    doc: `${DOCS}/product`,
    validate: (n) => [...requireNestedOffer(n), ...requireRating(n, "")],
  },
  {
    types: ["BreadcrumbList"],
    feature: "Breadcrumb",
    required: ["itemListElement"],
    recommended: [],
    doc: `${DOCS}/breadcrumb`,
    validate: (n) => {
      const items = n["itemListElement"];
      const first = firstObject(items);
      if (!first) return ["itemListElement (must be a list of ListItem)"];
      const missing: string[] = [];
      if (!present(first, "position")) missing.push("itemListElement.position");
      if (!present(first, "name") && !present(first, "item")) {
        missing.push("itemListElement.name");
      }
      return missing;
    },
  },
  {
    types: ["FAQPage"],
    feature: "FAQ",
    required: ["mainEntity"],
    recommended: [],
    doc: `${DOCS}/faqpage`,
    validate: (n) => {
      const q = firstObject(n["mainEntity"]);
      if (!q) return ["mainEntity (must be a list of Question)"];
      const missing: string[] = [];
      if (!present(q, "name")) missing.push("mainEntity.name (question text)");
      const answer = firstObject(q["acceptedAnswer"]);
      if (!answer || !present(answer, "text")) missing.push("mainEntity.acceptedAnswer.text");
      return missing;
    },
  },
  {
    types: ["Recipe"],
    feature: "Recipe",
    required: ["name", "image"],
    recommended: [
      "author", "datePublished", "description", "prepTime", "cookTime", "totalTime",
      "recipeYield", "recipeIngredient", "recipeInstructions", "nutrition", "aggregateRating", "video",
    ],
    doc: `${DOCS}/recipe`,
  },
  {
    types: ["Event"],
    feature: "Event",
    required: ["name", "startDate", "location"],
    recommended: [
      "endDate", "eventStatus", "eventAttendanceMode", "image", "description", "offers",
      "performer", "organizer",
    ],
    doc: `${DOCS}/event`,
  },
  {
    types: ["JobPosting"],
    feature: "Job posting",
    required: ["title", "description", "datePosted", "hiringOrganization"],
    requireOneOf: ["jobLocation", "jobLocationType", "applicantLocationRequirements"],
    recommended: ["baseSalary", "employmentType", "validThrough", "identifier"],
    doc: `${DOCS}/job-posting`,
  },
  {
    types: ["VideoObject"],
    feature: "Video",
    required: ["name", "thumbnailUrl", "uploadDate"],
    recommended: ["description", "duration", "contentUrl", "embedUrl"],
    doc: `${DOCS}/video`,
  },
  {
    types: ["Organization"],
    feature: "Organization / Logo",
    required: ["name"],
    recommended: ["logo", "url", "sameAs", "contactPoint"],
    doc: `${DOCS}/logo`,
  },
  {
    types: ["LocalBusiness", "Restaurant", "Store"],
    feature: "Local business",
    required: ["name", "address"],
    recommended: [
      "telephone", "openingHoursSpecification", "openingHours", "geo", "priceRange", "image", "url",
    ],
    doc: `${DOCS}/local-business`,
  },
  {
    types: ["HowTo"],
    feature: "How-to",
    required: ["name", "step"],
    recommended: ["image", "totalTime", "supply", "tool", "estimatedCost"],
    doc: `${DOCS}/how-to`,
  },
  {
    types: ["Review"],
    feature: "Review snippet",
    required: ["itemReviewed", "reviewRating", "author"],
    recommended: ["datePublished", "publisher"],
    doc: `${DOCS}/review-snippet`,
    validate: (n) => {
      const r = firstObject(n["reviewRating"]);
      return r && !present(r, "ratingValue") ? ["reviewRating.ratingValue"] : [];
    },
  },
  {
    types: ["WebSite"],
    feature: "Sitelinks search box",
    required: ["url", "potentialAction"],
    recommended: [],
    doc: `${DOCS}/sitelinks-searchbox`,
    validate: (n) => {
      const a = firstObject(n["potentialAction"]);
      if (!a) return ["potentialAction (SearchAction)"];
      const missing: string[] = [];
      if (!present(a, "target")) missing.push("potentialAction.target");
      if (!("query-input" in a)) missing.push("potentialAction.query-input");
      return missing;
    },
  },
  {
    types: ["SoftwareApplication", "MobileApplication", "WebApplication"],
    feature: "Software app",
    required: ["name"],
    requireOneOf: ["offers", "aggregateRating", "review"],
    recommended: ["operatingSystem", "applicationCategory"],
    doc: `${DOCS}/software-app`,
    validate: (n) => requireRating(n, ""),
  },
];

const SPEC_BY_TYPE = new Map<string, RichSpec>();
for (const spec of RICH_SPECS) for (const t of spec.types) SPEC_BY_TYPE.set(t, spec);

// --- node collection & evaluation ---------------------------------------

function typesOf(obj: JsonObject): string[] {
  const t = obj["@type"];
  if (typeof t === "string") return [t];
  if (Array.isArray(t)) return t.filter((x): x is string => typeof x === "string");
  return [];
}

/**
 * Collect the *top-level* schema.org items from a JSON-LD value — the things
 * Google evaluates as rich-result candidates. We descend through arrays and
 * `@graph`, but NOT into a node's properties: an `author`/`publisher`/`offers`
 * sub-object is a property of its parent item, not a standalone item to score.
 * (Nested requirements like `offers.price` are handled by each spec's
 * `validate`.)
 */
export function collectNodes(data: unknown, acc: SchemaNode[] = []): SchemaNode[] {
  if (Array.isArray(data)) {
    for (const item of data) collectNodes(item, acc);
    return acc;
  }
  if (data && typeof data === "object") {
    const obj = data as JsonObject;
    if (Array.isArray(obj["@graph"])) {
      collectNodes(obj["@graph"], acc);
      return acc;
    }
    const types = typesOf(obj);
    if (types.length) acc.push({ types, node: obj });
  }
  return acc;
}

export interface RichResultEval {
  feature: string;
  type: string;
  doc: string;
  eligible: boolean;
  missingRequired: string[];
  missingRecommended: string[];
}

/** Evaluate every rich-result-capable node against the Google spec table. */
export function evaluateRichResults(nodes: SchemaNode[]): RichResultEval[] {
  const evals: RichResultEval[] = [];
  const seen = new Set<JsonObject>();

  for (const { types, node } of nodes) {
    if (seen.has(node)) continue;
    const matchedType = types.find((t) => SPEC_BY_TYPE.has(t));
    if (!matchedType) continue;
    seen.add(node);
    const spec = SPEC_BY_TYPE.get(matchedType)!;

    const missingRequired = spec.required.filter((p) => !present(node, p));
    if (spec.requireOneOf && !spec.requireOneOf.some((p) => present(node, p))) {
      missingRequired.push(`one of: ${spec.requireOneOf.join(", ")}`);
    }
    if (spec.validate) missingRequired.push(...spec.validate(node));

    const missingRecommended = spec.recommended.filter((p) => !present(node, p));

    evals.push({
      feature: spec.feature,
      type: matchedType,
      doc: spec.doc,
      eligible: missingRequired.length === 0,
      missingRequired,
      missingRecommended,
    });
  }
  return evals;
}
