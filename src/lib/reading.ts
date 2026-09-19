"use client";
/** Reader preferences: type size, and the theme to return to after "read on Paper". */
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { ThemeId } from "@/design/tokens";

export type ReadSize = "S" | "M" | "L";

interface ReadingState {
  size: ReadSize;
  prevTheme: ThemeId | null;
  setSize(size: ReadSize): void;
  setPrevTheme(theme: ThemeId | null): void;
}

export const useReading = create<ReadingState>()(
  persist(
    (set) => ({
      size: "M",
      prevTheme: null,
      setSize: (size) => set({ size }),
      setPrevTheme: (prevTheme) => set({ prevTheme }),
    }),
    { name: "f105.reading", storage: createJSONStorage(() => localStorage), skipHydration: true },
  ),
);
