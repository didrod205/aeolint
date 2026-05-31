/**
 * Answer-engine readiness (AEO / GEO) — the signals that make content easy for
 * AI search (ChatGPT, Perplexity, Google AI Overviews) to quote.
 */

import { findings, type Audit } from "../audit.js";
import { looksLikeQuestion, wordCount } from "../utils/text.js";

const SUMMARY_RE = /\b(tl;?dr|in short|key takeaways?|summary|at a glance)\b/i;

export const aeoAudit: Audit = {
  id: "aeo",
  category: "aeo",
  run({ doc, config }) {
    const f = findings("aeo", "aeo");
    const out = [];

    // 1. Question-style headings.
    const subheads = doc.headings.filter((h) => h.level >= 2);
    const questions = subheads.filter((h) => looksLikeQuestion(h.text));
    out.push(
      questions.length >= 1
        ? f.pass("questions", `${questions.length} question-style heading(s) found`, {
            weight: 2,
            detail: questions[0]?.text,
          })
        : f.warn("questions", "No question-style headings", {
            weight: 2,
            fix: 'Phrase some H2/H3s as the questions readers ask, e.g. "How does X work?".',
          }),
    );

    // 2. FAQ section (heading or schema).
    const hasFaqHeading = doc.headings.some((h) => /\bf\.?a\.?q\b|frequently asked/i.test(h.text));
    const hasFaqSchema = doc.jsonLd.some((b) => JSON.stringify(b.data ?? "").includes("FAQPage"));
    out.push(
      hasFaqHeading || hasFaqSchema
        ? f.pass("faq", "Has an FAQ section", { weight: 2 })
        : f.info("faq", "No FAQ section — a short FAQ is highly quotable by AI answers"),
    );

    // 3. A direct answer near the top.
    const firstPara = doc.text.split(/\n{2,}/).map((p) => p.trim()).find((p) => p.length > 0) ?? "";
    if (!firstPara) {
      out.push(f.warn("answer", "No intro paragraph detected", { weight: 2 }));
    } else if (firstPara.length <= config.thresholds.answerMaxChars) {
      out.push(f.pass("answer", "Opens with a concise, quotable answer", { weight: 2, detail: firstPara.slice(0, 120) }));
    } else {
      out.push(
        f.warn("answer", "The opening paragraph is long", {
          weight: 2,
          detail: `${firstPara.length} chars`,
          fix: `Lead with a ≤${config.thresholds.answerMaxChars}-char direct answer, then expand.`,
        }),
      );
    }

    // 4. Summary / TL;DR block.
    out.push(
      SUMMARY_RE.test(doc.text)
        ? f.pass("summary", "Includes a summary / key-takeaways block")
        : f.info("summary", "No summary block — a TL;DR or key takeaways helps AI extraction"),
    );

    // 5. Structured, extractable content (lists & tables).
    const lists = doc.root.querySelectorAll("ul, ol").length;
    const tables = doc.root.querySelectorAll("table").length;
    out.push(
      lists + tables >= 1
        ? f.pass("structured", `Uses lists/tables (${lists} list(s), ${tables} table(s))`, {
            detail: "AI engines extract structured content readily",
          })
        : f.warn("structured", "No lists or tables", {
            fix: "Break key points into bullet lists or comparison tables.",
          }),
    );

    // 6. Enough substance to be cited.
    const wc = wordCount(doc.text);
    out.push(
      wc >= 150
        ? f.pass("substance", `Sufficient content to answer (${wc} words)`)
        : f.warn("substance", `Very little content (${wc} words)`, {
            fix: "Answer the question thoroughly — thin pages rarely get cited.",
          }),
    );

    return out;
  },
};
