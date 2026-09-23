import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemeChoice = "system" | "light" | "dark";

type ThemeState = {
  theme: ThemeChoice;
  setTheme: (theme: ThemeChoice) => void;
};

export function resolvedTheme(theme: ThemeChoice): "light" | "dark" {
  if (theme !== "system") return theme;
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function applyTheme(theme: ThemeChoice) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", resolvedTheme(theme) === "dark");
  document.documentElement.style.colorScheme = resolvedTheme(theme);
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: "system",
      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
      },
    }),
    {
      name: "galaxy-theme",
      onRehydrateStorage: () => (state) => {
        applyTheme(state?.theme ?? "system");
      },
    },
  ),
);
