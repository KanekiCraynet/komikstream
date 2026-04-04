/**
 * Tests for src/lib/api/transformers/komik.ts
 *
 * Covers: extractChapterNumber, extractMangaSlug, extractMangaSlugFromChapter,
 * transformComicListItem, transformComicCatalogItem, transformComicSearchItem,
 * transformComicChapter, transformComicDetail
 */

import {
  extractChapterNumber,
  extractMangaSlug,
  extractMangaSlugFromChapter,
  transformComicListItem,
  transformComicCatalogItem,
  transformComicSearchItem,
  transformComicChapter,
  transformComicDetail,
} from "@/lib/api/transformers/komik";
import type {
  RawComicListItem,
  RawComicCatalogItem,
  RawComicSearchItem,
  RawComicChapterItem,
  RawComicDetailData,
} from "@/lib/api/types";

describe("komik transformers", () => {
  describe("extractChapterNumber", () => {
    it("extracts integer chapter number", () => {
      expect(extractChapterNumber("Chapter 18")).toBe(18);
    });

    it("extracts decimal chapter number", () => {
      expect(extractChapterNumber("Chapter 5.5")).toBe(5.5);
    });

    it("extracts from various formats", () => {
      expect(extractChapterNumber("Ch. 42")).toBe(42);
      expect(extractChapterNumber("chapter-15")).toBe(15);
      expect(extractChapterNumber("100")).toBe(100);
    });

    it("returns 0 for no number found", () => {
      expect(extractChapterNumber("No number")).toBe(0);
      expect(extractChapterNumber("")).toBe(0);
    });
  });

  describe("extractMangaSlug", () => {
    it("extracts slug from /manga/slug/ pattern", () => {
      expect(extractMangaSlug("/manga/my-manga-slug/")).toBe("my-manga-slug");
    });

    it("extracts slug from /manga/slug pattern", () => {
      expect(extractMangaSlug("/manga/my-manga")).toBe("my-manga");
    });

    it("extracts from full URL", () => {
      expect(extractMangaSlug("https://example.com/manga/test-slug/")).toBe("test-slug");
    });

    it("returns empty string for invalid patterns", () => {
      expect(extractMangaSlug("/other/path/")).toBe("");
      expect(extractMangaSlug("")).toBe("");
    });

    it("handles undefined/null input", () => {
      expect(extractMangaSlug(undefined)).toBe("");
      expect(extractMangaSlug(null as unknown as string)).toBe("");
    });
  });

  describe("extractMangaSlugFromChapter", () => {
    it("extracts manga slug from chapter slug", () => {
      expect(extractMangaSlugFromChapter("my-manga-chapter-10", "My Manga")).toBe("my-manga");
    });

    it("handles chapter with decimal", () => {
      expect(extractMangaSlugFromChapter("test-manga-chapter-5", "Test Manga")).toBe("test-manga");
    });

    it("falls back to slugifying manga title if no chapter pattern found", () => {
      expect(extractMangaSlugFromChapter("just-a-slug", "My Manga Title")).toBe("my-manga-title");
    });

    it("handles empty input", () => {
      expect(extractMangaSlugFromChapter("", "Test")).toBe("test");
    });
  });

  describe("transformComicListItem", () => {
    it("transforms a raw comic list item correctly", () => {
      const raw: RawComicListItem = {
        title: "Test Komik",
        link: "/manga/test-komik/",
        image: "thumb.jpg",
        chapter: "Chapter 10",
        time_ago: "5 menit lalu",
      };

      const result = transformComicListItem(raw);

      expect(result.manga_id).toBe("test-komik");
      expect(result.title).toBe("Test Komik");
      expect(result.thumbnail).toBe("thumb.jpg");
      expect(result.latestChapter).toBe("Chapter 10");
      expect(result.updatedAt).toBe("5 menit lalu");
    });

    it("handles missing fields", () => {
      const raw: RawComicListItem = {};

      const result = transformComicListItem(raw);

      expect(result.manga_id).toBe("");
      expect(result.title).toBe("");
      expect(result.thumbnail).toBe("");
    });
  });

  describe("transformComicCatalogItem", () => {
    it("transforms a catalog item correctly", () => {
      const raw: RawComicCatalogItem = {
        title: "Catalog Komik",
        url: "https://komiku.org/manga/catalog-slug/",
        thumbnail: "catalog.jpg",
        type: "Manhwa",
        genre: "Romance",
        description: "A romantic manhwa",
        latestChapter: { title: "Chapter 50" },
      };

      const result = transformComicCatalogItem(raw);

      expect(result.manga_id).toBe("catalog-slug");
      expect(result.title).toBe("Catalog Komik");
      expect(result.thumbnail).toBe("catalog.jpg");
      expect(result.type).toBe("Manhwa");
      expect(result.genres).toEqual(["Romance"]);
      expect(result.description).toBe("A romantic manhwa");
      expect(result.latestChapter).toBe("Chapter 50");
    });

    it("handles missing optional fields", () => {
      const raw: RawComicCatalogItem = {
        url: "https://komiku.org/manga/minimal/",
      };

      const result = transformComicCatalogItem(raw);

      expect(result.manga_id).toBe("minimal");
      expect(result.genres).toEqual([]);
      expect(result.latestChapter).toBeUndefined();
    });
  });

  describe("transformComicSearchItem", () => {
    it("transforms a search result correctly", () => {
      const raw: RawComicSearchItem = {
        title: "Search Result",
        slug: "search-slug",
        thumbnail: "search.jpg",
        type: "Manga",
        genre: "Action",
        description: "An action manga",
      };

      const result = transformComicSearchItem(raw);

      expect(result.manga_id).toBe("search-slug");
      expect(result.title).toBe("Search Result");
      expect(result.thumbnail).toBe("search.jpg");
      expect(result.type).toBe("Manga");
      expect(result.genres).toEqual(["Action"]);
      expect(result.description).toBe("An action manga");
    });
  });

  describe("transformComicChapter", () => {
    it("transforms a chapter item correctly", () => {
      const raw: RawComicChapterItem = {
        chapter: "Chapter 25",
        slug: "manga-chapter-25",
        date: "01/01/2026",
      };

      const result = transformComicChapter(raw);

      expect(result.chapter_id).toBe("manga-chapter-25");
      expect(result.title).toBe("Chapter 25");
      expect(result.chapter).toBe(25);
      expect(result.date).toBe("01/01/2026");
    });

    it("handles decimal chapter numbers", () => {
      const raw: RawComicChapterItem = {
        chapter: "Chapter 5.5",
        slug: "manga-chapter-5-5",
      };

      const result = transformComicChapter(raw);
      expect(result.chapter).toBe(5.5);
    });

    it("handles missing fields", () => {
      const raw: RawComicChapterItem = {};

      const result = transformComicChapter(raw);

      expect(result.chapter_id).toBe("");
      expect(result.title).toBe("");
      expect(result.chapter).toBe(0);
    });
  });

  describe("transformComicDetail", () => {
    it("transforms a full comic detail correctly", () => {
      const raw: RawComicDetailData = {
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

      const result = transformComicDetail(raw);

      expect(result.manga_id).toBe("detail-k");
      expect(result.title).toBe("Detail Komik");
      expect(result.thumbnail).toBe("cover.jpg");
      expect(result.description).toBe("Full synopsis text");
      expect(result.type).toBe("Manhwa");
      expect(result.author).toBe("Author Name");
      expect(result.status).toBe("Ongoing");
      expect(result.genres).toEqual(["Action"]);
      // Chapters sorted ascending
      expect(result.chapters).toHaveLength(2);
      expect(result.chapters![0].chapter_id).toBe("detail-k-chapter-1");
      expect(result.chapters![1].chapter_id).toBe("detail-k-chapter-2");
    });

    it("uses synopsis when synopsis_full is missing", () => {
      const raw: RawComicDetailData = {
        slug: "test",
        title: "Test",
        synopsis: "Short synopsis",
      };

      const result = transformComicDetail(raw);
      expect(result.description).toBe("Short synopsis");
    });

    it("skips author when it is '-'", () => {
      const raw: RawComicDetailData = {
        slug: "k1",
        title: "K",
        metadata: { author: "-" },
      };

      const result = transformComicDetail(raw);
      expect(result.author).toBeUndefined();
    });

    it("filters out chapters with empty slug", () => {
      const raw: RawComicDetailData = {
        slug: "test",
        title: "Test",
        chapters: [
          { chapter: "Chapter 1", slug: "test-chapter-1" },
          { chapter: "Chapter 2", slug: "" },
        ],
      };

      const result = transformComicDetail(raw);
      expect(result.chapters).toHaveLength(1);
    });

    it("sets latestChapter from the last sorted chapter", () => {
      const raw: RawComicDetailData = {
        slug: "test",
        title: "Test",
        chapters: [
          { chapter: "Chapter 1", slug: "test-chapter-1" },
          { chapter: "Chapter 3", slug: "test-chapter-3" },
          { chapter: "Chapter 2", slug: "test-chapter-2" },
        ],
      };

      const result = transformComicDetail(raw);
      expect(result.latestChapter).toBe("Chapter 3");
    });
  });
});
