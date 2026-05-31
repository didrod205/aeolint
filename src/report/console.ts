import pc from "picocolors";
import type { PageReport, Report, Severity } from "../types.js";

const ICON: Record<Severity, string> = { error: "✗", warning: "⚠", info: "ℹ", pass: "✓" };
const color: Record<Severity, (s: string) => string> = {
  error: pc.red,
  warning: pc.yellow,
  info: pc.blue,
  pass: pc.green,
};

function gradeColor(grade: string): (s: string) => string {
  if (grade === "A" || grade === "B") return pc.green;
  if (grade === "C") return pc.yellow;
  return pc.red;
}

function printPage(page: PageReport, quiet: boolean): void {
  const g = gradeColor(page.grade);
  process.stdout.write(
    `\n${pc.bold(page.title ?? page.source)}\n` +
      `  ${g(pc.bold(`${page.score}/100 (${page.grade})`))}  ${pc.dim(page.source)}\n`,
  );
  for (const c of page.categories) {
    process.stdout.write(
      `  ${pc.dim(c.label.padEnd(34))} ${gradeColor(c.score >= 80 ? "A" : c.score >= 70 ? "C" : "F")(String(c.score).padStart(3))}\n`,
    );
  }
  const shown = quiet
    ? page.findings.filter((f) => f.severity === "error" || f.severity === "warning")
    : page.findings.filter((f) => f.severity !== "pass");
  if (shown.length) process.stdout.write("\n");
  for (const f of shown) {
    process.stdout.write(`  ${color[f.severity](ICON[f.severity])} ${f.message}\n`);
    if (f.fix && f.severity !== "info") process.stdout.write(`      ${pc.dim("→ " + f.fix)}\n`);
  }
}

/** Print a report to the terminal. */
export function printReport(report: Report, quiet = false): void {
  for (const page of report.pages) printPage(page, quiet);
  const g = gradeColor(report.summary.grade);
  process.stdout.write(
    `\n${pc.bold("Overall")}  ${g(pc.bold(`${report.summary.score}/100 (${report.summary.grade})`))}  ` +
      `${pc.dim(`${report.summary.pages} page(s), `)}` +
      `${pc.red(`${report.summary.errors} error(s)`)}, ${pc.yellow(`${report.summary.warnings} warning(s)`)}\n`,
  );
}
