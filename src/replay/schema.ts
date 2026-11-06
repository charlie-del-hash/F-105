/**
 * The replay's data contract. A scenario is what happened, field by field, with
 * how we know it: every actor, track point and event carries a `basis` and its
 * sources, so the film can mark ● documented and ◌ reconstructed honestly, and
 * the check can refuse a kill nobody can cite.
 *
 *   documented    a source says so (secondary sources count, and say so)
 *   inferred      follows from documented facts plus a stated assumption
 *   illustrative  invented for the picture; never presented as fact
 *
 * Time `t` is seconds from the scenario's T0 (for Bolo: Olds flight over Phuc
 * Yen, 15:00 local). Context outside the timeline uses `when` instead.
 */
import { z } from "zod";

export const Basis = z.enum(["documented", "inferred", "illustrative"]);
export type Basis = z.infer<typeof Basis>;

export const Source = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  citation: z.string().min(5),
  url: z.string().url().optional(),
  kind: z.enum(["primary", "secondary", "reference", "dataset"]),
  /** Whether the text itself has been read for this replay, or only a summary of it. */
  consulted: z.enum(["read", "summary", "not-yet"]),
  note: z.string().optional(),
});

const sourced = { basis: Basis, sources: z.array(z.string()).default([]) };

export const Crew = z.object({
  name: z.string(),
  rank: z.string().optional(),
  seat: z.enum(["front", "rear", "pilot"]),
});

export const AircraftType = z.enum(["F-4C", "MiG-21PFL", "MiG-21", "F-105D", "F-105F", "F-104C", "EB-66", "EC-121", "KC-135"]);

export const Actor = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  side: z.enum(["usaf", "vpaf"]),
  type: AircraftType,
  /** Radio call sign, e.g. "Olds 01", when the position in the flight is known. */
  callsign: z.string().optional(),
  flight: z.string().optional(),
  serial: z.string().optional(),
  unit: z.string().optional(),
  crew: z.array(Crew).default([]),
  note: z.string().optional(),
  ...sourced,
});

export const Flight = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  callsign: z.string(),
  role: z.enum(["west-force", "east-force", "iron-hand", "cap", "support", "intercept"]),
  unit: z.string().optional(),
  base: z.string().optional(),
  engaged: z.boolean(),
  members: z.array(z.string()).default([]),
  note: z.string().optional(),
  ...sourced,
});

export const Waypoint = z.object({
  t: z.number(),
  lat: z.number(),
  lon: z.number(),
  altFt: z.number(),
  kt: z.number().optional(),
  ...sourced,
});

export const Track = z.object({
  actor: z.string(),
  points: z.array(Waypoint).min(2),
  note: z.string().optional(),
});

export const Weapon = z.enum(["AIM-7E", "AIM-9B", "AIM-7", "AIM-9"]);

export const Event = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  kind: z.enum(["context", "takeoff", "refuel", "push", "arrive", "tally", "launch", "fox1", "fox2", "kill", "eject", "egress", "rtb", "weather"]),
  /** Seconds from T0. Omit for context outside the timeline and give `when`. */
  t: z.number().optional(),
  when: z.string().optional(),
  /** How the *time* is known, when that differs from how the event is known. */
  tBasis: Basis.optional(),
  actor: z.string().optional(),
  flight: z.string().optional(),
  target: z.string().optional(),
  weapon: Weapon.optional(),
  text: z.string().min(5),
  dispute: z.string().optional(),
  ...sourced,
});

export const Dispute = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  topic: z.string(),
  positions: z.array(z.object({ claim: z.string(), sources: z.array(z.string()).min(1) })).min(2),
  /** What the film shows until the primary record settles it. */
  onScreen: z.string(),
});

export const Scenario = z.object({
  id: z.string(),
  title: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  /** Zone the times are given in, e.g. "+07:00". */
  tz: z.string().regex(/^[+-]\d{2}:\d{2}$/),
  t0: z.object({ local: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/), what: z.string(), ...sourced, dispute: z.string().optional() }),
  weather: z.object({ undercastTopsFt: z.number(), coverage: z.string(), note: z.string().optional(), ...sourced }),
  sources: z.array(Source).min(1),
  flights: z.array(Flight),
  actors: z.array(Actor),
  tracks: z.array(Track).default([]),
  events: z.array(Event),
  disputes: z.array(Dispute).default([]),
});

export type Scenario = z.infer<typeof Scenario>;
export type Event = z.infer<typeof Event>;
export type Actor = z.infer<typeof Actor>;
export type Track = z.infer<typeof Track>;
export type Waypoint = z.infer<typeof Waypoint>;

export const LICENCES_OK = ["CC0", "CC-BY-4.0", "PD-USGov", "OFL-1.1", "MIT", "Apache-2.0", "Copernicus", "original"] as const;
export const LICENCES_WARN = ["CC-BY-SA-4.0"] as const;

export const Credits = z.object({
  assets: z.array(
    z.object({
      file: z.string(),
      title: z.string(),
      author: z.string(),
      source: z.string(),
      licence: z.string(),
      attribution: z.string().optional(),
      modifications: z.string().optional(),
    }),
  ),
});
export type Credits = z.infer<typeof Credits>;
