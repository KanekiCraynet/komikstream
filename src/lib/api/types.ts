/**
 * Raw API Response Types — Video Server Contract
 *
 * These 3 interfaces define the contract between getAnimeEpisode()
 * and the /api/anime/video route handler.
 */

export interface RawServerItem {
  title?: string;
  serverId?: string;
  href?: string;
}

export interface RawQualityItem {
  title?: string;
  serverList?: RawServerItem[];
}

export interface RawEpisodeData {
  title?: string;
  animeId?: string;
  releaseTime?: string;
  defaultStreamingUrl?: string;
  hasPrevEpisode?: boolean;
  prevEpisode?: { episodeId?: string } | null;
  hasNextEpisode?: boolean;
  nextEpisode?: { episodeId?: string } | null;
  server?: {
    qualities?: RawQualityItem[];
  };
  downloadUrl?: {
    qualities?: Array<{
      title?: string;
      size?: string;
      urls?: Array<{ title?: string; url?: string }>;
    }>;
  };
}
