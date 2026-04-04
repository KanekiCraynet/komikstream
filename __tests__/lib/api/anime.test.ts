/**
 * Tests for src/lib/api/anime.ts
 *
 * Covers: getAnimeLatest, getAnimeRecommended, getAnimeMovie, getAnimeDetail,
 * searchAnime, getAnimeVideo, getAnimeEpisode, getAnimeServerUrl, getAnimeSchedule,
 * getAnimeGenres, getAnimeByGenre, getAnimeBatch
 */

import {
  getAnimeLatest,
  getAnimeRecommended,
  getAnimeMovie,
  getAnimeDetail,
  searchAnime,
  getAnimeVideo,
  getAnimeEpisode,
  getAnimeServerUrl,
  getAnimeSchedule,
  getAnimeGenres,
  getAnimeByGenre,
  getAnimeBatch,
} from "@/lib/api/anime";

const BASE_URL = "https://www.sankavollerei.com";

let fetchMock: jest.Mock;

beforeEach(() => {
  fetchMock = jest.fn();
  global.fetch = fetchMock;
});

afterEach(() => {
  jest.restoreAllMocks();
});

/** Shorthand: resolve a successful JSON response */
function okJson(body: unknown) {
  return Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve(body),
  });
}

/** Shorthand: resolve a non-ok response */
function errorResponse(status: number) {
  return Promise.resolve({
    ok: false,
    status,
    json: () => Promise.resolve({}),
  });
}

describe("anime API", () => {
  // ---- getAnimeLatest ----
  describe("getAnimeLatest", () => {
    it("returns transformed anime list on success", async () => {
      const raw = {
        status: "success",
        ok: true,
        data: {
          animeList: [
            {
              title: "Test Anime",
              poster: "thumb.jpg",
              animeId: "test-anime-sub-indo",
              status: "Ongoing",
              genreList: [{ title: "Action", genreId: "action" }],
            },
          ],
        },
      };
      fetchMock.mockReturnValueOnce(okJson(raw));

      const result = await getAnimeLatest();

      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE_URL}/anime/ongoing-anime`,
        expect.objectContaining({
          headers: expect.objectContaining({
            "User-Agent": expect.any(String),
            Referer: expect.stringContaining("sankavollerei.com"),
          }),
        })
      );
      expect(result).toHaveLength(1);
      expect(result[0].urlId).toBe("test-anime-sub-indo");
      expect(result[0].title).toBe("Test Anime");
      expect(result[0].thumbnail).toBe("thumb.jpg");
      expect(result[0].status).toBe("Ongoing");
      expect(result[0].genres).toEqual(["Action"]);
    });

    it("returns empty array when data.animeList is missing", async () => {
      fetchMock.mockReturnValueOnce(okJson({ status: "success", data: {} }));
      const result = await getAnimeLatest();
      expect(result).toEqual([]);
    });

    it("returns empty array when data is null", async () => {
      fetchMock.mockReturnValueOnce(okJson({ status: "success", data: null }));
      const result = await getAnimeLatest();
      expect(result).toEqual([]);
    });
  });

  // ---- getAnimeRecommended ----
  describe("getAnimeRecommended", () => {
    it("calls /anime/home and merges ongoing+completed", async () => {
      const raw = {
        status: "success",
        data: {
          ongoing: {
            animeList: [{ animeId: "a1", title: "Ongoing 1" }],
          },
          completed: {
            animeList: [{ animeId: "a2", title: "Completed 1" }],
          },
        },
      };
      fetchMock.mockReturnValueOnce(okJson(raw));

      const result = await getAnimeRecommended(1);
      expect(fetchMock).toHaveBeenCalledWith(`${BASE_URL}/anime/home`, expect.anything());
      expect(result).toHaveLength(2);
      expect(result[0].urlId).toBe("a1");
      expect(result[1].urlId).toBe("a2");
    });

    it("paginates results (20 items per page)", async () => {
      const animeList = Array.from({ length: 30 }, (_, i) => ({
        animeId: `anime-${i}`,
        title: `Anime ${i}`,
      }));
      const raw = {
        status: "success",
        data: {
          ongoing: { animeList: animeList.slice(0, 15) },
          completed: { animeList: animeList.slice(15) },
        },
      };
      fetchMock.mockReturnValueOnce(okJson(raw));

      const result = await getAnimeRecommended(2);
      expect(result).toHaveLength(10); // 30 - 20 = 10 on page 2
    });
  });

  // ---- getAnimeMovie ----
  describe("getAnimeMovie", () => {
    it("calls /anime/complete-anime as fallback", async () => {
      fetchMock.mockReturnValueOnce(
        okJson({
          status: "success",
          data: { animeList: [{ animeId: "movie-1", title: "Movie Title" }] },
        })
      );
      const result = await getAnimeMovie();
      expect(fetchMock).toHaveBeenCalledWith(`${BASE_URL}/anime/complete-anime`, expect.anything());
      expect(result[0].urlId).toBe("movie-1");
      expect(result[0].title).toBe("Movie Title");
    });
  });

  // ---- getAnimeDetail ----
  describe("getAnimeDetail", () => {
    it("returns transformed detail when data exists", async () => {
      const raw = {
        status: "success",
        data: {
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
        },
      };
      fetchMock.mockReturnValueOnce(okJson(raw));

      const result = await getAnimeDetail("detail-1");

      expect(fetchMock).toHaveBeenCalledWith(`${BASE_URL}/anime/anime/detail-1`, expect.anything());
      expect(result).not.toBeNull();
      expect(result!.urlId).toBe("detail-1");
      expect(result!.title).toBe("Detail Anime");
      expect(result!.cover).toBe("detail.jpg");
      expect(result!.synopsis).toBe("Line 1\n\nLine 2");
      expect(result!.totalEpisodes).toBe(24);
      expect(result!.duration).toBe("23 Min");
      expect(result!.studio).toBe("Studio A");
      expect(result!.genres).toEqual(["Drama"]);
      expect(result!.episodes).toHaveLength(2);
      expect(result!.episodes![0].episodeId).toBe("ep-1");
      expect(result!.episodes![1].episodeId).toBe("ep-2");
    });

    it("returns null when data has no title", async () => {
      fetchMock.mockReturnValueOnce(okJson({ status: "success", data: {} }));
      const result = await getAnimeDetail("nonexistent");
      expect(result).toBeNull();
    });

    it("returns null when data is undefined", async () => {
      fetchMock.mockReturnValueOnce(okJson({ status: "success" }));
      const result = await getAnimeDetail("nonexistent");
      expect(result).toBeNull();
    });
  });

  // ---- searchAnime ----
  describe("searchAnime", () => {
    it("uses path-based search URL and encodes query", async () => {
      fetchMock.mockReturnValueOnce(okJson({ status: "success", data: { animeList: [] } }));
      await searchAnime("test query&special=chars");
      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE_URL}/anime/search/test%20query%26special%3Dchars`,
        expect.anything()
      );
    });

    it("transforms search results with score and genreList", async () => {
      fetchMock.mockReturnValueOnce(
        okJson({
          status: "success",
          data: {
            animeList: [
              {
                title: "Naruto",
                poster: "naruto.jpg",
                status: "Ongoing",
                score: "8.5",
                animeId: "naruto-sub-indo",
                genreList: [{ title: "Action", genreId: "action" }],
              },
            ],
          },
        })
      );

      const result = await searchAnime("naruto");
      expect(result).toHaveLength(1);
      expect(result[0].urlId).toBe("naruto-sub-indo");
      expect(result[0].rating).toBe("8.5");
      expect(result[0].genres).toEqual(["Action"]);
    });
  });

  // ---- getAnimeVideo ----
  describe("getAnimeVideo", () => {
    it("returns video result on success", async () => {
      fetchMock.mockReturnValueOnce(
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              url: "https://embed.url/player",
              type: "embed",
              availableResolutions: ["360p", "480p", "720p"],
            }),
        })
      );
      const result = await getAnimeVideo("ep-1", "720p");
      expect(fetchMock).toHaveBeenCalledWith("/api/anime/video?episodeId=ep-1&quality=720p");
      expect(result).toEqual({
        url: "https://embed.url/player",
        type: "embed",
        availableResolutions: ["360p", "480p", "720p"],
      });
    });

    it("returns null url on fetch error", async () => {
      fetchMock.mockRejectedValueOnce(new Error("Network error"));
      const result = await getAnimeVideo("ep-1");
      expect(result.url).toBeNull();
    });

    it("returns null url on non-ok response", async () => {
      fetchMock.mockReturnValueOnce(Promise.resolve({ ok: false, status: 500 }));
      const result = await getAnimeVideo("ep-1");
      expect(result.url).toBeNull();
    });

    it("defaults quality to 480p", async () => {
      fetchMock.mockReturnValueOnce(
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({ url: "url", type: "embed", availableResolutions: ["480p"] }),
        })
      );
      await getAnimeVideo("ep-1");
      expect(fetchMock).toHaveBeenCalledWith("/api/anime/video?episodeId=ep-1&quality=480p");
    });
  });

  // ---- getAnimeEpisode ----
  describe("getAnimeEpisode", () => {
    it("returns episode data with server list", async () => {
      const raw = {
        status: "success",
        data: {
          title: "Anime Ep 1",
          animeId: "anime-1",
          defaultStreamingUrl: "https://default.url/stream",
          server: {
            qualities: [
              {
                title: "480p",
                serverList: [{ title: "vidhide", serverId: "srv-1", href: "/anime/server/srv-1" }],
              },
            ],
          },
        },
      };
      fetchMock.mockReturnValueOnce(okJson(raw));

      const result = await getAnimeEpisode("ep-1");
      expect(result).not.toBeNull();
      expect(result!.defaultStreamingUrl).toBe("https://default.url/stream");
      expect(result!.server!.qualities).toHaveLength(1);
      expect(result!.server!.qualities![0].serverList![0].serverId).toBe("srv-1");
    });

    it("returns null when data is missing", async () => {
      fetchMock.mockReturnValueOnce(okJson({ status: "success" }));
      const result = await getAnimeEpisode("missing");
      expect(result).toBeNull();
    });
  });

  // ---- getAnimeServerUrl ----
  describe("getAnimeServerUrl", () => {
    it("returns stream URL", async () => {
      fetchMock.mockReturnValueOnce(
        okJson({
          status: "success",
          data: { url: "https://stream.url/embed" },
        })
      );

      const result = await getAnimeServerUrl("srv-1");
      expect(result).toBe("https://stream.url/embed");
    });

    it("returns null when url is missing", async () => {
      fetchMock.mockReturnValueOnce(okJson({ status: "success", data: {} }));
      const result = await getAnimeServerUrl("srv-missing");
      expect(result).toBeNull();
    });
  });

  // ---- getAnimeSchedule ----
  describe("getAnimeSchedule", () => {
    it("returns schedule data by day", async () => {
      fetchMock.mockReturnValueOnce(
        okJson({
          status: "success",
          data: [
            {
              day: "Monday",
              anime_list: [
                { title: "Anime Mon", slug: "anime-mon", url: "/anime/mon", poster: "mon.jpg" },
              ],
            },
            {
              day: "Tuesday",
              anime_list: [],
            },
          ],
        })
      );

      const result = await getAnimeSchedule();
      expect(result).toHaveLength(2);
      expect(result[0].day).toBe("Monday");
      expect(result[0].animeList).toHaveLength(1);
      expect(result[0].animeList[0].title).toBe("Anime Mon");
      expect(result[1].day).toBe("Tuesday");
      expect(result[1].animeList).toHaveLength(0);
    });
  });

  // ---- getAnimeGenres ----
  describe("getAnimeGenres", () => {
    it("returns genre list", async () => {
      fetchMock.mockReturnValueOnce(
        okJson({
          status: "success",
          data: {
            genreList: [
              {
                title: "Action",
                genreId: "action",
                href: "/action",
                otakudesuUrl: "/otaku/action",
              },
              {
                title: "Comedy",
                genreId: "comedy",
                href: "/comedy",
                otakudesuUrl: "/otaku/comedy",
              },
            ],
          },
        })
      );

      const result = await getAnimeGenres();
      expect(result).toHaveLength(2);
      expect(result[0].title).toBe("Action");
      expect(result[0].genreId).toBe("action");
    });
  });

  // ---- getAnimeByGenre ----
  describe("getAnimeByGenre", () => {
    it("returns paginated anime by genre", async () => {
      fetchMock.mockReturnValueOnce(
        okJson({
          status: "success",
          data: { animeList: [{ animeId: "anime-action", title: "Action Anime" }] },
          pagination: { hasNextPage: true, totalPages: 5 },
        })
      );

      const result = await getAnimeByGenre("action", 1);
      expect(fetchMock).toHaveBeenCalledWith(`${BASE_URL}/anime/genre/action`, expect.anything());
      expect(result.items).toHaveLength(1);
      expect(result.hasNextPage).toBe(true);
      expect(result.totalPages).toBe(5);
    });

    it("includes page param for page > 1", async () => {
      fetchMock.mockReturnValueOnce(
        okJson({
          status: "success",
          data: { animeList: [] },
          pagination: { hasNextPage: false, totalPages: 2 },
        })
      );

      await getAnimeByGenre("action", 2);
      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE_URL}/anime/genre/action?page=2`,
        expect.anything()
      );
    });
  });

  // ---- getAnimeBatch ----
  describe("getAnimeBatch", () => {
    it("returns batch download data", async () => {
      fetchMock.mockReturnValueOnce(
        okJson({
          status: "success",
          data: {
            title: "Batch Anime",
            batchList: [
              {
                title: "Episode 1-12",
                qualities: [
                  {
                    title: "480p",
                    urls: [{ title: "Mega", url: "https://mega.nz/file" }],
                  },
                ],
              },
            ],
          },
        })
      );

      const result = await getAnimeBatch("batch-anime");
      expect(result).not.toBeNull();
      expect(result!.title).toBe("Batch Anime");
      expect(result!.batchList).toHaveLength(1);
      expect(result!.batchList[0].qualities[0].resolution).toBe("480p");
      expect(result!.batchList[0].qualities[0].urls[0].host).toBe("Mega");
    });

    it("returns null when data is missing", async () => {
      fetchMock.mockReturnValueOnce(okJson({ status: "success" }));
      const result = await getAnimeBatch("missing");
      expect(result).toBeNull();
    });

    it("returns null on fetch error", async () => {
      fetchMock.mockRejectedValueOnce(new Error("Network error"));
      const result = await getAnimeBatch("error-anime");
      expect(result).toBeNull();
    });
  });

  // ---- Retry logic (via fetchWithCache) ----
  describe("fetchWithCache retry logic", () => {
    it("throws on non-ok response after retries", async () => {
      fetchMock
        .mockReturnValueOnce(errorResponse(500))
        .mockReturnValueOnce(errorResponse(500))
        .mockReturnValueOnce(errorResponse(500));

      await expect(getAnimeLatest()).rejects.toThrow("API Error: 500");
    }, 15000);

    it("retries on network error and succeeds", async () => {
      fetchMock.mockRejectedValueOnce(new Error("Network error")).mockReturnValueOnce(
        okJson({
          status: "success",
          data: { animeList: [{ animeId: "a1", title: "Recovered" }] },
        })
      );

      const result = await getAnimeLatest();
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe("Recovered");
      expect(fetchMock).toHaveBeenCalledTimes(2);
    }, 15000);

    it("throws rate limit error on 429 after retries", async () => {
      const response429 = () =>
        Promise.resolve({
          ok: false,
          status: 429,
          json: () => Promise.resolve({}),
        });

      fetchMock
        .mockReturnValueOnce(response429())
        .mockReturnValueOnce(response429())
        .mockReturnValueOnce(response429());

      await expect(getAnimeLatest()).rejects.toThrow("API rate limited (429)");
    }, 30000);
  });
});
