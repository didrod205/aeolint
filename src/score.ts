/** Deterministic scoring & grading. */

import { CATEGORY_LABELS, type AeolintConfig, type Category, type CategoryScore, type Finding } from "./types.js";

export function gradeFor(score: number): string {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

/** Score a single category from its findings (info findings are ignored). */
export function scoreCategory(findings: Finding[], category: Category): CategoryScore {
  let max = 0;
  let earned = 0;
  let pass = 0;
  let warning = 0;
  let error = 0;
  for (const finding of findings) {
    if (finding.category !== category || finding.severity === "info") continue;
    max += finding.weight;
    if (finding.severity === "pass") {
      earned += finding.weight;
      pass++;
    } else if (finding.severity === "warning") {
      earned += finding.weight * 0.5;
      warning++;
    } else {
      error++;
    }
  }
  const score = max > 0 ? Math.round((earned / max) * 100) : 100;
  return { category, label: CATEGORY_LABELS[category], score, pass, warning, error };
}

/** Combine category scores into a single weighted 0–100 score. */
export function overallScore(categories: CategoryScore[], config: AeolintConfig): number {
  let weighted = 0;
  let total = 0;
  for (const c of categories) {
    const w = config.categoryWeights[c.category] ?? 1;
    weighted += c.score * w;
    total += w;
  }
  return total > 0 ? Math.round(weighted / total) : 100;
}
