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

/**
 * The layout a phone should open on. The default is Desk — nine panels, about
 * 2,950px of scroll on a 390px screen — which is the right default for the
 * desktop it was drawn for and the wrong one for a pocket. Shell picks this
 * instead on a narrow viewport's first run; see the note there for why it is
 * first-run only. Pocket declares Glass, so an unpinned phone also lands on the
 * phone theme.
 */
export const phoneLayoutId = "pocket";

export function getPreset(id: string) {
  return presetLayouts.find((l) => l.id === id);
}
