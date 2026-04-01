"use client";

import { Film } from "lucide-react";
import { RouteError } from "@/components/ui/RouteError";

export default function AnimeDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteError
      error={error}
      reset={reset}
      title="Gagal Memuat Detail Anime"
      description="Terjadi kesalahan saat mengambil detail anime ini. Silakan coba lagi atau kembali ke daftar anime."
      routeHref="/anime"
      routeLabel="Daftar Anime"
      RouteIcon={Film}
    />
  );
}
