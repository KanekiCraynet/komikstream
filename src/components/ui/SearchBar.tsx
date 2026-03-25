"use client";

import { cn } from "@/lib/utils";
import { Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useTransition } from "react";

interface SearchBarProps {
  placeholder?: string;
  defaultValue?: string;
  searchPath?: string;
  className?: string;
}

export function SearchBar({
  placeholder = "Cari komik atau anime...",
  defaultValue = "",
  searchPath,
  className,
}: SearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState(defaultValue || searchParams.get("q") || "");

  const handleSearch = useCallback(() => {
    if (!value.trim()) return;

    startTransition(() => {
      if (searchPath) {
        router.push(`${searchPath}?q=${encodeURIComponent(value.trim())}`);
      } else {
        // Default: detect type based on current path or go to komik search
        router.push(`/komik/search?q=${encodeURIComponent(value.trim())}`);
      }
    });
  }, [value, searchPath, router]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleClear = () => {
    setValue("");
  };

  return (
    <div className={cn("relative flex w-full max-w-xl items-center", className)}>
      <div className="relative flex-1">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <input
          type="search"
          enterKeyHint="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(
            "border-input bg-background h-11 w-full rounded-lg border pr-10 pl-10",
            "placeholder:text-muted-foreground text-sm",
            "focus:ring-ring focus:border-transparent focus:ring-2 focus:outline-none",
            "transition-all duration-200"
          )}
        />
        {value && (
          <button
            onClick={handleClear}
            className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
            aria-label="Hapus pencarian"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <button
        onClick={handleSearch}
        disabled={isPending || !value.trim()}
        className={cn(
          "ml-2 h-11 rounded-lg px-4",
          "bg-primary text-primary-foreground font-medium",
          "hover:bg-primary/90 transition-colors",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "flex items-center gap-2"
        )}
      >
        {isPending ? (
          <div className="border-primary-foreground h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
        ) : (
          "Cari"
        )}
      </button>
    </div>
  );
}
