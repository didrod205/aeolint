import { describe, it, expect } from "vitest";
import { gradeFor, scoreCategory, overallScore } from "../src/score.js";
import { DEFAULT_CONFIG } from "../src/config.js";
import type { Finding } from "../src/types.js";

function f(severity: Finding["severity"], weight = 1): Finding {
  return { id: "t.x", audit: "t", category: "seo", severity, message: "m", weight };
}

describe("grading", () => {
  it("maps scores to letter grades", () => {
    expect(gradeFor(100)).toBe("A");
    expect(gradeFor(90)).toBe("A");
    expect(gradeFor(85)).toBe("B");
    expect(gradeFor(75)).toBe("C");
    expect(gradeFor(65)).toBe("D");
    expect(gradeFor(40)).toBe("F");
  });
});

describe("scoreCategory", () => {
  it("gives full credit for all-pass", () => {
    const cs = scoreCategory([f("pass"), f("pass")], "seo");
    expect(cs.score).toBe(100);
    expect(cs.pass).toBe(2);
  });

  it("gives half credit for warnings and none for errors", () => {
    // pass(1) + warning(0.5) + error(0) over max 3 => 50
    expect(scoreCategory([f("pass"), f("warning"), f("error")], "seo").score).toBe(50);
  });

  it("ignores info findings and defaults empty categories to 100", () => {
    expect(scoreCategory([f("info")], "seo").score).toBe(100);
    expect(scoreCategory([], "seo").score).toBe(100);
  });

  it("respects finding weights", () => {
    // pass weight 3 (earned 3) + error weight 1 (earned 0) over max 4 => 75
    expect(scoreCategory([f("pass", 3), f("error", 1)], "seo").score).toBe(75);
  });
});

describe("overallScore", () => {
  it("weights categories by config", () => {
    const cats = [
      { category: "seo" as const, label: "SEO", score: 100, pass: 1, warning: 0, error: 0 },
      { category: "aeo" as const, label: "AEO", score: 0, pass: 0, warning: 0, error: 1 },
    ];
    // seo weight 1, aeo weight 1.3 => (100*1 + 0*1.3) / 2.3 ≈ 43
    expect(overallScore(cats, DEFAULT_CONFIG)).toBe(43);
  });
});
