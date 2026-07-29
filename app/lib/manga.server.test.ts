import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchSankaChapter, parseImages } from "./manga.server";

describe("parseImages", () => {
  it("keeps only non-empty image URLs", () => {
    expect(parseImages(["https://cdn/a.webp", "", 4, null])).toEqual([
      "https://cdn/a.webp",
    ]);
  });

  it("supports {id,url}[] for komikindo images", () => {
    expect(
      parseImages([
        { id: 1, url: "https://cdn/a.jpg" },
        { id: 2, url: "https://cdn/b.jpg" },
        { id: 3, url: "" },
        {},
      ]),
    ).toEqual(["https://cdn/a.jpg", "https://cdn/b.jpg"]);
  });
});

describe("fetchSankaChapter with komikindo shape", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("extracts images from body.data shape", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: true,
          data: {
            title: "Chapter 20",
            images: [
              { id: 1, url: "https://cdn/a.jpg" },
              { id: 2, url: "https://cdn/b.jpg" },
            ],
            navigation: { prev: "ch-19", next: null },
          },
        }),
        { headers: { "content-type": "application/json" } },
      ),
    );
    const result = await fetchSankaChapter("test-chapter", "komikindo");
    expect(result).toEqual({
      title: "Chapter 20",
      images: ["https://cdn/a.jpg", "https://cdn/b.jpg"],
      next: null,
      prev: "ch-19",
    });
  });

  it("falls back to flat body shape for bacakomik", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: true,
          title: "Bacakomik Chapter",
          images: ["https://cdn/legacy.jpg"],
          navigation: { prev: null, next: null },
        }),
        { headers: { "content-type": "application/json" } },
      ),
    );
    const result = await fetchSankaChapter("test-chapter", "bacakomik");
    expect(result?.images).toEqual(["https://cdn/legacy.jpg"]);
    expect(result?.title).toBe("Bacakomik Chapter");
  });
});
