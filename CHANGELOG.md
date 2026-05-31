# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/) and this project adheres to
[Semantic Versioning](https://semver.org/).

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
