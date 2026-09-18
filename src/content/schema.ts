/**
 * Content schemas. Every file under content/ is validated against one of
 * these at load time, so a typo in front matter fails the build, not the reader.
 *
 * Kinds:
 *   article  — long-form editorial (history, analysis). content/articles/*.mdx
 *   brief    — short market/analysis note tied to instruments. content/briefs/*.mdx
 *   dossier  — structured profile of an entity (aircraft, ship class, chokepoint,
 *              terminal, company). content/dossiers/*.mdx
 *   wire     — one-line items with a timestamp. content/wire/*.json
 *   event    — dated calendar entries. content/events/*.json
 */
import { z } from "zod";
import { deskIds } from "@/config/site";

export const DeskSchema = z.enum(deskIds);

const Hero = z.object({
  src: z.string().optional(),
  alt: z.string().default(""),
  caption: z.string().optional(),
  credit: z.string().optional(),
  ratio: z.enum(["wide", "43", "square"]).default("wide"),
});

const Base = z.object({
  title: z.string().min(3),
  dek: z.string().min(10),
  date: z.coerce.date(),
  updated: z.coerce.date().optional(),
  desk: DeskSchema,
  tags: z.array(z.string()).default([]),
  byline: z.string().default("By the Desk"),
  hero: Hero.optional(),
  featured: z.boolean().default(false),
  /** Instruments this piece is "about" — surfaces a quote strip on the page. */
  instruments: z.array(z.string()).default([]),
  /** Related content slugs (any kind). */
  related: z.array(z.string()).default([]),
  /** Reading time override, in minutes. Computed from the body if omitted. */
  readingTime: z.number().optional(),
  sources: z.array(z.string()).default([]),
  /** Demo/placeholder marker: shown as a badge so nobody mistakes it for reporting. */
  placeholder: z.boolean().default(true),
});

export const ArticleFrontmatter = Base.extend({
  kind: z.literal("article").default("article"),
  timeline: z
    .object({
      title: z.string().default("Timeline"),
      items: z.array(
        z.object({ date: z.string(), title: z.string(), text: z.string().optional(), key: z.boolean().default(false) }),
      ),
    })
    .optional(),
});

export const BriefFrontmatter = Base.extend({
  kind: z.literal("brief").default("brief"),
  /** Bloomberg-style one-line "so what". */
  bottomLine: z.string().min(10),
  stance: z.enum(["bullish", "bearish", "neutral", "watch"]).default("watch"),
  horizon: z.string().default("1–3 months"),
});

export const DossierFrontmatter = Base.extend({
  kind: z.literal("dossier").default("dossier"),
  /** What kind of thing this is a dossier on. Drives the spec-sheet layout. */
  entity: z.enum(["aircraft", "vessel-class", "chokepoint", "facility", "company", "programme"]),
  /** Short designation for headers, e.g. "F-105D", "TD3C", "Hormuz". */
  designation: z.string(),
  status: z.enum(["active", "retired", "planned", "contested", "watch"]).default("active"),
  specs: z.array(z.object({ label: z.string(), value: z.string(), note: z.string().optional() })).default([]),
  variants: z
    .object({
      columns: z.array(z.string()),
      rows: z.array(z.array(z.string())),
    })
    .optional(),
  /** Dual-use notes: the civilian and the military reading of the same thing. */
  dualUse: z
    .object({
      civil: z.string(),
      military: z.string(),
    })
    .optional(),
  timeline: ArticleFrontmatter.shape.timeline,
});

export const WireItem = z.object({
  id: z.string(),
  ts: z.coerce.date(),
  desk: DeskSchema,
  text: z.string().min(5),
  priority: z.enum(["flash", "urgent", "routine"]).default("routine"),
  href: z.string().optional(),
  instruments: z.array(z.string()).default([]),
  source: z.string().optional(),
});
export const WireFile = z.array(WireItem);

export const CalendarEvent = z.object({
  id: z.string(),
  date: z.coerce.date(),
  time: z.string().optional(),
  tz: z.string().default("UTC"),
  desk: DeskSchema,
  title: z.string(),
  note: z.string().optional(),
  importance: z.enum(["high", "medium", "low"]).default("medium"),
  instruments: z.array(z.string()).default([]),
});
export const EventsFile = z.array(CalendarEvent);

export type Article = z.infer<typeof ArticleFrontmatter>;
export type Brief = z.infer<typeof BriefFrontmatter>;
export type Dossier = z.infer<typeof DossierFrontmatter>;
export type WireItem = z.infer<typeof WireItem>;
export type CalendarEvent = z.infer<typeof CalendarEvent>;

export type Kind = "article" | "brief" | "dossier";
export type Frontmatter = Article | Brief | Dossier;

/** A loaded document: validated front matter + raw MDX body + derived fields. */
export interface Doc<F extends Frontmatter = Frontmatter> {
  slug: string;
  kind: Kind;
  href: string;
  body: string;
  readingTime: number;
  excerpt: string;
  data: F;
}

export const kindDirs: Record<Kind, string> = {
  article: "articles",
  brief: "briefs",
  dossier: "dossiers",
};

export const kindHref: Record<Kind, (slug: string) => string> = {
  article: (s) => `/read/${s}`,
  brief: (s) => `/read/${s}`,
  dossier: (s) => `/dossier/${s}`,
};
