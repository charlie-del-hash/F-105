"use client";
import { z } from "zod";
import { useWorkspace } from "@/layout-engine/store";
import { panelMetaMap } from "../catalog";
import type { PanelDefinition } from "../types";

const schema = z.object({ placeholder: z.string().default("Desk notes. Stays on this device.") });
type Props = z.infer<typeof schema>;

function NotesPanel({ props, panelId }: { props: Props; panelId: string }) {
  const text = useWorkspace((s) => s.notes[panelId] ?? "");
  const setNote = useWorkspace((s) => s.setNote);
  return (
    <textarea
      value={text}
      onChange={(e) => setNote(panelId, e.target.value)}
      placeholder={props.placeholder}
      spellCheck={false}
      // min-h so the scratchpad is usable in a panel that sizes to its content.
      className="h-full min-h-32 w-full resize-none bg-transparent px-3 py-2 font-data text-xs leading-relaxed text-ink outline-none placeholder:text-ink-3"
    />
  );
}

export const notesDefinition: PanelDefinition<Props> = {
  meta: panelMetaMap.get("notes")!,
  schema,
  fields: [{ key: "placeholder", label: "Placeholder", kind: "text" }],
  component: NotesPanel,
  defaultTitle: () => "Notes",
};
