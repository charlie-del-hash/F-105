#!/usr/bin/env tsx
/**
 * Every catalog row must have a registered component, and vice versa.
 *
 * The two halves are deliberately split — catalog.ts is metadata the server can
 * import, registry.tsx binds client components — so nothing in the type system
 * ties them together. Drift is silent until runtime, where a catalog row with no
 * definition renders "Unknown panel type" inside the frame and a definition with
 * no row hits a non-null assertion on panelMetaMap.get(...)!.
 *
 * Run: pnpm panels:check (part of `pnpm check`).
 */
import { panelCatalog } from "../src/panels/catalog";

// registry.tsx is "use client", but the definitions it imports are plain objects;
// reading the file is enough to see which ones it binds, without bundling React.
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const registrySrc = readFileSync(resolve(here, "../src/panels/registry.tsx"), "utf8");

// The entries of `const defs: PanelDefinition<any>[] = [ ... ]`.
// [\s\S] rather than the /s flag: tsconfig targets below es2018.
const defsBlock = registrySrc.match(/const defs:[^=]*=\s*\[([^\]]*)\]/)?.[1] ?? "";
const registered = [...defsBlock.matchAll(/(\w+)Definition/g)].map((m) => m[1]);

const problems: string[] = [];
if (registered.length === 0) problems.push("could not parse the `defs` array in registry.tsx");

// Definitions are named after their folder: src/panels/<type>/index.tsx exports <type>Definition.
const catalogTypes = new Set(panelCatalog.map((p) => p.type));
const registeredTypes = new Set(registered);

for (const t of catalogTypes) {
  if (!registeredTypes.has(t)) problems.push(`catalog has "${t}" but registry.tsx does not register ${t}Definition`);
}
for (const t of registeredTypes) {
  if (!catalogTypes.has(t)) problems.push(`registry.tsx registers ${t}Definition but the catalog has no "${t}" row`);
}

// Mnemonics are what the command bar parses and what a panel header shows, so a
// duplicate silently shadows another panel.
const seen = new Map<string, string>();
for (const p of panelCatalog) {
  const key = p.mnemonic.toUpperCase();
  if (seen.has(key)) problems.push(`mnemonic "${key}" is used by both "${seen.get(key)}" and "${p.type}"`);
  seen.set(key, p.type);
  if (p.defaultSize.w < p.minSize.w || p.defaultSize.h < p.minSize.h) {
    problems.push(`"${p.type}" has a defaultSize smaller than its minSize`);
  }
}

if (problems.length) {
  console.error("panel catalog/registry drift:\n" + problems.map((p) => `  ✗ ${p}`).join("\n"));
  process.exit(1);
}
console.log(`panels ok (${panelCatalog.length} types, mnemonics unique)`);
