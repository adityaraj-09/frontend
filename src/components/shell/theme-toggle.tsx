"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useThemeStore, type ThemeChoice } from "@/stores/theme";
import { cn } from "@/lib/utils";

const OPTIONS: Array<{ id: ThemeChoice; label: string; Icon: typeof Sun }> = [
  { id: "system", label: "System theme", Icon: Monitor },
  { id: "light", label: "Light theme", Icon: Sun },
  { id: "dark", label: "Dark theme", Icon: Moon },
];

export function ThemeToggle() {
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);

  return (
    <div className="flex h-9 w-full items-center rounded-full border border-border bg-background px-1">
      {OPTIONS.map((option) => (
        <button
          key={option.id}
          type="button"
          aria-label={option.label}
          aria-pressed={theme === option.id}
          className={cn(
            "flex h-7 flex-1 items-center justify-center rounded-full text-muted-foreground",
            theme === option.id && "bg-muted text-foreground",
          )}
          onClick={() => setTheme(option.id)}
        >
          <option.Icon className="size-4" strokeWidth={1.75} />
        </button>
      ))}
    </div>
  );
}
