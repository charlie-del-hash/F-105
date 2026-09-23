"use client";
/** Reader preferences: type size, and whether to read on Paper. Device-local. */
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type ReadSize = "S" | "M" | "L";

interface ReadingState {
  size: ReadSize;
  /**
   * Read long-form on Paper. It used to work by stashing the previous theme and
   * calling setTheme, which left Paper switched on globally after you navigated
   * away and restored to a hard-coded "terminal" if the stash was empty. It is a
   * preference now; `ReadingSurface` turns it into an ephemeral theme override
   * that only exists while a reading page is mounted.
   */
  paper: boolean;
  setSize(size: ReadSize): void;
  setPaper(paper: boolean): void;
}

export const useReading = create<ReadingState>()(
  persist(
    (set) => ({
      size: "M",
      paper: false,
      setSize: (size) => set({ size }),
      setPaper: (paper) => set({ paper }),
    }),
    { name: "f105.reading", storage: createJSONStorage(() => localStorage), skipHydration: true },
  ),
);
