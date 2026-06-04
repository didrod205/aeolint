<div align="center">

# 🔎 aeolint

### Lint your pages for SEO **and** answer-engine (AEO/GEO) readiness — locally, no API key.

[![npm version](https://img.shields.io/npm/v/@didrod2539/aeolint.svg?color=success)](https://www.npmjs.com/package/@didrod2539/aeolint)
[![CI](https://github.com/didrod205/aeolint/actions/workflows/ci.yml/badge.svg)](https://github.com/didrod205/aeolint/actions/workflows/ci.yml)
[![node](https://img.shields.io/node/v/@didrod2539/aeolint.svg)](https://www.npmjs.com/package/@didrod2539/aeolint)
[![license](https://img.shields.io/npm/l/@didrod2539/aeolint.svg)](./LICENSE)

A deterministic command-line auditor that scores your HTML/Markdown for **SEO**,
**Answer Engine Optimization (AEO)**, **Generative Engine Optimization (GEO)**,
structured data, content quality, headings, performance risk and crawlability —
then tells you exactly what to fix.

</div>

---

Search is splitting in two. Half your traffic still comes from the classic
ten blue links; the other half is being quietly answered **inside** ChatGPT,
Perplexity and Google's AI Overviews — and those answer engines pick what to
quote based on signals most "SEO checkers" never look at: question-style
headings, a concise lead answer, `FAQPage`/`Article` JSON-LD, self-contained
paragraphs, clean crawlability.

**aeolint** audits all of it from one command. It's **deterministic** (same page
→ same score, every time — perfect for CI gates), runs **100% locally** with
**no API key and no server**, and ships **40+ checks** across 7 categories with
an A–F grade and concrete fixes.

```bash
npx @didrod2539/aeolint scan ./public
```

> 📸 _Screenshot / demo GIF placeholder:_ `./docs/screenshot.png` — record the
> terminal running `npx @didrod2539/aeolint scan examples/good.html examples/bad.html`.

## Why it exists

- **AEO/GEO is the new frontier, and existing tools ignore it.** Lighthouse and
  most "SEO linters" check titles and meta tags but say nothing about whether an
  AI can extract and cite your content. aeolint scores that explicitly.
- **AI can't reliably replace this.** "Is my page answer-engine ready?" sounds
  like an LLM question, but you want a **repeatable, auditable** answer you can
  gate a deploy on — not a different vibe each time you ask. aeolint is a fixed
  rule engine: deterministic, versioned, diff-able.
- **No server, no key, no data leaving your machine.** Point it at local files,
  a folder, or a URL. Nothing is uploaded. It works offline.
- **Built for CI.** `--min-score 80` exits non-zero so a regression fails the
  build, just like a test.

## Who it's for

**Developers** (gate SEO/AEO in CI), **content & marketing** (make posts
quotable by AI search), **technical SEOs** (a scriptable, deterministic audit),
**docs teams**, and **indie makers** who want their pages cited by ChatGPT and
Perplexity — not just ranked.

## Install

Run it without installing:

```bash
npx @didrod2539/aeolint scan ./public
```

Or install globally / per-project:

```bash
npm install -g @didrod2539/aeolint   # global CLI (provides the `aeolint` command)
npm install -D @didrod2539/aeolint   # project dev-dependency (for CI)
```

Node ≥ 18. Ships ESM + CJS + TypeScript types. Zero network calls unless you
scan a URL.

## Usage

```bash
# Scan files, a whole directory, or a live URL
aeolint scan examples/good.html
aeolint scan ./public                       # recurses for .html/.htm/.md
aeolint scan https://example.com            # also reads robots.txt + sitemap.xml

# Export machine-readable + shareable reports
aeolint scan ./public --json report.json --md report.md

# Fail CI when quality regresses
aeolint scan ./public --min-score 80

# Use a config file (auto-detected, or pass one)
aeolint scan ./public --config aeolint.config.json

# Re-render a saved JSON report as Markdown
aeolint report report.json --md report.md

# Scaffold a config with all defaults
aeolint init

# Built-ins
aeolint --help
aeolint --version
```

### Example output

```
How to Brew Pour-Over Coffee: A Beginner's Guide
  95/100 (A)  examples/good.html
  SEO basics                         100
  Answer-engine readiness (AEO/GEO)   88
  Structured data                    100
  Content quality                     83
  Headings & structure               100
  Performance risks                  100
  Crawlability                       100

  ⚠ The opening paragraph is long
      → Lead with a ≤320-char direct answer, then expand.

Overall  95/100 (A)  1 page(s), 0 error(s), 1 warning(s)
```

See [`examples/sample-report.md`](./examples/sample-report.md) and
[`examples/sample-report.json`](./examples/sample-report.json) for full reports.

### Three real scenarios

1. **CI gate for a blog/docs site** — add
   `aeolint scan ./dist --min-score 85` to your build. A PR that ships a page
   with a missing `<title>` or broken JSON-LD fails before it merges.
2. **Make an article quotable by AI search** — run `aeolint scan post.html`,
   then fix the AEO findings (add a lead answer, question headings, a short FAQ,
   `FAQPage` JSON-LD) until the **Answer-engine** category hits 100.
3. **Audit a competitor or a live page** — `aeolint scan https://example.com
   --md audit.md` produces a shareable Markdown report including their
   robots.txt / sitemap signals.

## What it checks

| Category | Examples of checks |
| --- | --- |
| **SEO basics** | title length, meta description, `lang`, viewport, charset, canonical, Open Graph |
| **Answer-engine (AEO/GEO)** | question-style headings, concise lead answer, FAQ section, TL;DR/summary, lists & tables, substance |
| **Structured data** | JSON-LD present & valid, `@type` detection, and **Google rich-result eligibility** — per-type required/recommended fields for Article, Product, FAQPage, Recipe, Event, JobPosting, Breadcrumb, Organization, LocalBusiness, Review, Video, HowTo, WebSite sitelinks & more |
| **Content quality** | word depth, Flesch readability, image `alt` coverage, descriptive link text |
| **Headings** | single `<h1>`, no skipped levels, no empty headings |
| **Performance risk** | render-blocking scripts, image dimensions (CLS), lazy-loading, base64 bloat, DOM size |
| **Crawlability** | `noindex`, canonical, `robots.txt` `Sitemap:` directive & blocks, sitemap entries |

Scoring is transparent: each check is a weighted *pass / warning / error*, rolled
up per category and combined into a config-weighted overall score and A–F grade.

### Rich-result eligibility (the deep structured-data check)

A page can have perfectly valid JSON-LD and still **win no rich result** — because
Google only renders review stars, FAQ accordions, recipe cards, job postings, etc.
when the *required* properties for that feature are present. Those requirements are
an exact, documented spec, so aeolint checks them deterministically — no
copy-pasting each URL into the Rich Results Test:

```
✗ Product snippet / Merchant listing (Product) is NOT eligible for a rich result
    Missing required: one of: offers, review, aggregateRating
    → Add the required property so Google can render the Product rich result.

⚠ Article (Article) is eligible, but missing recommended fields
    Recommended: image, dateModified

✓ FAQ (FAQPage) is eligible for a rich result
```

This is the check that catches a refactor silently dropping `offers` from a product
page — the kind of regression that quietly tanks click-through. Put
`aeolint scan ./dist --min-score 85` in CI and the build fails the moment a page
loses its rich-result eligibility. Covered features: **Article, Product, FAQPage,
Recipe, Event, JobPosting, BreadcrumbList, Organization/Logo, LocalBusiness, Review,
VideoObject, HowTo, WebSite (sitelinks searchbox), SoftwareApplication.**

## Configuration

Create `aeolint.config.json` (or run `aeolint init`):

```json
{
  "minScore": 80,
  "disableCategories": [],
  "ignore": ["meta.og"],
  "thresholds": { "minWords": 250, "descriptionMax": 160 },
  "categoryWeights": { "aeo": 1.5, "structured-data": 1.2 }
}
```

- `minScore` — CI gate threshold (overridable with `--min-score`).
- `disableCategories` — skip whole categories, e.g. `["performance"]`.
- `ignore` — silence individual checks by id (shown in reports, e.g. `meta.og`).
- `thresholds` — tune lengths, word counts, DOM/script limits.
- `categoryWeights` — re-weight the overall score for your priorities.

## Programmatic API

```ts
import { auditPage, buildReport, toMarkdown } from "@didrod2539/aeolint";

const page = auditPage({ source: "post.html", html });
console.log(page.score, page.grade, page.findings);

const report = buildReport([page], "0.1.0");
await fs.writeFile("report.md", toMarkdown(report));
```

## FAQ

**Does it call an AI / send my pages anywhere?**
No. aeolint is a deterministic rule engine that runs entirely on your machine.
No API key, no telemetry, no uploads. Scanning a URL is the only time it touches
the network — to fetch that page and its `robots.txt`/`sitemap.xml`.

**Is "AEO score" a real Google ranking?**
No. There is no official answer-engine score. aeolint encodes widely-recommended,
checkable best practices (concise answers, question headings, schema.org, clean
crawlability) into a transparent, weighted score so you can track and gate it.
Treat it as a lint, not a guarantee of placement.

**How is this different from Lighthouse?**
Lighthouse audits performance/accessibility/SEO of a rendered page in a browser.
aeolint is a static, dependency-light CLI focused on **content & answer-engine
readiness** (AEO/GEO, structured data, quotability) that you can run on raw HTML
or Markdown in CI without a headless browser.

**Can it scan a whole site?**
Point it at a directory of built HTML (`aeolint scan ./dist`) and it recurses.
Multi-URL crawling of live sites is on the roadmap — PRs welcome.

**Why are my passing checks not shown?**
The console view highlights problems; passes count toward the score. Use
`--json` / `--md` for the full breakdown including passes per category.

## Contributing

Contributions welcome! New checks are small, self-contained modules in
`src/audits/`. See [CONTRIBUTING.md](./CONTRIBUTING.md) and the
[Code of Conduct](./CODE_OF_CONDUCT.md).

```bash
git clone https://github.com/didrod205/aeolint.git
cd aeolint
npm install
npm test            # run the suite
npm run build       # build the CLI + library
node dist/cli.js scan examples/good.html
```

## 💖 Sponsor

aeolint is free, MIT-licensed, and built in spare time. If it saved you a manual
audit (or a debugging session), please consider supporting it:

- ⭐ **Star this repo** — free, and it genuinely helps others find it.
- 🍋 **[Sponsor via Lemon Squeezy](https://elab-studio.lemonsqueezy.com/checkout/buy/5d059b89-51d0-456b-b33a-ed56994f7010)** — one-time or recurring support.

**Where your support goes:** more checks (Product/HowTo/BreadcrumbList schema,
hreflang, Twitter cards, internal-link analysis), multi-URL site crawling, an
HTML report format, framework presets (Next.js/Astro/Hugo), and fast issue
responses.

## License

[MIT](./LICENSE) © aeolint contributors
