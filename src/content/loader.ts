/**
 * Content loader — server-only. Reads content/ from disk, validates with Zod,
 * and caches for the process lifetime (the content is static per build).
 */
import "server-only";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import {
  ArticleFrontmatter,
  BriefFrontmatter,
  DossierFrontmatter,
  WireFile,
  EventsFile,
  kindDirs,
  kindHref,
  type Article,
  type Brief,
  type Doc,
  type Dossier,
  type Frontmatter,
  type Kind,
  type WireItem,
  type CalendarEvent,
} from "./schema";
import { instruments } from "@/data/instruments";
import { presetLayouts } from "@/layout-engine/presets";
import { themes } from "@/design/tokens";
import { panelCatalog } from "@/panels/catalog";

const ROOT = path.join(process.cwd(), "content");

const schemas = {
  article: ArticleFrontmatter,
  brief: BriefFrontmatter,
  dossier: DossierFrontmatter,
} as const;

function readingTime(body: string) {
  const words = body.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

function excerpt(body: string) {
  const para = body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .find((p) => p && !p.startsWith("#") && !p.startsWith("<") && !p.startsWith("{") && !p.startsWith("import"));
  const text = (para ?? "").replace(/[*_`>#]/g, "");
  return text.length > 220 ? text.slice(0, 217).trimEnd() + "…" : text;
}

async function loadKind<F extends Frontmatter>(kind: Kind): Promise<Doc<F>[]> {
  const dir = path.join(ROOT, kindDirs[kind]);
  let files: string[] = [];
  try {
    files = (await readdir(dir)).filter((f) => f.endsWith(".mdx") || f.endsWith(".md"));
  } catch {
    return [];
  }
  const docs = await Promise.all(
    files.map(async (file) => {
      const raw = await readFile(path.join(dir, file), "utf8");
      const { data, content } = matter(raw);
      const parsed = schemas[kind].safeParse({ kind, ...data });
      if (!parsed.success) {
        throw new Error(`Invalid front matter in content/${kindDirs[kind]}/${file}:\n${parsed.error.message}`);
      }
      const slug = file.replace(/\.mdx?$/, "");
      const fm = parsed.data as F;
      return {
        slug,
        kind,
        href: kindHref[kind](slug),
        body: content,
        readingTime: fm.readingTime ?? readingTime(content),
        excerpt: fm.dek ?? excerpt(content),
        data: fm,
      } satisfies Doc<F>;
    }),
  );
  return docs.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

let cache: Promise<{
  articles: Doc<Article>[];
  briefs: Doc<Brief>[];
  dossiers: Doc<Dossier>[];
  wire: WireItem[];
  events: CalendarEvent[];
}> | null = null;

async function loadAll() {
  const [articles, briefs, dossiers, wire, events] = await Promise.all([
    loadKind<Article>("article"),
    loadKind<Brief>("brief"),
    loadKind<Dossier>("dossier"),
    loadJsonDir("wire", WireFile),
    loadJsonDir("events", EventsFile),
  ]);
  wire.sort((a, b) => b.ts.getTime() - a.ts.getTime());
  events.sort((a, b) => a.date.getTime() - b.date.getTime());
  return { articles, briefs, dossiers, wire, events };
}

async function loadJsonDir<T>(sub: string, schema: { parse: (x: unknown) => T[] }): Promise<T[]> {
  const dir = path.join(ROOT, sub);
  let files: string[] = [];
  try {
    files = (await readdir(dir)).filter((f) => f.endsWith(".json"));
  } catch {
    return [];
  }
  const all = await Promise.all(
    files.map(async (f) => {
      const raw = JSON.parse(await readFile(path.join(dir, f), "utf8"));
      try {
        return schema.parse(raw);
      } catch (e) {
        throw new Error(`Invalid content/${sub}/${f}: ${(e as Error).message}`);
      }
    }),
  );
  return all.flat();
}

export function getContent() {
  if (!cache || process.env.NODE_ENV === "development") cache = loadAll();
  return cache;
}

export async function getDocs(): Promise<Doc[]> {
  const c = await getContent();
  return [...c.articles, ...c.briefs, ...c.dossiers].sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

export async function getDoc(slug: string): Promise<Doc | undefined> {
  return (await getDocs()).find((d) => d.slug === slug);
}

export async function getReadable(slug: string) {
  const c = await getContent();
  return [...c.articles, ...c.briefs].find((d) => d.slug === slug) as Doc<Article | Brief> | undefined;
}

export async function getDossier(slug: string) {
  const c = await getContent();
  return c.dossiers.find((d) => d.slug === slug);
}

export async function getWire(opts: { desk?: string; limit?: number } = {}) {
  const c = await getContent();
  const items = opts.desk ? c.wire.filter((w) => w.desk === opts.desk) : c.wire;
  return items.slice(0, opts.limit ?? 50);
}

export async function getEvents(opts: { desk?: string; limit?: number } = {}) {
  const c = await getContent();
  const items = opts.desk ? c.events.filter((w) => w.desk === opts.desk) : c.events;
  return items.slice(0, opts.limit ?? 30);
}

/** Serialisable summary for client components (command bar, headline lists). */
export interface DocSummary {
  slug: string;
  kind: Kind;
  href: string;
  title: string;
  dek: string;
  desk: string;
  date: string;
  readingTime: number;
  featured: boolean;
  instruments: string[];
  tags: string[];
  designation?: string;
  entity?: string;
}

export function summarize(d: Doc): DocSummary {
  return {
    slug: d.slug,
    kind: d.kind,
    href: d.href,
    title: d.data.title,
    dek: d.data.dek,
    desk: d.data.desk,
    date: d.data.date.toISOString(),
    readingTime: d.readingTime,
    featured: d.data.featured,
    instruments: d.data.instruments,
    tags: d.data.tags,
    designation: d.kind === "dossier" ? (d.data as Dossier).designation : undefined,
    entity: d.kind === "dossier" ? (d.data as Dossier).entity : undefined,
  };
}

/** Everything the command bar can jump to. Built once on the server, passed to the client. */
export interface CommandIndex {
  docs: DocSummary[];
  instruments: { symbol: string; name: string; unit: string; group: string }[];
  layouts: { id: string; name: string; description: string }[];
  themes: { id: string; name: string; tagline: string }[];
  panels: { type: string; name: string; description: string }[];
}

export async function getCommandIndex(): Promise<CommandIndex> {
  const docs = (await getDocs()).map(summarize);
  return {
    docs,
    instruments: instruments.map((i) => ({ symbol: i.symbol, name: i.name, unit: i.unit, group: i.group })),
    layouts: presetLayouts.map((l) => ({ id: l.id, name: l.name, description: l.description })),
    themes: themes.map((t) => ({ id: t.id, name: t.name, tagline: t.tagline })),
    panels: panelCatalog.map((p) => ({ type: p.type, name: p.name, description: p.description })),
  };
}
