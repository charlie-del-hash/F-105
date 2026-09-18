"use client";
import { WorkspaceDataProvider, type WorkspaceData } from "./data-context";
import { useActiveLayout } from "./store";
import { WorkspaceGrid } from "./WorkspaceGrid";
import { WorkspaceToolbar } from "./WorkspaceToolbar";

export function Workspace({ data }: { data: WorkspaceData }) {
  const layout = useActiveLayout();
  return (
    <WorkspaceDataProvider value={data}>
      <div className="mx-auto w-full max-w-[1800px] px-2 py-2 md:px-3">
        <WorkspaceToolbar />
        <WorkspaceGrid layout={layout} />
      </div>
    </WorkspaceDataProvider>
  );
}
