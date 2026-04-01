"use client";

import { Film } from "lucide-react";
import { RouteError } from "@/components/ui/RouteError";

export default function WatchError({
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
      title="Gagal Memuat Video"
      description="Terjadi kesalahan saat memuat video. Silakan coba lagi atau kembali ke halaman anime."
      routeHref="/anime"
      routeLabel="Halaman Anime"
      RouteIcon={Film}
    />
  );
}
