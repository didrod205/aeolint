/** The registry of all audits, in report order. */

import type { Audit } from "../audit.js";
import { aeoAudit } from "./aeo.js";
import { contentAudit } from "./content.js";
import { crawlabilityAudit } from "./crawlability.js";
import { headingsAudit } from "./headings.js";
import { metaAudit } from "./meta.js";
import { performanceAudit } from "./performance.js";
import { structuredDataAudit } from "./structuredData.js";

export const AUDITS: Audit[] = [
  metaAudit,
  aeoAudit,
  structuredDataAudit,
  headingsAudit,
  contentAudit,
  performanceAudit,
  crawlabilityAudit,
];
