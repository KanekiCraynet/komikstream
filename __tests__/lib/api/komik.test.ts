/**
 * Tests for src/lib/api/komik.ts
 *
 * Covers: getKomikLatest, getKomikPopular, getKomikRecommended, getKomikDetail,
 * getKomikChapterList, searchKomik, advancedSearchKomik, getKomikByGenre,
 * getKomikImages, getKomikChapterData, getKomikBerwarna, getKomikPustaka,
 * getKomikUnlimited, getKomikRealtime, getKomikScroll
 */

import {
  getKomikLatest,
  getKomikPopular,
  getKomikRecommended,
  getKomikDetail,
  getKomikChapterList,
  searchKomik,
  advancedSearchKomik,
  getKomikByGenre,
  getKomikImages,
  getKomikChapterData,
  getKomikBerwarna,
  getKomikPustaka,
  getKomikScroll,
} from "@/lib/api/komik";

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

describe("komik API", () => {
  // ---- getKomikLatest ----
  describe("getKomikLatest", () => {
    it("calls /comic/terbaru (ignores type param)", async () => {
      fetchMock.mockReturnValueOnce(okJson({ comics: [] }));
      await getKomikLatest("project");
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

      const result = await getKomikLatest("mirror");
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
      const result = await getKomikLatest();
      expect(result[0].manga_id).toBe("my-manga-slug");
    });
  });

  // ---- getKomikPopular ----
  describe("getKomikPopular", () => {
    it("calls correct URL with page param", async () => {
      fetchMock.mockReturnValueOnce(okJson({ comics: [] }));
      await getKomikPopular(2);
      expect(fetchMock).toHaveBeenCalledWith(`${BASE_URL}/comic/populer?page=2`, expect.anything());
    });

    it("omits page param for page 1", async () => {
      fetchMock.mockReturnValueOnce(okJson({ comics: [] }));
      await getKomikPopular(1);
      expect(fetchMock).toHaveBeenCalledWith(`${BASE_URL}/comic/populer`, expect.anything());
    });
  });

  // ---- getKomikRecommended ----
  describe("getKomikRecommended", () => {
    it("calls /comic/recommendations (ignores type param)", async () => {
      fetchMock.mockReturnValueOnce(okJson({ recommendations: [] }));
      await getKomikRecommended("manhua");
      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE_URL}/comic/recommendations`,
        expect.anything()
      );
    });

    it("transforms recommendation list correctly", async () => {
      fetchMock.mockReturnValueOnce(
        okJson({
          recommendations: [{ title: "Rec Komik", link: "/manga/rec-komik/", image: "rec.jpg" }],
        })
      );

      const result = await getKomikRecommended();
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe("Rec Komik");
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

      const result = await getKomikDetail("detail-k");
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
      const result = await getKomikDetail("missing");
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
      const result = await getKomikDetail("k1");
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

      const result = await getKomikChapterList("manga-1");
      expect(result).toHaveLength(2);
      // Sorted ascending
      expect(result[0].chapter_id).toBe("manga-1-chapter-1");
      expect(result[0].chapter).toBe(1);
      expect(result[1].chapter_id).toBe("manga-1-chapter-2");
      expect(result[1].chapter).toBe(2);
    });

    it("returns empty array on fetch failure", async () => {
      fetchMock.mockRejectedValueOnce(new Error("Network error"));
      const result = await getKomikChapterList("manga-fail");
      expect(result).toEqual([]);
    });
  });

  // ---- searchKomik ----
  describe("searchKomik", () => {
    it("uses query param search URL", async () => {
      fetchMock.mockReturnValueOnce(okJson({ data: [] }));
      await searchKomik("one piece");
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

      const result = await searchKomik("naruto");
      expect(result).toHaveLength(1);
      expect(result[0].manga_id).toBe("naruto");
      expect(result[0].type).toBe("Manga");
      expect(result[0].genres).toEqual(["Action"]);
    });
  });

  // ---- advancedSearchKomik ----
  describe("advancedSearchKomik", () => {
    it("builds query string with all params", async () => {
      fetchMock.mockReturnValueOnce(okJson({ data: [], pagination: {} }));
      await advancedSearchKomik({
        q: "test",
        type: "manhwa",
        status: "ongoing",
        genre: "action",
        year: "2026",
        sort: "popularity",
        page: 2,
        limit: 30,
      });

      const url = fetchMock.mock.calls[0][0];
      expect(url).toContain("q=test");
      expect(url).toContain("type=manhwa");
      expect(url).toContain("status=ongoing");
      expect(url).toContain("genre=action");
      expect(url).toContain("year=2026");
      expect(url).toContain("sort=popularity");
      expect(url).toContain("page=2");
      expect(url).toContain("limit=30");
    });

    it("skips 'all' values for filters", async () => {
      fetchMock.mockReturnValueOnce(okJson({ data: [], pagination: {} }));
      await advancedSearchKomik({
        q: "test",
        type: "all",
        status: "all",
        genre: "all",
        year: "all",
        sort: "relevance",
      });

      const url = fetchMock.mock.calls[0][0];
      expect(url).toContain("q=test");
      expect(url).not.toContain("type=");
      expect(url).not.toContain("status=");
      expect(url).not.toContain("genre=");
      expect(url).not.toContain("year=");
      expect(url).not.toContain("sort=");
    });

    it("returns paginated result", async () => {
      fetchMock.mockReturnValueOnce(
        okJson({
          data: [{ slug: "m1", title: "Manga 1" }],
          pagination: { has_more: true, total: 100, per_page: 20 },
        })
      );

      const result = await advancedSearchKomik({ q: "test" });
      expect(result.items).toHaveLength(1);
      expect(result.hasNextPage).toBe(true);
      expect(result.totalPages).toBe(5);
    });
  });

  // ---- getKomikByGenre ----
  describe("getKomikByGenre", () => {
    it("returns paginated comics by genre", async () => {
      fetchMock.mockReturnValueOnce(
        okJson({
          comics: [{ title: "Action Komik", link: "/manga/action-k/" }],
          pagination: { has_more: true, total: 50, per_page: 20 },
        })
      );

      const result = await getKomikByGenre("action", 1);
      expect(result.items).toHaveLength(1);
      expect(result.hasNextPage).toBe(true);
      expect(result.totalPages).toBe(3);
    });

    it("includes page param for page > 1", async () => {
      fetchMock.mockReturnValueOnce(okJson({ comics: [], pagination: {} }));
      await getKomikByGenre("action", 2);

      const url = fetchMock.mock.calls[0][0];
      expect(url).toContain("page=2");
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
      const result = await getKomikImages("ch-1");
      expect(result).toEqual([
        { url: "img1.webp", page: 1 },
        { url: "img2.webp", page: 2 },
        { url: "img3.webp", page: 3 },
      ]);
    });

    it("returns empty array when images field is missing", async () => {
      fetchMock.mockReturnValueOnce(okJson({}));
      const result = await getKomikImages("ch-missing");
      expect(result).toEqual([]);
    });
  });

  // ---- getKomikChapterData ----
  describe("getKomikChapterData", () => {
    it("returns chapter data with manga info and navigation", async () => {
      fetchMock.mockReturnValueOnce(
        okJson({
          manga_title: "Test Manga",
          chapter_title: "Chapter 5",
          navigation: {
            previousChapter: "test-manga-chapter-4",
            nextChapter: "test-manga-chapter-6",
          },
          images: ["img1.webp", "img2.webp"],
        })
      );

      const result = await getKomikChapterData("test-manga-chapter-5");
      expect(result).not.toBeNull();
      expect(result!.mangaTitle).toBe("Test Manga");
      expect(result!.mangaSlug).toBe("test-manga");
      expect(result!.chapterTitle).toBe("Chapter 5");
      expect(result!.navigation.previousChapter).toBe("test-manga-chapter-4");
      expect(result!.navigation.nextChapter).toBe("test-manga-chapter-6");
      expect(result!.images).toHaveLength(2);
    });

    it("returns null when manga_title is missing", async () => {
      fetchMock.mockReturnValueOnce(okJson({ images: [] }));
      const result = await getKomikChapterData("missing-chapter");
      expect(result).toBeNull();
    });

    it("returns null on fetch error", async () => {
      fetchMock.mockRejectedValueOnce(new Error("Network error"));
      const result = await getKomikChapterData("error-chapter");
      expect(result).toBeNull();
    });
  });

  // ---- getKomikBerwarna ----
  describe("getKomikBerwarna", () => {
    it("calls correct URL for page 1", async () => {
      fetchMock.mockReturnValueOnce(okJson({ data: { results: [] } }));
      await getKomikBerwarna(1);
      expect(fetchMock).toHaveBeenCalledWith(`${BASE_URL}/comic/berwarna`, expect.anything());
    });

    it("calls correct URL for page > 1", async () => {
      fetchMock.mockReturnValueOnce(okJson({ data: { results: [] } }));
      await getKomikBerwarna(2);
      expect(fetchMock).toHaveBeenCalledWith(`${BASE_URL}/comic/berwarna/2`, expect.anything());
    });

    it("transforms catalog items correctly", async () => {
      fetchMock.mockReturnValueOnce(
        okJson({
          data: {
            results: [
              {
                title: "Colored Komik",
                url: "https://komiku.org/manga/colored-slug/",
                thumbnail: "colored.jpg",
                type: "Manhwa",
              },
            ],
          },
        })
      );

      const result = await getKomikBerwarna();
      expect(result).toHaveLength(1);
      expect(result[0].manga_id).toBe("colored-slug");
      expect(result[0].type).toBe("Manhwa");
    });
  });

  // ---- getKomikPustaka ----
  describe("getKomikPustaka", () => {
    it("calls correct URL for page 1", async () => {
      fetchMock.mockReturnValueOnce(okJson({ results: [] }));
      await getKomikPustaka(1);
      expect(fetchMock).toHaveBeenCalledWith(`${BASE_URL}/comic/pustaka`, expect.anything());
    });

    it("calls correct URL for page > 1", async () => {
      fetchMock.mockReturnValueOnce(okJson({ results: [] }));
      await getKomikPustaka(3);
      expect(fetchMock).toHaveBeenCalledWith(`${BASE_URL}/comic/pustaka/3`, expect.anything());
    });
  });

  // ---- getKomikScroll ----
  describe("getKomikScroll", () => {
    it("returns items with nextOffset when has_more is true", async () => {
      fetchMock.mockReturnValueOnce(
        okJson({
          comics: [{ title: "Scroll Komik", link: "/manga/scroll-k/" }],
          has_more: true,
          next_offset: 20,
        })
      );

      const result = await getKomikScroll({ offset: 0, batch_size: 20 });
      expect(result.items).toHaveLength(1);
      expect(result.nextOffset).toBe(20);
    });

    it("returns null nextOffset when has_more is false", async () => {
      fetchMock.mockReturnValueOnce(
        okJson({
          comics: [],
          has_more: false,
        })
      );

      const result = await getKomikScroll({ offset: 100 });
      expect(result.nextOffset).toBeNull();
    });

    it("builds query string with all params", async () => {
      fetchMock.mockReturnValueOnce(okJson({ comics: [], has_more: false }));
      await getKomikScroll({
        offset: 40,
        batch_size: 10,
        seed: "abc123",
        type: "manhwa",
      });

      const url = fetchMock.mock.calls[0][0];
      expect(url).toContain("offset=40");
      expect(url).toContain("batch_size=10");
      expect(url).toContain("seed=abc123");
      expect(url).toContain("type=manhwa");
    });
  });
});
