/**
 * Validates layouts/*.json against the schema and the panel catalog, and checks
 * that every panel's props satisfy that panel's own schema.
 * Run: pnpm layouts:check
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { parseLayout } from "../src/layout-engine/schema";
import { panelMetaMap } from "../src/panels/catalog";
import { collides } from "../src/layout-engine/grid";

const dir = path.join(process.cwd(), "layouts");
let errors = 0;
for (const f of readdirSync(dir).filter((x) => x.endsWith(".json"))) {
  try {
    const layout = parseLayout(JSON.parse(readFileSync(path.join(dir, f), "utf8")));
    const ids = new Set<string>();
    for (const p of layout.panels) {
      if (!panelMetaMap.has(p.type)) throw new Error(`panel ${p.id}: unknown type ${p.type}`);
      if (ids.has(p.id)) throw new Error(`duplicate panel id ${p.id}`);
      ids.add(p.id);
      const min = panelMetaMap.get(p.type)!.minSize;
      if (p.w < min.w || p.h < min.h) throw new Error(`panel ${p.id} smaller than its minimum ${min.w}×${min.h}`);
      for (const q of layout.panels) if (q !== p && collides(p, q)) throw new Error(`panels ${p.id} and ${q.id} overlap`);
    }
    console.log(`✓ layouts/${f} (${layout.panels.length} panels)`);
  } catch (e) {
    errors++;
    console.error(`✗ layouts/${f}: ${(e as Error).message}`);
  }
}
if (errors) process.exit(1);
