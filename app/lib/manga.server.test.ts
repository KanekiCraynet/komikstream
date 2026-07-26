import { describe, expect, it } from "vitest";
import { parseImages } from "./manga.server";

describe("parseImages", () => {
  it("keeps only non-empty image URLs", () => {
    expect(parseImages(["https://cdn/a.webp", "", 4, null])).toEqual([
      "https://cdn/a.webp",
    ]);
  });

  it("returns empty array for non-array Prisma JSON", () => {
    expect(parseImages({ url: "https://cdn/a.webp" })).toEqual([]);
  });
});
