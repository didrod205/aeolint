import { describe, it, expect } from "vitest";
import {
  words,
  wordCount,
  sentenceCount,
  countSyllables,
  fleschReadingEase,
  readingMinutes,
  looksLikeQuestion,
} from "../src/utils/text.js";

describe("text metrics", () => {
  it("counts words, ignoring punctuation", () => {
    expect(wordCount("Hello, world! It's me.")).toBe(4);
    expect(words("a-b c'd")).toEqual(["a-b", "c'd"]);
    expect(wordCount("")).toBe(0);
  });

  it("counts sentences", () => {
    expect(sentenceCount("One. Two! Three?")).toBe(3);
    // text with no terminator still counts as one sentence if it has words
    expect(sentenceCount("no terminator here")).toBe(1);
    expect(sentenceCount("")).toBe(0);
  });

  it("estimates syllables with the vowel-group heuristic", () => {
    expect(countSyllables("cat")).toBe(1);
    expect(countSyllables("table")).toBe(2); // "le" ending keeps its syllable
    expect(countSyllables("water")).toBe(2);
    expect(countSyllables("make")).toBe(1); // silent trailing e
    expect(countSyllables("")).toBe(0);
    expect(countSyllables("rhythm")).toBeGreaterThanOrEqual(1);
  });

  it("scores readability higher for simple prose", () => {
    const simple = fleschReadingEase("The cat sat on the mat. The dog ran fast.");
    const complex = fleschReadingEase(
      "Notwithstanding subsequent considerations, the aforementioned methodology necessitates comprehensive evaluation.",
    );
    expect(simple).toBeGreaterThan(complex);
  });

  it("estimates reading minutes (>= 1)", () => {
    expect(readingMinutes("short")).toBe(1);
    expect(readingMinutes(Array(600).fill("word").join(" "))).toBe(3);
  });

  it("detects question-style headings", () => {
    expect(looksLikeQuestion("How do I brew coffee?")).toBe(true);
    expect(looksLikeQuestion("What is AEO")).toBe(true);
    expect(looksLikeQuestion("Best practices")).toBe(false);
    expect(looksLikeQuestion("Pricing")).toBe(false);
  });
});
