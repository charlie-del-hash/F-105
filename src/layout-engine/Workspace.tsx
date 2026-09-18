"use client";
import { WorkspaceDataProvider, type WorkspaceData } from "./data-context";
import { useActiveLayout } from "./store";
import { LayoutTabs } from "./LayoutTabs";
import { WorkspaceGrid } from "./WorkspaceGrid";

export function Workspace({ data }: { data: WorkspaceData }) {
  const layout = useActiveLayout();
  return (
    <WorkspaceDataProvider value={data}>
      <div className="mx-auto w-full max-w-[1800px] px-2 pb-3 md:px-3">
        <LayoutTabs />
        <WorkspaceGrid layout={layout} />
      </div>
    </WorkspaceDataProvider>
  );
}
