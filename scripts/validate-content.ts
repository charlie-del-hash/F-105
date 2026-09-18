/**
 * Validates every file under content/ against the schemas, without booting Next.
 * Run: pnpm content:check
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { ArticleFrontmatter, BriefFrontmatter, DossierFrontmatter, EventsFile, WireFile } from "../src/content/schema";
import { instrumentMap } from "../src/data/instruments";

const root = path.join(process.cwd(), "content");
let errors = 0;
const slugs = new Set<string>();

function check(dir: string, schema: { safeParse: (x: unknown) => { success: boolean; error?: { message: string } } }, kind: string) {
  for (const f of readdirSync(path.join(root, dir)).filter((x) => /\.mdx?$/.test(x))) {
    const { data } = matter(readFileSync(path.join(root, dir, f), "utf8"));
    const r = schema.safeParse({ kind, ...data });
    if (!r.success) {
      errors++;
      console.error(`✗ content/${dir}/${f}\n${r.error?.message}`);
      continue;
    }
    const slug = f.replace(/\.mdx?$/, "");
    if (slugs.has(slug)) {
      errors++;
      console.error(`✗ duplicate slug ${slug}`);
    }
    slugs.add(slug);
    for (const s of (data.instruments as string[] | undefined) ?? []) {
      if (!instrumentMap.has(s)) {
        errors++;
        console.error(`✗ content/${dir}/${f}: unknown instrument ${s}`);
      }
    }
  }
}

check("articles", ArticleFrontmatter, "article");
check("briefs", BriefFrontmatter, "brief");
check("dossiers", DossierFrontmatter, "dossier");

for (const [dir, schema] of [["wire", WireFile], ["events", EventsFile]] as const) {
  for (const f of readdirSync(path.join(root, dir)).filter((x) => x.endsWith(".json"))) {
    const r = schema.safeParse(JSON.parse(readFileSync(path.join(root, dir, f), "utf8")));
    if (!r.success) {
      errors++;
      console.error(`✗ content/${dir}/${f}\n${r.error.message}`);
    } else {
      for (const item of r.data) {
        for (const s of item.instruments) {
          if (!instrumentMap.has(s)) {
            errors++;
            console.error(`✗ content/${dir}/${f} item ${item.id}: unknown instrument ${s}`);
          }
        }
      }
    }
  }
}

// Related slugs must exist.
for (const dir of ["articles", "briefs", "dossiers"]) {
  for (const f of readdirSync(path.join(root, dir)).filter((x) => /\.mdx?$/.test(x))) {
    const { data } = matter(readFileSync(path.join(root, dir, f), "utf8"));
    for (const r of (data.related as string[] | undefined) ?? []) {
      if (!slugs.has(r)) {
        errors++;
        console.error(`✗ content/${dir}/${f}: related slug ${r} does not exist`);
      }
    }
  }
}

if (errors) {
  console.error(`\n${errors} content error(s)`);
  process.exit(1);
}
console.log(`✓ content valid (${slugs.size} documents)`);
