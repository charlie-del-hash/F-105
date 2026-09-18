# Writing content

All content lives in `content/` and is validated by `src/content/schema.ts`.
`pnpm content:check` runs the validation without starting the app.

## Kinds

| Kind | Folder | Route | Extra fields |
|---|---|---|---|
| article | `content/articles/*.mdx` | `/read/<slug>` | `timeline` |
| brief | `content/briefs/*.mdx` | `/read/<slug>` | `bottomLine` (required), `stance`, `horizon` |
| dossier | `content/dossiers/*.mdx` | `/dossier/<slug>` | `entity`, `designation`, `status`, `specs`, `variants`, `dualUse`, `timeline` |
| wire | `content/wire/*.json` | `/wire`, Wire panel | array of `{ id, ts, desk, text, priority, href?, instruments?, source? }` |
| event | `content/events/*.json` | Calendar panel, desk pages | array of `{ id, date, time?, tz?, desk, title, note?, importance, instruments? }` |

The file name is the slug.

## Common front matter

```yaml
title: "Headline"
dek: "One or two sentences. Shown everywhere the title is."
date: 2026-09-16
desk: air            # air | energy | shipping | geo | industry (src/config/site.ts)
tags: ["f-105"]
byline: "By the Air Power desk"
featured: true       # the Reader panel's "featured" slot
instruments: ["BRENT", "TTF"]   # must exist in src/data/instruments.ts
related: ["other-slug"]         # must exist
sources: ["Author, <em>Title</em>. Publisher, year."]
placeholder: true    # default; shows the "demo content" badge. Set false once verified.
```

## In-article components

```mdx
<Factbox title="At a glance" rows={[["Label", "Value"], ["Built", "833"]]} />
<PullQuote cite="Who said it">The quote.</PullQuote>
<Callout tone="warn" title="Heads up">Body.</Callout>
<Figure alt="Description" caption="Caption" credit="Credit" ratio="wide" />   {/* hatched placeholder when no src */}
<Dinkus />
<Sym s="TTF" />   {/* inline instrument link */}
```

## Dossiers

The spec sheet is deliberately short: comparable figures only, with an optional `note`.
`dualUse.civil` and `dualUse.military` are the two readings of the same thing — the
product's differentiator. Write both even when one is obvious.

## Standards

- Demo content stays labelled. Do not remove `placeholder: true` without a human check.
- Numbers you cannot source go in prose with "roughly", not in a spec sheet.
- A brief has a bottom line a reader can act on in one sentence.
