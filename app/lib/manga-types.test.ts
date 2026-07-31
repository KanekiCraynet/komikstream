import { describe, expect, it } from "vitest";
import { extractGenres } from "./manga-types";

describe("extractGenres", () => {
  it("dedupes and sorts {name,slug} objects", () => {
    expect(
      extractGenres([
        { name: "Action", slug: "action" },
        { name: "Fantasy", slug: "fantasy" },
        { name: "Action", slug: "action" },
      ]),
    ).toEqual([
      { name: "Action", slug: "action" },
      { name: "Fantasy", slug: "fantasy" },
    ]);
  });

  it("collects nested genres under metadata[0].genres", () => {
    expect(
      extractGenres([
        {
          genres: [
            { title: "Romance", slug: "romance" },
            { name: "Drama", slug: "drama" },
          ],
        },
      ]),
    ).toEqual([
      { name: "Drama", slug: "drama" },
      { name: "Romance", slug: "romance" },
    ]);
  });

  it("drops comic types and derives a slug from a plain name", () => {
    expect(extractGenres(["Manhwa", "Manga", "Manhua", "Slice of Life"])).toEqual([
      { name: "Slice of Life", slug: "slice-of-life" },
    ]);
  });

  it("drops comic types given as {name,slug} objects", () => {
    expect(
      extractGenres([
        { name: "Manhwa", slug: "manhwa" },
        { name: "Action", slug: "action" },
      ]),
    ).toEqual([{ name: "Action", slug: "action" }]);
  });

  it("returns [] for empty or malformed input", () => {
    expect(extractGenres([])).toEqual([]);
    expect(extractGenres(null)).toEqual([]);
    expect(extractGenres("Action")).toEqual([]);
  });
});
