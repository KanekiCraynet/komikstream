import { NextRequest, NextResponse } from "next/server";
import { handleApiError, validateSearchParams } from "@/lib/api-helpers";
import { ExternalApiError, NotFoundError } from "@/lib/errors";
import { animeVideoParamsSchema } from "@/lib/validations/anime-video";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.sansekai.my.id/api";

interface StreamEntry {
  reso: string;
  link: string;
  provide?: number;
}

/**
 * Determine whether a URL points to a direct video file (.mp4, .mkv, .webm, .m3u8)
 * rather than an embeddable player page.
 */
function isDirectVideoUrl(url: string): boolean {
  return /\.(mp4|mkv|webm|m3u8|mpd)([?#]|$)/i.test(url);
}

export async function GET(request: NextRequest) {
  try {
    const { chapterUrlId, reso: resolution } = validateSearchParams(
      request,
      animeVideoParamsSchema
    );

    const url = `${BASE_URL}/anime/getvideo?chapterUrlId=${chapterUrlId}&reso=${resolution}`;
    const res = await fetch(url, {
      cache: "no-store",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "application/json",
        "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
        Referer: "https://api.sansekai.my.id/",
      },
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new ExternalApiError(
        `Failed to fetch video from upstream: HTTP ${res.status} ${res.statusText} ${body.slice(0, 200)}`,
        { status: res.status, url }
      );
    }

    const data = await res.json();
    const episodeData = data.data?.[0];

    if (!episodeData) {
      throw new NotFoundError("Video");
    }

    const allStreams: StreamEntry[] = episodeData.stream || [];

    // Filter out URLs that force downloads (e.g. pixeldrain ?download links)
    // and prefer streams from higher-numbered providers (more reliable).
    const usableStreams = allStreams
      .filter((s: StreamEntry) => !s.link.includes("?download"))
      .sort((a: StreamEntry, b: StreamEntry) => (b.provide ?? 0) - (a.provide ?? 0));

    // Find the stream matching the requested resolution
    const matchingStream = usableStreams.find((s: StreamEntry) => s.reso === resolution);
    const videoUrl = matchingStream?.link || usableStreams[0]?.link || null;

    // Determine which resolutions are available.
    // The upstream `reso` field lists all possible resolutions for the episode.
    // Note: the upstream only returns streams for the *requested* resolution,
    // so we rely on the declared list. If a declared resolution has no streams
    // when requested, the watch page will show an appropriate error.
    const availableResolutions: string[] = episodeData.reso || [];

    // Detect whether the URL is a direct video file or an embeddable player
    const urlType = videoUrl && isDirectVideoUrl(videoUrl) ? "direct" : "embed";

    return NextResponse.json({
      url: videoUrl,
      type: urlType,
      availableResolutions,
    });
  } catch (error) {
    return handleApiError(error, "GET /api/anime/video");
  }
}
