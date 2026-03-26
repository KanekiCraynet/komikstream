"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { useMounted } from "@/hooks/useMounted";

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();

  if (!mounted) {
    return (
      <button
        className={cn(
          "inline-flex h-11 w-11 items-center justify-center rounded-lg",
          "bg-secondary hover:bg-secondary/80 transition-colors",
          className
        )}
      >
        <span className="sr-only">Toggle theme</span>
      </button>
    );
  }

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className={cn(
        "inline-flex h-11 w-11 items-center justify-center rounded-lg",
        "bg-secondary hover:bg-secondary/80 transition-colors",
        className
      )}
    >
      {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}
