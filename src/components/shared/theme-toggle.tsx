"use client";

import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="w-9 h-9 rounded-full bg-[var(--surface-container-high)] hover:bg-[var(--surface-container)] flex items-center justify-center transition-all hover:scale-105"
      title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
    >
      {theme === "dark" ? (
        <Sun className="h-4 w-4 text-[var(--on-surface-variant)]" />
      ) : (
        <Moon className="h-4 w-4 text-[var(--on-surface-variant)]" />
      )}
    </button>
  );
}
