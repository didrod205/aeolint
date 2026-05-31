# aeolint — Product & Launch Strategy

This document is the strategy brief behind aeolint. It exists so the project can
be maintained, marketed, and grown by a single person.

## 1. Idea & rationale

Search is bifurcating into **classic SEO** (ranked links) and **answer engines**
(ChatGPT, Perplexity, Google AI Overviews) that synthesize and *cite* sources.
A new discipline — **AEO (Answer Engine Optimization)** / **GEO (Generative
Engine Optimization)** — has appeared, but tooling hasn't caught up: existing
auditors check `<title>` and meta tags, not whether an AI can extract and quote
your page.

aeolint fills that gap with a **deterministic, local CLI** that scores both
classic SEO *and* answer-engine readiness, and tells you exactly what to fix. It
runs in CI, needs no API key, and uploads nothing.

## 2. Competitor analysis

| Tool | Focus | Gaps aeolint addresses |
| --- | --- | --- |
| **Lighthouse** | Perf/a11y/SEO of a rendered page | Needs a browser; no AEO/GEO, no quotability/schema-completeness focus, not a simple CI lint on raw HTML |
| **seo-analyzer / site-audit-seo** | Classic on-page SEO crawl | No answer-engine signals (lead answer, question headings, FAQ schema) |
| **Screaming Frog / Ahrefs / Semrush** | Paid, hosted crawlers | Cost, accounts, data leaves your machine; overkill for a CI gate |
| **Schema validators** | JSON-LD validity only | One narrow slice; no content/AEO/perf scoring |
| **"AEO" SaaS (new)** | Hosted answer-engine scoring | Server-side, paid, opaque, non-deterministic |

**White space:** a free, offline, *deterministic* CLI that unifies SEO **and**
AEO/GEO into one gate-able score.

## 3. Differentiation

- **AEO/GEO as a first-class category**, not an afterthought.
- **Deterministic** → diff-able, CI-gateable (`--min-score`).
- **Local & private** → no key, no server, no uploads; works offline.
- **Static** → audits raw HTML/Markdown without a headless browser.
- **Transparent scoring** → every check is a weighted pass/warn/error you can
  inspect, re-weight, or disable.
- **Extensible** → a new check is a tiny module; contributors can add rules
  without touching the core.

## 4. Folder structure

```
aeolint/
├─ src/
│  ├─ parse.ts            # HTML/MD -> ParsedDocument
│  ├─ audit.ts            # context + findings() helper
│  ├─ audits/             # meta, aeo, structuredData, headings, content, performance, crawlability
│  ├─ score.ts            # scoring + A–F grade
│  ├─ report/             # json | markdown | console
│  ├─ utils/text.ts       # readability/word/syllable metrics
│  ├─ config.ts, loader.ts, types.ts
│  ├─ index.ts            # programmatic API
│  └─ cli.ts              # cac CLI: scan / report / init
├─ tests/                 # vitest specs (33+)
├─ examples/              # good.html, bad.html, sample.md, config, sample reports
├─ .github/               # CI, release, FUNDING, issue/PR templates
├─ README.md, CONTRIBUTING.md, CODE_OF_CONDUCT.md, CHANGELOG.md, LICENSE
└─ package.json, tsconfig.json, tsup.config.ts, vitest.config.ts
```

## 5. Source

Full TypeScript source in `src/` (ESM+CJS via tsup), MIT-licensed. See README
"Programmatic API" and CONTRIBUTING "Adding a check".

## 6. README

See [README.md](./README.md): intro, why-it-exists, who-it's-for, install,
usage (3 scenarios), checks table, config, API, FAQ, contributing, sponsor
(Lemon Squeezy), license, screenshot placeholder.

## 7. License

[MIT](./LICENSE).

## 8. GitHub topics

`seo`, `aeo`, `geo`, `answer-engine-optimization`, `generative-engine-optimization`,
`seo-audit`, `seo-cli`, `structured-data`, `json-ld`, `schema-org`,
`content-audit`, `ai-search`, `lighthouse-alternative`, `cli`, `typescript`.

## 9. Product Hunt blurb

> **aeolint — lint your pages for SEO *and* AI answer engines.**
> Search is splitting between Google's blue links and AI answers from ChatGPT &
> Perplexity. aeolint is a free, local CLI that scores your HTML/Markdown for
> both — SEO basics, AEO/GEO readiness, schema.org, readability, performance and
> crawlability — with an A–F grade and exact fixes. No API key, no server,
> nothing uploaded. `npx aeolint scan ./public`. Gate it in CI with
> `--min-score 80`.

## 10. npm name

`aeolint` — short, brandable, captures the trending **AEO** keyword + the
familiar **lint** mental model (a thing you run in CI). Verified available at
publish time. Package: ESM+CJS, `bin: aeolint`.

## 11. SEO/keyword strategy

- **Primary keywords:** answer engine optimization, AEO, GEO, SEO CLI, SEO audit
  tool, structured data checker, schema.org validator, AI search optimization.
- **Long-tail:** "make content quotable by ChatGPT", "AEO checklist tool",
  "SEO lint CI", "Lighthouse alternative for content".
- **Channels:** README (keyword-rich, FAQ answers common queries), npm keywords,
  GitHub topics, a dev.to/Hashnode post "Optimizing for answer engines (with a
  tool to check it)", Product Hunt, r/SEO & r/javascript, Show HN.
- **Content moat:** publish the rule rationale (why each check matters) as docs —
  itself AEO-optimized, demonstrating the tool.

## 12. Monetization

- **Sponsorship via Lemon Squeezy only** (one-time/recurring) — see FUNDING.yml
  and README. Funds: more checks, multi-URL crawling, HTML report, framework
  presets, issue triage.
- **Future optional paid tier (kept clearly separate, never gating the OSS):** a
  hosted dashboard / scheduled monitoring / PR-comment GitHub App. The CLI and
  library stay free and MIT forever.

## 13. Maintenance plan (one person)

- Checks are isolated modules with tests → low-risk to add/change.
- CI matrix (Node 18/20/22) + smoke test on examples guards regressions.
- Tagged releases auto-publish via `release.yml`.
- Determinism + sample reports make output changes obvious in diffs.
