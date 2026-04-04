/**
 * Tests for src/lib/api/homepage.ts
 *
 * Covers: getHomepageData
 */

import { getHomepageData } from "@/lib/api/homepage";

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

describe("homepage API", () => {
  describe("getHomepageData", () => {
    it("aggregates all homepage data from multiple endpoints", async () => {
      // getKomikLatest
      fetchMock.mockReturnValueOnce(okJson({ comics: [{ title: "K1", link: "/manga/k1/" }] }));
      // getKomikPopular
      fetchMock.mockReturnValueOnce(okJson({ comics: [{ title: "K2", link: "/manga/k2/" }] }));
      // getAnimeLatest
      fetchMock.mockReturnValueOnce(
        okJson({
          status: "success",
          data: { animeList: [{ animeId: "a1", title: "Anime 1" }] },
        })
      );
      // getAnimeRecommended
      fetchMock.mockReturnValueOnce(
        okJson({
          status: "success",
          data: {
            ongoing: { animeList: [{ animeId: "a2", title: "Anime 2" }] },
            completed: { animeList: [] },
          },
        })
      );

      const result = await getHomepageData();

      expect(result.komikLatest).toHaveLength(1);
      expect(result.komikLatest[0].title).toBe("K1");
      expect(result.komikPopular).toHaveLength(1);
      expect(result.komikPopular[0].title).toBe("K2");
      expect(result.animeLatest).toHaveLength(1);
      expect(result.animeLatest[0].title).toBe("Anime 1");
      expect(result.animeRecommended).toHaveLength(1);
      expect(result.animeRecommended[0].title).toBe("Anime 2");
    });

    it("calls correct endpoints", async () => {
      fetchMock
        .mockReturnValueOnce(okJson({ comics: [] }))
        .mockReturnValueOnce(okJson({ comics: [] }))
        .mockReturnValueOnce(okJson({ status: "success", data: { animeList: [] } }))
        .mockReturnValueOnce(okJson({ status: "success", data: { ongoing: {}, completed: {} } }));

      await getHomepageData();

      expect(fetchMock).toHaveBeenCalledWith(`${BASE_URL}/comic/terbaru`, expect.anything());
      expect(fetchMock).toHaveBeenCalledWith(`${BASE_URL}/comic/populer`, expect.anything());
      expect(fetchMock).toHaveBeenCalledWith(`${BASE_URL}/anime/ongoing-anime`, expect.anything());
      expect(fetchMock).toHaveBeenCalledWith(`${BASE_URL}/anime/home`, expect.anything());
    });

    it("returns empty arrays when individual fetches fail", async () => {
      // Mock all calls to fail
      for (let i = 0; i < 12; i++) {
        fetchMock.mockRejectedValueOnce(new Error("fail"));
      }

      const result = await getHomepageData();

      expect(result.komikLatest).toEqual([]);
      expect(result.komikPopular).toEqual([]);
      expect(result.animeLatest).toEqual([]);
      expect(result.animeRecommended).toEqual([]);
    }, 30000);

    it("handles partial failures gracefully", async () => {
      // Use URL-based mocking since Promise.all runs in parallel
      // and call order is not guaranteed
      fetchMock.mockImplementation((url: string) => {
        if (url.includes("/comic/terbaru")) {
          // getKomikLatest succeeds
          return okJson({ comics: [{ title: "K1", link: "/manga/k1/" }] });
        }
        if (url.includes("/comic/populer")) {
          // getKomikPopular fails
          return Promise.reject(new Error("fail"));
        }
        if (url.includes("/anime/ongoing-anime")) {
          // getAnimeLatest succeeds
          return okJson({
            status: "success",
            data: { animeList: [{ animeId: "a1", title: "Anime 1" }] },
          });
        }
        if (url.includes("/anime/home")) {
          // getAnimeRecommended fails
          return Promise.reject(new Error("fail"));
        }
        return Promise.reject(new Error("Unknown URL"));
      });

      const result = await getHomepageData();

      // Successful fetches should have data
      expect(result.komikLatest).toHaveLength(1);
      expect(result.animeLatest).toHaveLength(1);
      // Failed fetches should return empty arrays
      expect(result.komikPopular).toEqual([]);
      expect(result.animeRecommended).toEqual([]);
    }, 30000);

    it("runs all fetches in parallel for performance", async () => {
      const startTime = Date.now();

      // Each fetch takes 50ms
      const delay = (body: unknown) =>
        new Promise<{ ok: boolean; status: number; json: () => Promise<unknown> }>((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                status: 200,
                json: () => Promise.resolve(body),
              }),
            50
          )
        );

      fetchMock
        .mockReturnValueOnce(delay({ comics: [] }))
        .mockReturnValueOnce(delay({ comics: [] }))
        .mockReturnValueOnce(delay({ status: "success", data: { animeList: [] } }))
        .mockReturnValueOnce(delay({ status: "success", data: { ongoing: {}, completed: {} } }));

      await getHomepageData();

      const elapsed = Date.now() - startTime;

      // If parallel, should take ~50-100ms, not 200ms (4 x 50ms)
      // Using 150ms as threshold to account for test overhead
      expect(elapsed).toBeLessThan(150);
    });
  });
});
