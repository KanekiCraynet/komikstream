/**
 * Tests for src/lib/api/fetch.ts
 *
 * Covers: fetchWithCache (retry, 429, errors), ensureArray helper
 */

import { fetchWithCache, ensureArray } from "@/lib/api/fetch";

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

describe("fetchWithCache", () => {
  it("returns parsed JSON on success", async () => {
    fetchMock.mockReturnValueOnce(okJson({ message: "success" }));
    const result = await fetchWithCache(`${BASE_URL}/test`, 60);
    expect(result).toEqual({ message: "success" });
  });

  it("throws on non-ok response after retries", async () => {
    fetchMock
      .mockReturnValueOnce(errorResponse(500))
      .mockReturnValueOnce(errorResponse(500))
      .mockReturnValueOnce(errorResponse(500));

    await expect(fetchWithCache(`${BASE_URL}/test`, 60, 2)).rejects.toThrow("API Error: 500");
  }, 15000);

  it("retries on network error and succeeds", async () => {
    fetchMock
      .mockRejectedValueOnce(new Error("Network error"))
      .mockReturnValueOnce(okJson({ recovered: true }));

    const result = await fetchWithCache(`${BASE_URL}/test`, 60, 1);
    expect(result).toEqual({ recovered: true });
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

    await expect(fetchWithCache(`${BASE_URL}/test`, 60, 2)).rejects.toThrow(
      "API rate limited (429)"
    );
  }, 30000);

  it("passes headers to fetch", async () => {
    fetchMock.mockReturnValueOnce(okJson({}));
    const headers = { "X-Custom": "value" };
    await fetchWithCache(`${BASE_URL}/test`, 60, 1, headers);
    expect(fetchMock).toHaveBeenCalledWith(
      `${BASE_URL}/test`,
      expect.objectContaining({ headers })
    );
  });
});

describe("ensureArray", () => {
  it("returns empty array for undefined", () => {
    expect(ensureArray(undefined)).toEqual([]);
  });

  it("returns empty array for null", () => {
    expect(ensureArray(null)).toEqual([]);
  });

  it("returns the same array if already an array", () => {
    const arr = [1, 2, 3];
    expect(ensureArray(arr)).toBe(arr);
  });

  it("returns empty array for non-array values", () => {
    // Note: The implementation returns [] for non-array truthy values
    // This is by design to handle API responses
    expect(ensureArray("hello")).toEqual([]);
    expect(ensureArray(42)).toEqual([]);
    expect(ensureArray({ key: "value" })).toEqual([]);
  });
});
