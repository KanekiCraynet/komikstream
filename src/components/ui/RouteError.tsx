"use client";

import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";

interface RouteErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
  title: string;
  description: string;
  routeHref: string;
  routeLabel: string;
  RouteIcon: LucideIcon;
}

export function RouteError({
  error,
  reset,
  title,
  description,
  routeHref,
  routeLabel,
  RouteIcon,
}: RouteErrorProps) {
  return (
    <div className="container mx-auto flex min-h-[calc(100vh-12rem)] flex-col items-center justify-center px-4 text-center">
      <div className="mb-8 flex flex-col items-center">
        <div className="bg-destructive/10 mb-6 rounded-full p-8">
          <AlertTriangle className="text-destructive h-16 w-16" />
        </div>
      </div>
      <h2 className="mb-4 text-2xl font-bold">{title}</h2>
      <p className="text-muted-foreground mb-4 max-w-md text-lg">{description}</p>
      {process.env.NODE_ENV !== "production" && error.message && (
        <div className="bg-destructive/10 border-destructive/20 mb-8 rounded-lg border px-4 py-3">
          <p className="text-destructive font-mono text-sm">Error: {error.message}</p>
        </div>
      )}
      {process.env.NODE_ENV === "production" && error.digest && (
        <p className="text-muted-foreground mb-8 text-xs">Kode error: {error.digest}</p>
      )}
      <div className="flex flex-wrap items-center justify-center gap-4">
        <button
          onClick={reset}
          className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-xl px-8 py-4 text-base font-medium shadow-lg transition-all hover:scale-105 hover:shadow-xl"
        >
          <RefreshCw className="h-5 w-5" />
          Coba Lagi
        </button>
        <Link
          href={routeHref}
          className="bg-secondary text-secondary-foreground hover:bg-secondary/80 inline-flex items-center gap-2 rounded-xl px-8 py-4 text-base font-medium shadow-md transition-all hover:scale-105"
        >
          <RouteIcon className="h-5 w-5" />
          {routeLabel}
        </Link>
        <Link
          href="/"
          className="bg-secondary text-secondary-foreground hover:bg-secondary/80 inline-flex items-center gap-2 rounded-xl px-8 py-4 text-base font-medium shadow-md transition-all hover:scale-105"
        >
          <Home className="h-5 w-5" />
          Beranda
        </Link>
      </div>
    </div>
  );
}
