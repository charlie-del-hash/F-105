/**
 * Preset layouts, validated at import time so a broken JSON fails the build.
 * Add a preset: drop a file in layouts/ and import it here.
 */
import { parseLayout, type Layout } from "./schema";
import desk from "../../layouts/desk.json";
import reader from "../../layouts/reader.json";
import energy from "../../layouts/energy.json";
import hangar from "../../layouts/hangar.json";
import bridge from "../../layouts/bridge.json";
import pocket from "../../layouts/pocket.json";

export const presetLayouts: Layout[] = [desk, reader, energy, hangar, bridge, pocket].map((raw) =>
  parseLayout({ ...raw, preset: true }),
);

export const defaultLayoutId = presetLayouts[0].id;

export function getPreset(id: string) {
  return presetLayouts.find((l) => l.id === id);
}
