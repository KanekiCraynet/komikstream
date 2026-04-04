/**
 * Tests for src/lib/api/transformers/anime.ts
 *
 * Covers: transformAnimeListItem, transformAnimeDetail, extractEpisodeNumber
 */

import {
  transformAnimeListItem,
  transformAnimeDetail,
  extractEpisodeNumber,
} from "@/lib/api/transformers/anime";
import type { RawAnimeListItem, RawAnimeDetailData } from "@/lib/api/types";

describe("anime transformers", () => {
  describe("transformAnimeListItem", () => {
    it("transforms a raw anime list item correctly", () => {
      const raw: RawAnimeListItem = {
        title: "Test Anime",
        poster: "thumb.jpg",
        animeId: "test-anime-sub-indo",
        status: "Ongoing",
        score: "8.5",
        genreList: [
          { title: "Action", genreId: "action" },
          { title: "Adventure", genreId: "adventure" },
        ],
      };

      const result = transformAnimeListItem(raw);

      expect(result.urlId).toBe("test-anime-sub-indo");
      expect(result.title).toBe("Test Anime");
      expect(result.thumbnail).toBe("thumb.jpg");
      expect(result.status).toBe("Ongoing");
      expect(result.rating).toBe("8.5");
      expect(result.genres).toEqual(["Action", "Adventure"]);
      expect(result.episodes).toEqual([]);
    });

    it("handles missing optional fields", () => {
      const raw: RawAnimeListItem = {
        animeId: "minimal",
      };

      const result = transformAnimeListItem(raw);

      expect(result.urlId).toBe("minimal");
      expect(result.title).toBe("");
      expect(result.thumbnail).toBe("");
      expect(result.status).toBeUndefined();
      expect(result.rating).toBeUndefined();
      expect(result.genres).toEqual([]);
    });

    it("handles empty genreList", () => {
      const raw: RawAnimeListItem = {
        animeId: "no-genres",
        title: "No Genres",
        genreList: [],
      };

      const result = transformAnimeListItem(raw);
      expect(result.genres).toEqual([]);
    });
  });

  describe("transformAnimeDetail", () => {
    it("transforms a full anime detail correctly", () => {
      const raw: RawAnimeDetailData = {
        title: "Detail Anime",
        poster: "detail.jpg",
        score: "9.0",
        type: "TV",
        status: "Completed",
        episodes: 24,
        duration: "23 Min",
        studios: "Studio A",
        synopsis: { paragraphs: ["Line 1", "Line 2"] },
        genreList: [{ title: "Drama", genreId: "drama" }],
        episodeList: [
          { title: "Episode 1", eps: 1, date: "1 Jan", episodeId: "ep-1" },
          { title: "Episode 2", eps: 2, date: "8 Jan", episodeId: "ep-2" },
        ],
      };

      const result = transformAnimeDetail(raw, "detail-1");

      expect(result.urlId).toBe("detail-1");
      expect(result.title).toBe("Detail Anime");
      expect(result.cover).toBe("detail.jpg");
      expect(result.synopsis).toBe("Line 1\n\nLine 2");
      expect(result.totalEpisodes).toBe(24);
      expect(result.duration).toBe("23 Min");
      expect(result.studio).toBe("Studio A");
      expect(result.genres).toEqual(["Drama"]);
      expect(result.episodes).toHaveLength(2);
      expect(result.episodes![0].episodeId).toBe("ep-1");
      expect(result.episodes![1].episodeId).toBe("ep-2");
    });

    it("sorts episodes in ascending order", () => {
      const raw: RawAnimeDetailData = {
        title: "Test",
        episodeList: [
          { title: "Episode 3", eps: 3, episodeId: "ep-3" },
          { title: "Episode 1", eps: 1, episodeId: "ep-1" },
          { title: "Episode 2", eps: 2, episodeId: "ep-2" },
        ],
      };

      const result = transformAnimeDetail(raw, "test");
      expect(result.episodes![0].episode).toBe(1);
      expect(result.episodes![1].episode).toBe(2);
      expect(result.episodes![2].episode).toBe(3);
    });

    it("strips path prefixes from episodeId", () => {
      const raw: RawAnimeDetailData = {
        title: "Test",
        episodeList: [
          { title: "Episode 1", eps: 1, episodeId: "/anime/episode/sdhm-episode-1-sub-indo" },
        ],
      };

      const result = transformAnimeDetail(raw, "test");
      expect(result.episodes![0].episodeId).toBe("sdhm-episode-1-sub-indo");
    });

    it("handles missing synopsis", () => {
      const raw: RawAnimeDetailData = {
        title: "No Synopsis",
      };

      const result = transformAnimeDetail(raw, "test");
      expect(result.synopsis).toBeUndefined();
    });

    it("handles empty synopsis paragraphs", () => {
      const raw: RawAnimeDetailData = {
        title: "Empty Synopsis",
        synopsis: { paragraphs: [] },
      };

      const result = transformAnimeDetail(raw, "test");
      expect(result.synopsis).toBeUndefined();
    });
  });

  describe("extractEpisodeNumber", () => {
    it("extracts integer episode number", () => {
      expect(extractEpisodeNumber("Episode 10")).toBe(10);
    });

    it("extracts decimal episode number", () => {
      expect(extractEpisodeNumber("Episode 5.5")).toBe(5.5);
    });

    it("extracts from various formats", () => {
      expect(extractEpisodeNumber("Ep 42")).toBe(42);
      expect(extractEpisodeNumber("episode-15")).toBe(15);
      expect(extractEpisodeNumber("Chapter 100")).toBe(100);
    });

    it("returns 0 for no number found", () => {
      expect(extractEpisodeNumber("No number")).toBe(0);
      expect(extractEpisodeNumber("")).toBe(0);
    });
  });
});
