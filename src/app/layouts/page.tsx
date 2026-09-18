import type { Metadata } from "next";
import { LayoutGallery } from "./LayoutGallery";

export const metadata: Metadata = { title: "Layouts" };

export default function LayoutsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:px-6">
      <h1 className="caps mb-1 text-ink-3">Layouts</h1>
      <p className="mb-6 max-w-2xl font-ui text-sm text-ink-2">A layout is a named arrangement of panels on a twelve-column grid. Presets are starting points; anything you change becomes yours and stays on this device.</p>
      <LayoutGallery />
    </div>
  );
}
