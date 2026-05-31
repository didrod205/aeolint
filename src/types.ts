/** Shared types for aeolint. */

export type Severity = "error" | "warning" | "info" | "pass";

export type Category =
  | "seo"
  | "aeo"
  | "structured-data"
  | "content"
  | "headings"
  | "performance"
  | "crawlability";

export const CATEGORIES: Category[] = [
  "seo",
  "aeo",
  "structured-data",
  "content",
  "headings",
  "performance",
  "crawlability",
];

export const CATEGORY_LABELS: Record<Category, string> = {
  seo: "SEO basics",
  aeo: "Answer-engine readiness (AEO/GEO)",
  "structured-data": "Structured data",
  content: "Content quality",
  headings: "Headings & structure",
  performance: "Performance risks",
  crawlability: "Crawlability",
};

export interface Finding {
  /** Stable check id, e.g. `meta.title-length`. */
  id: string;
  audit: string;
  category: Category;
  severity: Severity;
  message: string;
  /** Extra context (the offending value, count, etc.). */
  detail?: string;
  /** A concrete suggestion for how to fix it. */
  fix?: string;
  /** Scoring weight (impact). `info` findings don't affect the score. */
  weight: number;
}

export interface CategoryScore {
  category: Category;
  label: string;
  score: number;
  pass: number;
  warning: number;
  error: number;
}

export interface PageReport {
  source: string;
  title: string | null;
  score: number;
  grade: string;
  findings: Finding[];
  categories: CategoryScore[];
}

export interface Report {
  tool: string;
  version: string;
  generatedAt: string;
  summary: {
    pages: number;
    score: number;
    grade: string;
    errors: number;
    warnings: number;
  };
  pages: PageReport[];
}

export interface Thresholds {
  titleMin: number;
  titleMax: number;
  descriptionMin: number;
  descriptionMax: number;
  minWords: number;
  maxDomNodes: number;
  maxBlockingScripts: number;
  /** A direct "answer" paragraph should be at most this many characters. */
  answerMaxChars: number;
}

export interface AeolintConfig {
  /** Categories to skip entirely. */
  disableCategories: Category[];
  /** Check ids to ignore. */
  ignore: string[];
  thresholds: Thresholds;
  /** Per-category weight in the overall score. */
  categoryWeights: Record<Category, number>;
  /** CI gate: `scan` exits non-zero if the overall score is below this. */
  minScore: number;
}
