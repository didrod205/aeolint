# Contributing to aeolint

Thanks for your interest! aeolint is designed so that **adding a check is small,
self-contained, and testable**. Most contributions are a new audit rule.

## Getting started

```bash
git clone https://github.com/didrod205/aeolint.git
cd aeolint
npm install
npm test            # vitest
npm run typecheck   # tsc --noEmit
npm run build       # tsup -> dist/
```

## Project layout

```
src/
  parse.ts          # HTML/Markdown -> ParsedDocument model
  audit.ts          # AuditContext + findings() helper
  audits/           # one module per group of checks (the interesting part)
  score.ts          # pass/warn/error -> category & overall score, A–F grade
  report/           # json / markdown / console renderers
  config.ts         # defaults + config loading & merge
  cli.ts            # cac-based command line (scan / report / init)
tests/              # vitest specs
examples/           # sample inputs + generated sample reports
```

## Adding a check

1. Open the relevant module in `src/audits/` (or create a new one and register
   it in `src/audits/index.ts`, in report order).
2. Inside the audit, use the `findings("<audit-id>", "<category>")` helper to
   create results:

   ```ts
   const f = findings("meta", "seo");
   if (!doc.title) {
     yield f.error("title", "Missing <title> tag", {
       fix: "Add a unique, descriptive <title>.",
     });
   } else {
     yield f.pass("title", "Has a <title>");
   }
   ```

3. Every check should emit **either** a pass **or** a problem so the score is
   meaningful. Keep ids stable — they appear in reports and `ignore` config.
4. Add or extend a test in `tests/` with a small HTML snippet proving the check
   fires (and doesn't fire) correctly. Determinism matters: same input → same
   output.

## Principles

- **Deterministic.** No randomness, no network in the core (only the URL loader
  fetches). Same page must always produce the same score.
- **No data leaves the machine.** Never add telemetry or uploads.
- **Dependency-light.** Prefer the existing parser/utilities over new deps.
- **Actionable.** Every problem finding needs a concrete `fix` message.

## Checklist before opening a PR

- [ ] `npm run typecheck` passes
- [ ] `npm test` passes (add tests for new behavior)
- [ ] New checks have stable ids and a `fix` message
- [ ] `CHANGELOG.md` updated for user-facing changes
- [ ] Regenerated `examples/sample-report.*` if output format changed

## Code of Conduct

This project follows the [Contributor Covenant](./CODE_OF_CONDUCT.md).
