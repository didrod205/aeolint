/** Resolve scan targets (files, directories, URLs, Markdown) into HTML inputs. */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join } from "node:path";
import { marked } from "marked";
import type { AuditInput } from "./index.js";

const HTML_EXT = new Set([".html", ".htm"]);
const MD_EXT = new Set([".md", ".markdown"]);

function isUrl(target: string): boolean {
  return /^https?:\/\//i.test(target);
}

function markdownToHtml(md: string): string {
  return marked.parse(md, { async: false }) as string;
}

function readFileInput(path: string): AuditInput {
  const raw = readFileSync(path, "utf8");
  const html = MD_EXT.has(extname(path).toLowerCase()) ? markdownToHtml(raw) : raw;
  return { source: path, html };
}

function walkDir(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
      out.push(...walkDir(full));
    } else {
      const ext = extname(entry.name).toLowerCase();
      if (HTML_EXT.has(ext) || MD_EXT.has(ext)) out.push(full);
    }
  }
  return out;
}

async function tryFetch(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { redirect: "follow" });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

async function loadUrl(url: string): Promise<AuditInput> {
  const res = await fetch(url, { redirect: "follow", headers: { "user-agent": "aeolint" } });
  if (!res.ok) throw new Error(`aeolint: failed to fetch ${url} (HTTP ${res.status})`);
  const html = await res.text();
  const origin = new URL(url).origin;
  const [robots, sitemap] = await Promise.all([
    tryFetch(`${origin}/robots.txt`),
    tryFetch(`${origin}/sitemap.xml`),
  ]);
  return { source: url, html, robots, sitemap };
}

/** Expand each target into one or more {@link AuditInput}s. */
export async function loadInputs(targets: string[]): Promise<AuditInput[]> {
  const inputs: AuditInput[] = [];
  for (const target of targets) {
    if (isUrl(target)) {
      inputs.push(await loadUrl(target));
      continue;
    }
    const stat = statSync(target); // throws a clear ENOENT if the path is wrong
    if (stat.isDirectory()) {
      const files = walkDir(target).sort();
      if (files.length === 0) throw new Error(`aeolint: no .html/.md files found in ${target}`);
      for (const file of files) inputs.push(readFileInput(file));
    } else {
      inputs.push(readFileInput(target));
    }
  }
  return inputs;
}
