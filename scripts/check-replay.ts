#!/usr/bin/env tsx
/**
 * Validates every replay under content/replays/: the scenario (schema, references,
 * tracks, the rules that keep it honest) and the credits ledger (every shipped
 * file has a row with an allowed licence). Part of `pnpm check`.
 *
 *   pnpm replay:check
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { Credits, LICENCES_OK, LICENCES_WARN, Scenario } from "../src/replay/schema";
import { places } from "../src/replay/places";

const root = process.cwd();
const replaysDir = path.join(root, "content/replays");
const errors: string[] = [];
const warnings: string[] = [];

const BBOX = { south: 12, north: 24, west: 98, east: 110 };

function walk(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((f) => {
    const p = path.join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

for (const id of existsSync(replaysDir) ? readdirSync(replaysDir) : []) {
  const dir = path.join(replaysDir, id);
  if (!statSync(dir).isDirectory()) continue;
  const where = (f: string) => `content/replays/${id}/${f}`;

  // ---- scenario -------------------------------------------------------------
  const scenarioPath = path.join(dir, "scenario.json");
  if (!existsSync(scenarioPath)) {
    errors.push(`${where("scenario.json")}: missing`);
  } else {
    const parsed = Scenario.safeParse(JSON.parse(readFileSync(scenarioPath, "utf8")));
    if (!parsed.success) {
      errors.push(`${where("scenario.json")}:\n${parsed.error.message}`);
    } else {
      const s = parsed.data;
      const err = (m: string) => errors.push(`${where("scenario.json")}: ${m}`);
      const sourceIds = new Set(s.sources.map((x) => x.id));
      const actorIds = new Set(s.actors.map((a) => a.id));
      const flightIds = new Set(s.flights.map((f) => f.id));
      const disputeIds = new Set(s.disputes.map((d) => d.id));

      const unique = (label: string, ids: string[]) => {
        const seen = new Set<string>();
        for (const x of ids) {
          if (seen.has(x)) err(`duplicate ${label} id "${x}"`);
          seen.add(x);
        }
      };
      unique("source", s.sources.map((x) => x.id));
      unique("actor", s.actors.map((x) => x.id));
      unique("flight", s.flights.map((x) => x.id));
      unique("event", s.events.map((x) => x.id));

      const cite = (what: string, basis: string, sources: string[]) => {
        for (const src of sources) if (!sourceIds.has(src)) err(`${what}: unknown source "${src}"`);
        if (basis === "documented" && sources.length === 0) err(`${what}: documented but cites nothing`);
      };
      cite("t0", s.t0.basis, s.t0.sources);
      cite("weather", s.weather.basis, s.weather.sources);
      if (s.t0.dispute && !disputeIds.has(s.t0.dispute)) err(`t0: unknown dispute "${s.t0.dispute}"`);

      for (const f of s.flights) {
        cite(`flight ${f.id}`, f.basis, f.sources);
        for (const m of f.members) if (!actorIds.has(m)) err(`flight ${f.id}: unknown member "${m}"`);
        if (f.base && !(f.base in places)) err(`flight ${f.id}: unknown base "${f.base}"`);
      }
      for (const a of s.actors) {
        cite(`actor ${a.id}`, a.basis, a.sources);
        if (a.flight && !flightIds.has(a.flight)) err(`actor ${a.id}: unknown flight "${a.flight}"`);
      }
      for (const tr of s.tracks) {
        if (!actorIds.has(tr.actor)) err(`track: unknown actor "${tr.actor}"`);
        tr.points.forEach((p, i) => {
          const at = `track ${tr.actor}[${i}]`;
          cite(at, p.basis, p.sources);
          if (i > 0 && p.t <= tr.points[i - 1].t) err(`${at}: time must increase (${tr.points[i - 1].t} → ${p.t})`);
          if (p.lat < BBOX.south || p.lat > BBOX.north || p.lon < BBOX.west || p.lon > BBOX.east) err(`${at}: ${p.lat}, ${p.lon} is outside the theatre`);
          if (p.altFt < 0 || p.altFt > 60_000) err(`${at}: altitude ${p.altFt} ft is implausible`);
          if (p.kt !== undefined && (p.kt < 100 || p.kt > 1300)) err(`${at}: speed ${p.kt} kt is implausible`);
        });
      }
      for (const e of s.events) {
        const at = `event ${e.id}`;
        cite(at, e.basis, e.sources);
        if (e.t === undefined && !e.when) err(`${at}: needs a time (t) or a when`);
        if (e.actor && !actorIds.has(e.actor)) err(`${at}: unknown actor "${e.actor}"`);
        if (e.target && !actorIds.has(e.target)) err(`${at}: unknown target "${e.target}"`);
        if (e.flight && !flightIds.has(e.flight)) err(`${at}: unknown flight "${e.flight}"`);
        if (e.dispute && !disputeIds.has(e.dispute)) err(`${at}: unknown dispute "${e.dispute}"`);
        if (e.kind === "kill") {
          // A kill on screen is a claim about real people: it must be cited.
          if (!e.weapon) err(`${at}: a kill needs its weapon`);
          if (!e.actor || !e.target) err(`${at}: a kill needs an actor and a target`);
          if (e.basis !== "documented") err(`${at}: a kill must be documented, not ${e.basis}`);
        }
      }
      for (const d of s.disputes) for (const p of d.positions) for (const src of p.sources) if (!sourceIds.has(src)) err(`dispute ${d.id}: unknown source "${src}"`);
      const pending = s.sources.filter((x) => x.consulted !== "read").length;
      if (pending) warnings.push(`${where("scenario.json")}: ${pending} of ${s.sources.length} sources not yet read in full (placeholder until checked)`);
    }
  }

  // ---- credits ----------------------------------------------------------------
  const creditsPath = path.join(dir, "credits.json");
  if (!existsSync(creditsPath)) {
    errors.push(`${where("credits.json")}: missing`);
    continue;
  }
  const credits = Credits.safeParse(JSON.parse(readFileSync(creditsPath, "utf8")));
  if (!credits.success) {
    errors.push(`${where("credits.json")}:\n${credits.error.message}`);
    continue;
  }
  const rows = new Map(credits.data.assets.map((a) => [a.file, a]));
  for (const a of credits.data.assets) {
    if ((LICENCES_WARN as readonly string[]).includes(a.licence)) warnings.push(`${a.file}: ${a.licence} — derivatives must stay ${a.licence}`);
    else if (!(LICENCES_OK as readonly string[]).includes(a.licence)) errors.push(`${where("credits.json")}: ${a.file} has licence "${a.licence}", not in the allowlist`);
    if (!a.file.startsWith("(") && !existsSync(path.join(root, a.file))) errors.push(`${where("credits.json")}: ${a.file} does not exist`);
  }
  for (const file of walk(path.join(root, "public/replay", id))) {
    const rel = path.relative(root, file).split(path.sep).join("/");
    if (!rows.has(rel)) errors.push(`${rel}: shipped without a row in ${where("credits.json")}`);
  }
}

for (const w of warnings) console.warn(`! ${w}`);
if (errors.length) {
  console.error(errors.map((e) => `✗ ${e}`).join("\n"));
  console.error(`\n${errors.length} replay error(s)`);
  process.exit(1);
}
console.log("✓ replays valid");
