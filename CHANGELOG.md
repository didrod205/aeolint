# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/) and this project adheres to
[Semantic Versioning](https://semver.org/).

## [0.2.0] - 2026-06-04

### Added

- **Google rich-result eligibility engine** (`src/richResults.ts`). For every
  recognised schema.org type, aeolint now checks the **required** and
  **recommended** properties Google documents for that feature and reports
  whether the page would actually win the rich result — deterministically, with
  no Rich Results Test copy-paste. Covered features: Article, Product, FAQPage,
  Recipe, Event, JobPosting, BreadcrumbList, Organization/Logo, LocalBusiness,
  Review, VideoObject, HowTo, WebSite (sitelinks searchbox), SoftwareApplication.
- Nested requirement checks (e.g. `offers.price` + `offers.priceCurrency`,
  `aggregateRating.ratingValue`, `mainEntity.acceptedAnswer.text`,
  `potentialAction.query-input`).
- New findings: `schema.rich.<type>` — an error when a type is **not eligible**
  (missing required), a warning when eligible but **missing recommended** fields,
  and a pass when fully eligible. Each links to the relevant Google doc.

### Changed

- The structured-data audit now evaluates only top-level / `@graph` items as
  rich-result candidates (sub-objects like `author`/`publisher` are treated as
  properties, not standalone items), eliminating false positives.

## [0.1.0] - 2026-05-31

### Added

- Initial public release.
- `scan` command: audit HTML/Markdown files, directories (recursive), or a live
  URL (also fetches `robots.txt` and `sitemap.xml`).
- `report` command: re-render a saved JSON report as Markdown.
- `init` command: scaffold an `aeolint.config.json` with all defaults.
- 40+ checks across 7 categories: SEO basics, Answer-engine readiness
  (AEO/GEO), structured data, content quality, headings, performance risk, and
  crawlability.
- Deterministic weighted scoring with per-category scores and an A–F grade.
- JSON (`--json`) and Markdown (`--md`) report export; colored console output.
- `--min-score` CI gate (non-zero exit below threshold).
- Config file support (`aeolint.config.json` / `.aeolintrc.json` / `.aeolintrc`)
  with `disableCategories`, `ignore`, `thresholds`, and `categoryWeights`.
- Programmatic API: `auditPage`, `buildReport`, `toJSON`, `toMarkdown`,
  `parseDocument`, `gradeFor`.
- ESM + CJS + TypeScript types.

[0.1.0]: https://github.com/didrod205/aeolint/releases/tag/v0.1.0
