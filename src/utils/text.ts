/** Lightweight, deterministic text metrics (no NLP dependency). */

export function words(text: string): string[] {
  return (text.match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu) ?? []) as string[];
}

export function wordCount(text: string): number {
  return words(text).length;
}

export function sentenceCount(text: string): number {
  const m = text.match(/[^.!?]+[.!?]+/g);
  if (m && m.length) return m.length;
  return words(text).length > 0 ? 1 : 0;
}

export function countSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!w) return 0;
  const groups = w.match(/[aeiouy]+/g);
  let count = groups ? groups.length : 0;
  if (w.endsWith("e") && !w.endsWith("le")) count -= 1;
  return Math.max(1, count);
}

/** Flesch Reading Ease (0–100+, higher = easier). */
export function fleschReadingEase(text: string): number {
  const w = words(text);
  const s = sentenceCount(text);
  if (w.length === 0 || s === 0) return 0;
  const syllables = w.reduce((sum, word) => sum + countSyllables(word), 0);
  const score = 206.835 - 1.015 * (w.length / s) - 84.6 * (syllables / w.length);
  return Math.round(score * 10) / 10;
}

/** Estimated reading time in minutes at 200 wpm. */
export function readingMinutes(text: string): number {
  return Math.max(1, Math.round(wordCount(text) / 200));
}

const QUESTION_STARTERS =
  /^(what|how|why|when|where|who|which|can|is|are|do|does|should|will|would|could|did)\b/i;

/** Does this heading read like a question (answer-engine friendly)? */
export function looksLikeQuestion(heading: string): boolean {
  const h = heading.trim();
  return h.endsWith("?") || QUESTION_STARTERS.test(h);
}
