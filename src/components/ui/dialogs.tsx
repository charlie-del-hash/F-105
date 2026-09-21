"use client";
/**
 * Promise-based dialogs, so `await dialogs.prompt(...)` reads like window.prompt
 * but looks like the product. Mount <DialogHost /> once, in the shell.
 */
import { useState } from "react";
import { create } from "zustand";
import { Button } from "./Button";
import { Field, Input } from "./Field";
import { Modal } from "./Modal";

interface PromptSpec {
  kind: "prompt";
  title: string;
  label?: string;
  defaultValue?: string;
  placeholder?: string;
  confirm?: string;
  resolve: (value: string | null) => void;
}
interface ConfirmSpec {
  kind: "confirm";
  title: string;
  body?: string;
  confirm?: string;
  danger?: boolean;
  resolve: (ok: boolean) => void;
}
type Spec = PromptSpec | ConfirmSpec;

interface DialogState {
  current: Spec | null;
  prompt(opts: Omit<PromptSpec, "kind" | "resolve">): Promise<string | null>;
  confirm(opts: Omit<ConfirmSpec, "kind" | "resolve">): Promise<boolean>;
  close(): void;
}

export const useDialogs = create<DialogState>((set) => ({
  current: null,
  prompt: (opts) => new Promise((resolve) => set({ current: { kind: "prompt", ...opts, resolve } })),
  confirm: (opts) => new Promise((resolve) => set({ current: { kind: "confirm", ...opts, resolve } })),
  close: () => set({ current: null }),
}));

/** Imperative access from anywhere (event handlers, stores). */
export const dialogs = {
  prompt: (opts: Omit<PromptSpec, "kind" | "resolve">) => useDialogs.getState().prompt(opts),
  confirm: (opts: Omit<ConfirmSpec, "kind" | "resolve">) => useDialogs.getState().confirm(opts),
};

function PromptDialog({ spec, close }: { spec: PromptSpec; close: () => void }) {
  const [value, setValue] = useState(spec.defaultValue ?? "");
  const done = (v: string | null) => {
    spec.resolve(v);
    close();
  };
  return (
    <Modal
      open
      onClose={() => done(null)}
      title={spec.title}
      width="sm"
      footer={
        <>
          <Button variant="ghost" onClick={() => done(null)}>Cancel</Button>
          <Button variant="solid" onClick={() => done(value.trim() || null)} disabled={!value.trim()}>{spec.confirm ?? "Save"}</Button>
        </>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (value.trim()) done(value.trim());
        }}
      >
        <Field label={spec.label ?? "Name"}>
          <Input autoFocus value={value} onChange={(e) => setValue(e.target.value)} placeholder={spec.placeholder} onFocus={(e) => e.target.select()} />
        </Field>
      </form>
    </Modal>
  );
}

function ConfirmDialog({ spec, close }: { spec: ConfirmSpec; close: () => void }) {
  const done = (ok: boolean) => {
    spec.resolve(ok);
    close();
  };
  return (
    <Modal
      open
      onClose={() => done(false)}
      title={spec.title}
      width="sm"
      footer={
        <>
          <Button variant="ghost" onClick={() => done(false)}>Cancel</Button>
          <Button variant="solid" onClick={() => done(true)} className={spec.danger ? "bg-alert text-white" : undefined}>{spec.confirm ?? "Confirm"}</Button>
        </>
      }
    >
      {spec.body && <p className="m-0 font-ui text-sm text-ink-2">{spec.body}</p>}
    </Modal>
  );
}

export function DialogHost() {
  const current = useDialogs((s) => s.current);
  const close = useDialogs((s) => s.close);
  if (!current) return null;
  return current.kind === "prompt" ? <PromptDialog key="p" spec={current} close={close} /> : <ConfirmDialog key="c" spec={current} close={close} />;
}
