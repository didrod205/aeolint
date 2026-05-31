import type { Report } from "../types.js";

/** Serialize a report to pretty JSON. */
export function toJSON(report: Report): string {
  return JSON.stringify(report, null, 2);
}
