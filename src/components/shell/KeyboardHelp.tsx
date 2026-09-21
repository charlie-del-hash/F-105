"use client";
import { Modal } from "@/components/ui/Modal";

const groups: { title: string; rows: [string[], string][] }[] = [
  {
    title: "Anywhere",
    rows: [
      [["⌘", "K"], "Command bar — search, or type a mnemonic"],
      [["/"], "Command bar"],
      [["?"], "This overlay"],
      [["T"], "Next theme"],
      [["Esc"], "Close, or leave edit mode"],
    ],
  },
  {
    title: "Desk",
    rows: [
      [["E"], "Edit layout on / off"],
      [["["], "Previous layout"],
      [["]"], "Next layout"],
    ],
  },
  {
    title: "Editing, with a panel header focused",
    rows: [
      [["Tab"], "Move between panels"],
      [["↑", "↓", "←", "→"], "Move the panel one cell"],
      [["⇧", "arrows"], "Resize the panel"],
      [["⌫"], "Remove the panel"],
    ],
  },
  {
    title: "Mnemonics",
    rows: [
      [["GP", "TTF"], "Chart an instrument"],
      [["DES", "hormuz"], "Open a dossier"],
      [["QB", "brent ttf"], "Add a quote board"],
      [["WIRE", "shp"], "Add a desk's wire"],
      [["THEME", "paper"], "Switch theme"],
      [["LAYOUT", "bridge"], "Open a layout"],
    ],
  },
];

export function KeyboardHelp({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} kicker="Keyboard" title="Everything without a mouse" width="lg">
      <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
        {groups.map((g) => (
          <section key={g.title}>
            <h3 className="caps mb-2 text-ink-3">{g.title}</h3>
            <dl className="space-y-1.5">
              {g.rows.map(([keys, what]) => (
                <div key={what} className="flex items-baseline gap-3">
                  <dt className="flex w-28 shrink-0 flex-wrap gap-1">
                    {keys.map((k) => (
                      <kbd key={k} className="kbd">{k}</kbd>
                    ))}
                  </dt>
                  <dd className="m-0 font-ui text-sm text-ink-2">{what}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
    </Modal>
  );
}
