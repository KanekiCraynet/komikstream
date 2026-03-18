/**
 * Tests for src/lib/api-client.ts
 *
 * Covers: fetchWithCache (retry, 429, errors), ensureArray,
 * all public API functions, and all transformers.
 */

// cache-config is no longer needed in this test — fetchWithCache uses
// plain fetch() without next:{revalidate} to work in Cloudflare Workers.

// ---- helpers ----
const BASE_URL = "https://api.sansekai.my.id/api";

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

// We re-import the module for each test file run, but since module-level
// `BASE_URL` reads env at import time, we import after setting env if needed.
// For default env, just import normally.

// ==================== fetchWithCache via public functions ====================

describe("api-client", () => {
  let api: typeof import("@/lib/api-client");

  beforeEach(async () => {
    // Dynamic import so fetch mock is available
    api = await import("@/lib/api-client");
  });

  // ---- getAnimeLatest ----
  describe("getAnimeLatest", () => {
    it("returns transformed anime list on success", async () => {
      const raw = [
        {
          urlId: "anime-1",
          title: "Test Anime",
          thumbnail: "thumb.jpg",
          synopsis: "Synopsis here",
          rating: "8.5",
          type: "TV",
          status: "Ongoing",
          genres: ["Action"],
          episodes: [{ title: "Ep 1", url: "/ep1", date: "2025-01-01" }],
        },
      ];
      fetchMock.mockReturnValueOnce(okJson(raw));

      const result = await api.getAnimeLatest();

      // fetchWithCache now uses plain fetch() without next:{revalidate}
      // — the option was removed because it caused failures in CF Workers.
      // Verify only that the correct URL was called.
      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE_URL}/anime/latest`,
        expect.objectContaining({
          headers: { Accept: "application/json" },
        })
      );
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        urlId: "anime-1",
        title: "Test Anime",
        thumbnail: "thumb.jpg",
        synopsis: "Synopsis here",
        rating: "8.5",
        type: "TV",
        status: "Ongoing",
        genres: ["Action"],
        episodes: [{ title: "Ep 1", url: "/ep1", date: "2025-01-01" }],
      });
    });

    it("returns empty array when API returns null", async () => {
      fetchMock.mockReturnValueOnce(okJson(null));
      const result = await api.getAnimeLatest();
      expect(result).toEqual([]);
    });

    it("returns empty array when API returns non-array", async () => {
      fetchMock.mockReturnValueOnce(okJson({ something: true }));
      const result = await api.getAnimeLatest();
      expect(result).toEqual([]);
    });
  });

  // ---- getAnimeRecommended ----
  describe("getAnimeRecommended", () => {
    it("calls correct URL with page param", async () => {
      fetchMock.mockReturnValueOnce(okJson([]));
      await api.getAnimeRecommended(3);
      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE_URL}/anime/recommended?page=3`,
        expect.anything()
      );
    });

    it("defaults to page 1", async () => {
      fetchMock.mockReturnValueOnce(okJson([]));
      await api.getAnimeRecommended();
      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE_URL}/anime/recommended?page=1`,
        expect.anything()
      );
    });
  });

  // ---- getAnimeMovie ----
  describe("getAnimeMovie", () => {
    it("calls correct URL and transforms response", async () => {
      fetchMock.mockReturnValueOnce(okJson([{ url_id: "movie-1", judul: "Movie Title" }]));
      const result = await api.getAnimeMovie();
      expect(fetchMock).toHaveBeenCalledWith(`${BASE_URL}/anime/movie`, expect.anything());
      expect(result[0].urlId).toBe("movie-1");
      expect(result[0].title).toBe("Movie Title");
    });
  });

  // ---- getAnimeDetail ----
  describe("getAnimeDetail", () => {
    it("returns transformed detail when data exists", async () => {
      const raw = {
        data: [
          {
            urlId: "detail-1",
            title: "Detail Anime",
            thumbnail: "detail.jpg",
            cover: "cover.jpg",
            synopsis: "Long synopsis",
            rating: 9,
            type: "TV",
            status: "Completed",
            genres: ["Drama"],
            episodes: [],
            total_episodes: 24,
          },
        ],
      };
      fetchMock.mockReturnValueOnce(okJson(raw));

      const result = await api.getAnimeDetail("detail-1");

      expect(result).not.toBeNull();
      expect(result!.urlId).toBe("detail-1");
      expect(result!.cover).toBe("cover.jpg");
      expect(result!.totalEpisodes).toBe(24);
    });

    it("returns null when data is empty", async () => {
      fetchMock.mockReturnValueOnce(okJson({ data: [] }));
      const result = await api.getAnimeDetail("nonexistent");
      expect(result).toBeNull();
    });

    it("returns null when data field is undefined", async () => {
      fetchMock.mockReturnValueOnce(okJson({}));
      const result = await api.getAnimeDetail("nonexistent");
      expect(result).toBeNull();
    });
  });

  // ---- searchAnime ----
  describe("searchAnime", () => {
    it("encodes query parameter", async () => {
      fetchMock.mockReturnValueOnce(okJson([]));
      await api.searchAnime("test query&special=chars");
      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE_URL}/anime/search?query=test%20query%26special%3Dchars`,
        expect.anything()
      );
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
              url: "https://video.url/stream.mp4",
              type: "direct",
              availableResolutions: ["360p", "480p", "720p"],
            }),
        })
      );
      const result = await api.getAnimeVideo("ep-1", "720p");
      expect(fetchMock).toHaveBeenCalledWith("/api/anime/video?chapterUrlId=ep-1&reso=720p");
      expect(result).toEqual({
        url: "https://video.url/stream.mp4",
        type: "direct",
        availableResolutions: ["360p", "480p", "720p"],
      });
    });

    it("returns null url when url field is missing", async () => {
      fetchMock.mockReturnValueOnce(
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        })
      );
      const result = await api.getAnimeVideo("ep-1");
      expect(result.url).toBeNull();
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

    it("defaults resolution to 480p", async () => {
      fetchMock.mockReturnValueOnce(
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({ url: "url", type: "direct", availableResolutions: ["480p"] }),
        })
      );
      await api.getAnimeVideo("ep-1");
      expect(fetchMock).toHaveBeenCalledWith("/api/anime/video?chapterUrlId=ep-1&reso=480p");
    });
  });

  // ---- getKomikLatest ----
  describe("getKomikLatest", () => {
    it("calls correct URL with type param", async () => {
      fetchMock.mockReturnValueOnce(okJson({ data: [] }));
      await api.getKomikLatest("project");
      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE_URL}/komik/latest?type=project`,
        expect.anything()
      );
    });

    it("transforms komik data correctly", async () => {
      const raw = {
        data: [
          {
            manga_id: "komik-1",
            title: "Test Komik",
            thumbnail: "thumb.jpg",
            type: "manhwa",
            status: 1,
            rating: "8.0",
            description: "Desc",
            author: "Author",
            artist: "Artist",
            genres: ["Action", "Fantasy"],
            chapters: [{ chapter_id: "ch-1", title: "Chapter 1", chapter: 1, date: "2025-01-01" }],
            latest_chapter: "Ch 10",
            updated_at: "2025-01-15",
          },
        ],
      };
      fetchMock.mockReturnValueOnce(okJson(raw));

      const result = await api.getKomikLatest("mirror");
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        manga_id: "komik-1",
        title: "Test Komik",
        thumbnail: "thumb.jpg",
        cover: "thumb.jpg",
        type: "manhwa",
        status: "Ongoing",
        rating: "8.0",
        description: "Desc",
        author: "Author",
        artist: "Artist",
        genres: ["Action", "Fantasy"],
        chapters: [{ chapter_id: "ch-1", title: "Chapter 1", chapter: 1, date: "2025-01-01" }],
        latestChapter: "Ch 10",
        updatedAt: "2025-01-15",
      });
    });
  });

  // ---- Komik status transformation ----
  describe("komik status transformation", () => {
    it("maps numeric status 1 to Ongoing", async () => {
      fetchMock.mockReturnValueOnce(okJson({ data: [{ manga_id: "k1", status: 1 }] }));
      const result = await api.getKomikLatest("mirror");
      expect(result[0].status).toBe("Ongoing");
    });

    it("maps numeric status 0 to Completed", async () => {
      fetchMock.mockReturnValueOnce(okJson({ data: [{ manga_id: "k1", status: 0 }] }));
      const result = await api.getKomikLatest("mirror");
      expect(result[0].status).toBe("Completed");
    });

    it("passes through string status unchanged", async () => {
      fetchMock.mockReturnValueOnce(okJson({ data: [{ manga_id: "k1", status: "Hiatus" }] }));
      const result = await api.getKomikLatest("mirror");
      expect(result[0].status).toBe("Hiatus");
    });
  });

  // ---- Komik taxonomy fallback ----
  describe("komik taxonomy fallback", () => {
    it("extracts genres from taxonomy when genres array is missing", async () => {
      fetchMock.mockReturnValueOnce(
        okJson({
          data: [
            {
              manga_id: "k-tax",
              taxonomy: { Genre: [{ name: "Romance" }, { name: "Comedy" }] },
            },
          ],
        })
      );
      const result = await api.getKomikLatest("mirror");
      expect(result[0].genres).toEqual(["Romance", "Comedy"]);
    });

    it("extracts author/artist from taxonomy", async () => {
      fetchMock.mockReturnValueOnce(
        okJson({
          data: [
            {
              manga_id: "k-tax2",
              taxonomy: {
                Author: [{ name: "Tax Author" }],
                Artist: [{ name: "Tax Artist" }],
              },
            },
          ],
        })
      );
      const result = await api.getKomikLatest("mirror");
      expect(result[0].author).toBe("Tax Author");
      expect(result[0].artist).toBe("Tax Artist");
    });
  });

  // ---- getKomikPopular ----
  describe("getKomikPopular", () => {
    it("calls correct URL", async () => {
      fetchMock.mockReturnValueOnce(okJson({ data: [] }));
      await api.getKomikPopular(2);
      expect(fetchMock).toHaveBeenCalledWith(`${BASE_URL}/komik/popular?page=2`, expect.anything());
    });
  });

  // ---- getKomikRecommended ----
  describe("getKomikRecommended", () => {
    it("calls correct URL with type", async () => {
      fetchMock.mockReturnValueOnce(okJson({ data: [] }));
      await api.getKomikRecommended("manhua");
      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE_URL}/komik/recommended?type=manhua`,
        expect.anything()
      );
    });
  });

  // ---- getKomikDetail ----
  describe("getKomikDetail", () => {
    it("returns transformed komik detail", async () => {
      fetchMock.mockReturnValueOnce(
        okJson({ data: { manga_id: "detail-k", title: "Detail Komik" } })
      );
      const result = await api.getKomikDetail("detail-k");
      expect(result).not.toBeNull();
      expect(result!.manga_id).toBe("detail-k");
      expect(result!.title).toBe("Detail Komik");
    });

    it("returns null when data is undefined", async () => {
      fetchMock.mockReturnValueOnce(okJson({}));
      const result = await api.getKomikDetail("missing");
      expect(result).toBeNull();
    });
  });

  // ---- getKomikChapterList ----
  describe("getKomikChapterList", () => {
    it("transforms chapter list", async () => {
      fetchMock.mockReturnValueOnce(
        okJson({
          data: [
            { chapter_id: "ch-1", title: "Chapter 1", chapter: 1, date: "2025-01-01" },
            { id: "ch-2", chapter_number: 2, created_at: "2025-01-02" },
          ],
        })
      );
      const result = await api.getKomikChapterList("manga-1");
      expect(result).toHaveLength(2);
      expect(result[0].chapter_id).toBe("ch-1");
      expect(result[1].chapter_id).toBe("ch-2");
      expect(result[1].title).toBe("Chapter 2");
      expect(result[1].chapter).toBe(2);
      expect(result[1].date).toBe("2025-01-02");
    });

    it("handles missing chapter/chapter_number with fallback 0", async () => {
      fetchMock.mockReturnValueOnce(okJson({ data: [{ chapter_id: "ch-x" }] }));
      const result = await api.getKomikChapterList("manga-1");
      expect(result[0].chapter).toBe(0);
    });

    it("returns empty array instead of throwing on fetch failure", async () => {
      // Both attempts fail (retries = 1 → 2 total)
      fetchMock
        .mockRejectedValueOnce(new Error("Network error"))
        .mockRejectedValueOnce(new Error("Network error"));
      const result = await api.getKomikChapterList("manga-fail");
      expect(result).toEqual([]);
    }, 15000);
  });

  // ---- searchKomik ----
  describe("searchKomik", () => {
    it("encodes query", async () => {
      fetchMock.mockReturnValueOnce(okJson({ data: [] }));
      await api.searchKomik("one piece");
      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE_URL}/komik/search?query=one%20piece`,
        expect.anything()
      );
    });
  });

  // ---- getKomikImages ----
  describe("getKomikImages", () => {
    it("returns image objects with page numbers", async () => {
      fetchMock.mockReturnValueOnce(
        okJson({
          data: {
            chapter: {
              data: ["img1.jpg", "img2.jpg", "img3.jpg"],
            },
          },
        })
      );
      const result = await api.getKomikImages("ch-1");
      expect(result).toEqual([
        { url: "img1.jpg", page: 1 },
        { url: "img2.jpg", page: 2 },
        { url: "img3.jpg", page: 3 },
      ]);
    });

    it("returns empty array when data structure is missing", async () => {
      fetchMock.mockReturnValueOnce(okJson({}));
      const result = await api.getKomikImages("ch-missing");
      expect(result).toEqual([]);
    });
  });

  // ---- getHomepageData ----
  describe("getHomepageData", () => {
    it("aggregates all homepage data", async () => {
      // 4 parallel fetches
      fetchMock
        .mockReturnValueOnce(okJson({ data: [{ manga_id: "k1", title: "Komik 1" }] })) // komikLatest
        .mockReturnValueOnce(okJson({ data: [{ manga_id: "k2", title: "Komik 2" }] })) // komikPopular
        .mockReturnValueOnce(okJson([{ urlId: "a1", title: "Anime 1" }])) // animeLatest
        .mockReturnValueOnce(okJson([{ urlId: "a2", title: "Anime 2" }])); // animeRecommended

      const result = await api.getHomepageData();

      expect(result.komikLatest).toHaveLength(1);
      expect(result.komikPopular).toHaveLength(1);
      expect(result.animeLatest).toHaveLength(1);
      expect(result.animeRecommended).toHaveLength(1);
    });

    it("returns empty arrays when individual fetches fail", async () => {
      // getHomepageData catches errors via .catch(() => []), but each failed fetch
      // goes through retry logic with delays, so we need enough mock responses
      // for all retries (3 attempts per function × 4 functions = 12 fetch calls).
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
  // These tests involve real setTimeout delays due to retry backoff, so they need longer timeouts.
  describe("fetchWithCache retry logic", () => {
    it("throws on non-ok response after retries", async () => {
      fetchMock
        .mockReturnValueOnce(errorResponse(500))
        .mockReturnValueOnce(errorResponse(500))
        .mockReturnValueOnce(errorResponse(500));

      await expect(api.getAnimeLatest()).rejects.toThrow("API Error: 500");
    }, 15000);

    it("retries on network error and succeeds", async () => {
      fetchMock
        .mockRejectedValueOnce(new Error("Network error"))
        .mockReturnValueOnce(okJson([{ urlId: "a1", title: "Recovered" }]));

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

  // ---- Transformer: alternate field names ----
  describe("anime transformer alternate fields", () => {
    it("uses fallback fields: url_id, judul, image, sinopsis, genre, chapter", async () => {
      fetchMock.mockReturnValueOnce(
        okJson([
          {
            url_id: "alt-id",
            judul: "Alt Title",
            image: "alt-img.jpg",
            sinopsis: "Alt synopsis",
            genre: ["Sci-Fi"],
            chapter: [{ ch: "Ep 1", url: "/alt-ep1" }],
          },
        ])
      );

      const result = await api.getAnimeLatest();
      expect(result[0].urlId).toBe("alt-id");
      expect(result[0].title).toBe("Alt Title");
      expect(result[0].thumbnail).toBe("alt-img.jpg");
      expect(result[0].synopsis).toBe("Alt synopsis");
      expect(result[0].genres).toEqual(["Sci-Fi"]);
      expect(result[0].episodes![0].title).toBe("Ep 1");
    });

    it("uses url as last fallback for urlId", async () => {
      fetchMock.mockReturnValueOnce(okJson([{ url: "url-fallback" }]));
      const result = await api.getAnimeLatest();
      expect(result[0].urlId).toBe("url-fallback");
    });
  });

  describe("komik transformer alternate fields", () => {
    it("uses cover_image_url, user_rate, latestChapter, updatedAt", async () => {
      fetchMock.mockReturnValueOnce(
        okJson({
          data: [
            {
              manga_id: "alt-k",
              cover_image_url: "alt-cover.jpg",
              user_rate: 7.5,
              synopsis: "Alt desc",
              latestChapter: "Ch 5",
              updatedAt: "2025-02-01",
            },
          ],
        })
      );

      const result = await api.getKomikLatest("mirror");
      expect(result[0].thumbnail).toBe("alt-cover.jpg");
      expect(result[0].rating).toBe(7.5);
      expect(result[0].description).toBe("Alt desc");
      expect(result[0].latestChapter).toBe("Ch 5");
      expect(result[0].updatedAt).toBe("2025-02-01");
    });

    it("uses chapter id fallback from 'id' field", async () => {
      fetchMock.mockReturnValueOnce(
        okJson({
          data: [
            {
              manga_id: "k-ch",
              chapters: [{ id: "fallback-id", chapter_number: 3, created_at: "2025-03-01" }],
            },
          ],
        })
      );

      const result = await api.getKomikLatest("mirror");
      expect(result[0].chapters![0].chapter_id).toBe("fallback-id");
      expect(result[0].chapters![0].chapter).toBe(3);
      expect(result[0].chapters![0].date).toBe("2025-03-01");
    });
  });

  // ---- Anime detail transformer extras ----
  describe("anime detail transformer", () => {
    it("includes cover and totalEpisodes fields", async () => {
      fetchMock.mockReturnValueOnce(
        okJson({
          data: [
            {
              urlId: "det-1",
              title: "Detailed",
              cover: "cover.jpg",
              totalEpisodes: 12,
              episodes: [],
            },
          ],
        })
      );

      const result = await api.getAnimeDetail("det-1");
      expect(result!.cover).toBe("cover.jpg");
      expect(result!.totalEpisodes).toBe(12);
    });

    it("falls back cover to thumbnail then image", async () => {
      fetchMock.mockReturnValueOnce(
        okJson({
          data: [{ urlId: "det-2", thumbnail: "thumb.jpg" }],
        })
      );

      const result = await api.getAnimeDetail("det-2");
      expect(result!.cover).toBe("thumb.jpg");
    });
  });
});
