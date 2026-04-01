"use client";

import { Book } from "lucide-react";
import { RouteError } from "@/components/ui/RouteError";

export default function KomikDetailError({
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
      title="Gagal Memuat Detail Komik"
      description="Terjadi kesalahan saat mengambil detail komik ini. Silakan coba lagi atau kembali ke daftar komik."
      routeHref="/komik"
      routeLabel="Daftar Komik"
      RouteIcon={Book}
    />
  );
}
