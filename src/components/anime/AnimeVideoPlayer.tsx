"use client";

import { getAnimeVideo } from "@/lib/api-client";
import { Film, Settings } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

interface AnimeVideoPlayerProps {
  episodeId: string;
  animeUrlId: string;
  reso: string;
}

const DEFAULT_RESOLUTIONS = ["360p", "480p", "720p", "1080p"];

export default function AnimeVideoPlayer({ episodeId, animeUrlId, reso }: AnimeVideoPlayerProps) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoType, setVideoType] = useState<"direct" | "embed">("direct");
  const [availableResolutions, setAvailableResolutions] = useState<string[]>(DEFAULT_RESOLUTIONS);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const loadVideo = useCallback(async () => {
    if (!episodeId) return;

    setLoading(true);
    setError(null);

    try {
      const result = await getAnimeVideo(episodeId, reso);
      setVideoUrl(result.url);
      setVideoType(result.type);
      if (result.availableResolutions.length > 0) {
        setAvailableResolutions(result.availableResolutions);
      }
    } catch {
      setError("Gagal memuat video. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  }, [episodeId, reso]);

  useEffect(() => {
    loadVideo();
  }, [loadVideo]);

  const handleVideoError = useCallback(() => {
    setError("Video gagal diputar. Coba resolusi lain atau refresh halaman.");
  }, []);

  return (
    <>
      {/* Video Player */}
      <main className="flex min-h-[50vh] items-center justify-center bg-black sm:min-h-[60vh]">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="border-primary mb-4 h-12 w-12 animate-spin rounded-full border-4 border-t-transparent" />
            <p className="text-lg font-medium text-white">Memuat video...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <Film className="text-muted-foreground/50 mb-4 h-16 w-16" />
            <p className="text-lg font-medium text-white">{error}</p>
            <p className="text-muted-foreground mt-2 text-sm">
              Coba resolusi yang berbeda atau refresh halaman
            </p>
          </div>
        ) : videoUrl ? (
          <div className="aspect-video w-full max-w-5xl">
            {videoType === "direct" ? (
              <video
                ref={videoRef}
                src={videoUrl}
                controls
                autoPlay
                playsInline
                controlsList="nodownload"
                className="h-full w-full rounded-lg"
                onError={handleVideoError}
              >
                Browser Anda tidak mendukung pemutaran video.
              </video>
            ) : (
              <iframe
                src={videoUrl}
                className="h-full w-full"
                title="Video player"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <Film className="text-muted-foreground/50 mb-4 h-16 w-16" />
            <p className="text-lg font-medium text-white">Video tidak tersedia</p>
            <p className="text-muted-foreground mt-2 text-sm">Coba resolusi yang berbeda</p>
          </div>
        )}
      </main>

      {/* Resolution selector */}
      <div className="bg-background border-border border-t">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4 py-3">
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Resolusi:</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {availableResolutions.map((r) => (
                <Link
                  key={r}
                  href={`/watch/${animeUrlId}/${episodeId}?reso=${r}`}
                  className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
                    reso === r
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                >
                  {r}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
