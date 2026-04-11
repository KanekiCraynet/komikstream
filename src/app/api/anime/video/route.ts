import { NextRequest, NextResponse } from "next/server";
import { handleApiError, validateSearchParams } from "@/lib/api-helpers";
import { ExternalApiError, NotFoundError } from "@/lib/errors";
import { animeVideoParamsSchema } from "@/lib/validations/anime-video";
import { getAnimeEpisode, getAnimeServerUrl } from "@/lib/api";

export async function GET(request: NextRequest) {
  try {
    const { episodeId, quality } = validateSearchParams(request, animeVideoParamsSchema);

    // Step 1: Fetch episode data to get server list, passing quality as reso
    let episodeData;
    try {
      episodeData = await getAnimeEpisode(episodeId, quality);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      throw new ExternalApiError(`Failed to fetch episode data: ${msg}`, {
        url: `/anime/episode/${episodeId}`,
      });
    }

    if (!episodeData) {
      throw new NotFoundError("Episode");
    }

    // Step 2: Find the matching quality and pick a server
    const qualities = episodeData.server?.qualities || [];
    const availableResolutions = qualities.map((q) => q.title || "").filter(Boolean);

    // Find the quality matching the request (e.g. "480p")
    const matchingQuality =
      qualities.find((q) => q.title === quality) ||
      qualities.find((q) => q.title === "480p") ||
      qualities[0];

    let videoUrl: string | null = null;

    if (matchingQuality?.serverList?.length) {
      // Pick the first available server
      const server = matchingQuality.serverList[0];
      if (server.serverId) {
        try {
          videoUrl = await getAnimeServerUrl(server.serverId);
        } catch {
          // Try fallback to defaultStreamingUrl
          videoUrl = episodeData.defaultStreamingUrl || null;
        }
      }
    }

    // Fallback to the default streaming URL from episode data
    if (!videoUrl && episodeData.defaultStreamingUrl) {
      videoUrl = episodeData.defaultStreamingUrl;
    }

    // Sansekai returns direct MP4 URLs
    return NextResponse.json({
      url: videoUrl,
      type: "direct",
      availableResolutions,
    });
  } catch (error) {
    return handleApiError(error, "GET /api/anime/video");
  }
}
