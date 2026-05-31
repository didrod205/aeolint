/** Parse HTML into a convenient, audit-friendly document model. */

import { parse, type HTMLElement } from "node-html-parser";

export interface HeadingInfo {
  level: number;
  text: string;
}
export interface ImageInfo {
  src: string;
  alt: string | null;
  width: string | null;
  height: string | null;
  loading: string | null;
}
export interface LinkInfo {
  text: string;
  href: string | null;
}
export interface ScriptInfo {
  src: string | null;
  inlineLength: number;
  async: boolean;
  defer: boolean;
  type: string | null;
}
export interface JsonLdBlock {
  raw: string;
  data: unknown | null;
  error?: string;
}

export interface ParsedDocument {
  root: HTMLElement;
  title: string | null;
  lang: string | null;
  text: string;
  headings: HeadingInfo[];
  images: ImageInfo[];
  links: LinkInfo[];
  scripts: ScriptInfo[];
  jsonLd: JsonLdBlock[];
  domNodeCount: number;
  inlineStyleLength: number;
  metaName(name: string): string | null;
  metaProperty(property: string): string | null;
  canonical(): string | null;
  metaRobots(): string | null;
  hasViewport(): boolean;
  hasCharset(): boolean;
}

function attr(el: HTMLElement, name: string): string | null {
  const v = el.getAttribute(name);
  return v === undefined ? null : v;
}

export function parseDocument(html: string): ParsedDocument {
  const root = parse(html, { comment: false });

  // A second parse with script/style removed gives clean visible text.
  const textRoot = parse(html, { comment: false });
  for (const el of textRoot.querySelectorAll("script, style, noscript")) el.remove();
  const text = textRoot.structuredText.replace(/\n{3,}/g, "\n\n").trim();

  const metas = root.querySelectorAll("meta");
  const findMeta = (key: string, value: string): string | null => {
    for (const m of metas) {
      if ((m.getAttribute(key) ?? "").toLowerCase() === value.toLowerCase()) {
        return m.getAttribute("content") ?? "";
      }
    }
    return null;
  };

  const headings: HeadingInfo[] = root
    .querySelectorAll("h1, h2, h3, h4, h5, h6")
    .map((h) => ({ level: Number(h.tagName.slice(1)), text: h.structuredText.trim() }));

  const images: ImageInfo[] = root.querySelectorAll("img").map((img) => ({
    src: attr(img, "src") ?? "",
    alt: attr(img, "alt"),
    width: attr(img, "width"),
    height: attr(img, "height"),
    loading: attr(img, "loading"),
  }));

  const links: LinkInfo[] = root
    .querySelectorAll("a")
    .map((a) => ({ text: a.structuredText.trim(), href: attr(a, "href") }));

  const scripts: ScriptInfo[] = root.querySelectorAll("script").map((s) => ({
    src: attr(s, "src"),
    inlineLength: s.rawText.length,
    async: s.hasAttribute("async"),
    defer: s.hasAttribute("defer"),
    type: attr(s, "type"),
  }));

  const jsonLd: JsonLdBlock[] = root
    .querySelectorAll('script[type="application/ld+json"]')
    .map((s) => {
      const raw = s.rawText.trim();
      try {
        return { raw, data: JSON.parse(raw) as unknown };
      } catch (e) {
        return { raw, data: null, error: (e as Error).message };
      }
    });

  const inlineStyleLength = root
    .querySelectorAll("style")
    .reduce((sum, s) => sum + s.rawText.length, 0);

  const htmlEl = root.querySelector("html");
  const titleEl = root.querySelector("title");

  return {
    root,
    title: titleEl ? titleEl.structuredText.trim() : null,
    lang: htmlEl ? attr(htmlEl, "lang") : null,
    text,
    headings,
    images,
    links,
    scripts,
    jsonLd,
    domNodeCount: root.querySelectorAll("*").length,
    inlineStyleLength,
    metaName: (n) => findMeta("name", n),
    metaProperty: (p) => findMeta("property", p),
    canonical: () => {
      const link = root
        .querySelectorAll("link")
        .find((l) => (l.getAttribute("rel") ?? "").toLowerCase() === "canonical");
      return link ? (link.getAttribute("href") ?? "") : null;
    },
    metaRobots: () => findMeta("name", "robots"),
    hasViewport: () => findMeta("name", "viewport") !== null,
    hasCharset: () =>
      metas.some((m) => m.hasAttribute("charset")) ||
      (findMeta("http-equiv", "content-type") ?? "").toLowerCase().includes("charset"),
  };
}
