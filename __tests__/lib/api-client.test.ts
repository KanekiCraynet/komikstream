/**
 * Tests for src/lib/api-client.ts
 *
 * Covers: fetchWithCache (retry, 429, errors), ensureArray,
 * all public API functions, and all transformers.
 *
 * API provider: sankavollerei.com
 */

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

// ==================== Tests ====================

describe("api-client", () => {
  let api: typeof import("@/lib/api-client");

  beforeEach(async () => {
    api = await import("@/lib/api-client");
  });

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

      const result = await api.getAnimeLatest();

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
      const result = await api.getAnimeLatest();
      expect(result).toEqual([]);
    });

    it("returns empty array when data is null", async () => {
      fetchMock.mockReturnValueOnce(okJson({ status: "success", data: null }));
      const result = await api.getAnimeLatest();
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

      const result = await api.getAnimeRecommended(1);
      expect(fetchMock).toHaveBeenCalledWith(`${BASE_URL}/anime/home`, expect.anything());
      expect(result).toHaveLength(2);
      expect(result[0].urlId).toBe("a1");
      expect(result[1].urlId).toBe("a2");
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
      const result = await api.getAnimeMovie();
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

      const result = await api.getAnimeDetail("detail-1");

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
      const result = await api.getAnimeDetail("nonexistent");
      expect(result).toBeNull();
    });

    it("returns null when data is undefined", async () => {
      fetchMock.mockReturnValueOnce(okJson({ status: "success" }));
      const result = await api.getAnimeDetail("nonexistent");
      expect(result).toBeNull();
    });
  });

  // ---- searchAnime ----
  describe("searchAnime", () => {
    it("uses path-based search URL and encodes query", async () => {
      fetchMock.mockReturnValueOnce(okJson({ status: "success", data: { animeList: [] } }));
      await api.searchAnime("test query&special=chars");
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

      const result = await api.searchAnime("naruto");
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
      const result = await api.getAnimeVideo("ep-1", "720p");
      expect(fetchMock).toHaveBeenCalledWith("/api/anime/video?episodeId=ep-1&quality=720p");
      expect(result).toEqual({
        url: "https://embed.url/player",
        type: "embed",
        availableResolutions: ["360p", "480p", "720p"],
      });
    });

    it("returns null url on fetch error", async () => {
      fetchMock.mockRejectedValueOnce(new Error("Network error"));
      const result = await api.getAnimeVideo("ep-1");
      expect(result.url).toBeNull();
    });

    it("returns null url on non-ok response", async () => {
      fetchMock.mockReturnValueOnce(Promise.resolve({ ok: false, status: 500 }));
      const result = await api.getAnimeVideo("ep-1");
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
      await api.getAnimeVideo("ep-1");
      expect(fetchMock).toHaveBeenCalledWith("/api/anime/video?episodeId=ep-1&quality=480p");
    });
  });

  // ---- getKomikLatest ----
  describe("getKomikLatest", () => {
    it("calls /comic/terbaru (ignores type param)", async () => {
      fetchMock.mockReturnValueOnce(okJson({ comics: [] }));
      await api.getKomikLatest("project");
      expect(fetchMock).toHaveBeenCalledWith(`${BASE_URL}/comic/terbaru`, expect.anything());
    });

    it("transforms comic list items correctly", async () => {
      const raw = {
        comics: [
          {
            title: "Test Komik",
            link: "/manga/test-komik/",
            image: "thumb.jpg",
            chapter: "Chapter 10",
            time_ago: "5 menit lalu",
          },
        ],
      };
      fetchMock.mockReturnValueOnce(okJson(raw));

      const result = await api.getKomikLatest("mirror");
      expect(result).toHaveLength(1);
      expect(result[0].manga_id).toBe("test-komik");
      expect(result[0].title).toBe("Test Komik");
      expect(result[0].thumbnail).toBe("thumb.jpg");
      expect(result[0].latestChapter).toBe("Chapter 10");
      expect(result[0].updatedAt).toBe("5 menit lalu");
    });

    it("extracts slug from link correctly", async () => {
      fetchMock.mockReturnValueOnce(
        okJson({
          comics: [{ title: "K", link: "/manga/my-manga-slug/" }],
        })
      );
      const result = await api.getKomikLatest();
      expect(result[0].manga_id).toBe("my-manga-slug");
    });
  });

  // ---- getKomikPopular ----
  describe("getKomikPopular", () => {
    it("calls correct URL with page param", async () => {
      fetchMock.mockReturnValueOnce(okJson({ comics: [] }));
      await api.getKomikPopular(2);
      expect(fetchMock).toHaveBeenCalledWith(`${BASE_URL}/comic/populer?page=2`, expect.anything());
    });

    it("omits page param for page 1", async () => {
      fetchMock.mockReturnValueOnce(okJson({ comics: [] }));
      await api.getKomikPopular(1);
      expect(fetchMock).toHaveBeenCalledWith(`${BASE_URL}/comic/populer`, expect.anything());
    });
  });

  // ---- getKomikRecommended ----
  describe("getKomikRecommended", () => {
    it("calls /comic/recommendations (ignores type param)", async () => {
      fetchMock.mockReturnValueOnce(okJson({ comics: [] }));
      await api.getKomikRecommended("manhua");
      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE_URL}/comic/recommendations`,
        expect.anything()
      );
    });
  });

  // ---- getKomikDetail ----
  describe("getKomikDetail", () => {
    it("returns transformed komik detail", async () => {
      const raw = {
        slug: "detail-k",
        title: "Detail Komik",
        image: "cover.jpg",
        synopsis: "Short",
        synopsis_full: "Full synopsis text",
        metadata: {
          type: "Manhwa",
          author: "Author Name",
          status: "Ongoing",
        },
        genres: [{ name: "Action", slug: "action" }],
        chapters: [
          { chapter: "Chapter 2", slug: "detail-k-chapter-2", date: "02/01/2026" },
          { chapter: "Chapter 1", slug: "detail-k-chapter-1", date: "01/01/2026" },
        ],
      };
      fetchMock.mockReturnValueOnce(okJson(raw));

      const result = await api.getKomikDetail("detail-k");
      expect(result).not.toBeNull();
      expect(result!.manga_id).toBe("detail-k");
      expect(result!.title).toBe("Detail Komik");
      expect(result!.thumbnail).toBe("cover.jpg");
      expect(result!.description).toBe("Full synopsis text");
      expect(result!.type).toBe("Manhwa");
      expect(result!.author).toBe("Author Name");
      expect(result!.status).toBe("Ongoing");
      expect(result!.genres).toEqual(["Action"]);
      // Chapters sorted ascending
      expect(result!.chapters).toHaveLength(2);
      expect(result!.chapters![0].chapter_id).toBe("detail-k-chapter-1");
      expect(result!.chapters![1].chapter_id).toBe("detail-k-chapter-2");
    });

    it("returns null when title is missing", async () => {
      fetchMock.mockReturnValueOnce(okJson({ slug: "missing" }));
      const result = await api.getKomikDetail("missing");
      expect(result).toBeNull();
    });

    it("skips author when it is '-'", async () => {
      fetchMock.mockReturnValueOnce(
        okJson({
          slug: "k1",
          title: "K",
          metadata: { author: "-" },
        })
      );
      const result = await api.getKomikDetail("k1");
      expect(result!.author).toBeUndefined();
    });
  });

  // ---- getKomikChapterList ----
  describe("getKomikChapterList", () => {
    it("extracts chapters from detail response", async () => {
      fetchMock.mockReturnValueOnce(
        okJson({
          slug: "manga-1",
          title: "Manga 1",
          chapters: [
            { chapter: "Chapter 2", slug: "manga-1-chapter-2", date: "02/01/2026" },
            { chapter: "Chapter 1", slug: "manga-1-chapter-1", date: "01/01/2026" },
          ],
        })
      );

      const result = await api.getKomikChapterList("manga-1");
      expect(result).toHaveLength(2);
      // Sorted ascending
      expect(result[0].chapter_id).toBe("manga-1-chapter-1");
      expect(result[0].chapter).toBe(1);
      expect(result[1].chapter_id).toBe("manga-1-chapter-2");
      expect(result[1].chapter).toBe(2);
    });

    it("returns empty array on fetch failure", async () => {
      fetchMock
        .mockRejectedValueOnce(new Error("Network error"))
        .mockRejectedValueOnce(new Error("Network error"));
      const result = await api.getKomikChapterList("manga-fail");
      expect(result).toEqual([]);
    }, 15000);
  });

  // ---- searchKomik ----
  describe("searchKomik", () => {
    it("uses query param search URL", async () => {
      fetchMock.mockReturnValueOnce(okJson({ data: [] }));
      await api.searchKomik("one piece");
      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE_URL}/comic/search?q=one%20piece`,
        expect.anything()
      );
    });

    it("transforms search results", async () => {
      fetchMock.mockReturnValueOnce(
        okJson({
          data: [
            {
              title: "Naruto",
              slug: "naruto",
              thumbnail: "naruto.jpg",
              type: "Manga",
              genre: "Action",
            },
          ],
        })
      );

      const result = await api.searchKomik("naruto");
      expect(result).toHaveLength(1);
      expect(result[0].manga_id).toBe("naruto");
      expect(result[0].type).toBe("Manga");
      expect(result[0].genres).toEqual(["Action"]);
    });
  });

  // ---- getKomikImages ----
  describe("getKomikImages", () => {
    it("returns image objects with page numbers", async () => {
      fetchMock.mockReturnValueOnce(
        okJson({
          images: ["img1.webp", "img2.webp", "img3.webp"],
        })
      );
      const result = await api.getKomikImages("ch-1");
      expect(result).toEqual([
        { url: "img1.webp", page: 1 },
        { url: "img2.webp", page: 2 },
        { url: "img3.webp", page: 3 },
      ]);
    });

    it("returns empty array when images field is missing", async () => {
      fetchMock.mockReturnValueOnce(okJson({}));
      const result = await api.getKomikImages("ch-missing");
      expect(result).toEqual([]);
    });
  });

  // ---- getHomepageData ----
  describe("getHomepageData", () => {
    it("aggregates all homepage data", async () => {
      fetchMock
        .mockReturnValueOnce(okJson({ comics: [{ title: "K1", link: "/manga/k1/" }] }))
        .mockReturnValueOnce(okJson({ comics: [{ title: "K2", link: "/manga/k2/" }] }))
        .mockReturnValueOnce(
          okJson({
            status: "success",
            data: { animeList: [{ animeId: "a1", title: "Anime 1" }] },
          })
        )
        .mockReturnValueOnce(
          okJson({
            status: "success",
            data: {
              ongoing: { animeList: [{ animeId: "a2", title: "Anime 2" }] },
              completed: { animeList: [] },
            },
          })
        );

      const result = await api.getHomepageData();

      expect(result.komikLatest).toHaveLength(1);
      expect(result.komikPopular).toHaveLength(1);
      expect(result.animeLatest).toHaveLength(1);
      expect(result.animeRecommended).toHaveLength(1);
    });

    it("returns empty arrays when individual fetches fail", async () => {
      for (let i = 0; i < 12; i++) {
        fetchMock.mockRejectedValueOnce(new Error("fail"));
      }

      const result = await api.getHomepageData();

      expect(result.komikLatest).toEqual([]);
      expect(result.komikPopular).toEqual([]);
      expect(result.animeLatest).toEqual([]);
      expect(result.animeRecommended).toEqual([]);
    }, 30000);
  });

  // ---- fetchWithCache: retry & error handling ----
  describe("fetchWithCache retry logic", () => {
    it("throws on non-ok response after retries", async () => {
      fetchMock
        .mockReturnValueOnce(errorResponse(500))
        .mockReturnValueOnce(errorResponse(500))
        .mockReturnValueOnce(errorResponse(500));

      await expect(api.getAnimeLatest()).rejects.toThrow("API Error: 500");
    }, 15000);

    it("retries on network error and succeeds", async () => {
      fetchMock.mockRejectedValueOnce(new Error("Network error")).mockReturnValueOnce(
        okJson({
          status: "success",
          data: { animeList: [{ animeId: "a1", title: "Recovered" }] },
        })
      );

      const result = await api.getAnimeLatest();
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

      await expect(api.getAnimeLatest()).rejects.toThrow("API rate limited (429)");
    }, 30000);
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

      const result = await api.getAnimeEpisode("ep-1");
      expect(result).not.toBeNull();
      expect(result!.defaultStreamingUrl).toBe("https://default.url/stream");
      expect(result!.server!.qualities).toHaveLength(1);
      expect(result!.server!.qualities![0].serverList![0].serverId).toBe("srv-1");
    });

    it("returns null when data is missing", async () => {
      fetchMock.mockReturnValueOnce(okJson({ status: "success" }));
      const result = await api.getAnimeEpisode("missing");
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

      const result = await api.getAnimeServerUrl("srv-1");
      expect(result).toBe("https://stream.url/embed");
    });

    it("returns null when url is missing", async () => {
      fetchMock.mockReturnValueOnce(okJson({ status: "success", data: {} }));
      const result = await api.getAnimeServerUrl("srv-missing");
      expect(result).toBeNull();
    });
  });
});
