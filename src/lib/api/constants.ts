/**
 * API Constants
 *
 * Shared browser-like headers used by legacy fetch paths.
 * Direct sankavollerei.com dependency removed — data now comes
 * from Otakudesu (anime) and Komikcast (comic) scrapers.
 */

// Retained for any remaining fetchWithCache calls (e.g. api-cached.ts fallbacks).
// These headers are no longer used for the main anime/comic data flow.
export const BASE_URL = "";

export const ANIME_HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
  "sec-fetch-dest": "empty",
  "sec-fetch-mode": "cors",
  "sec-fetch-site": "same-origin",
};

export const COMIC_HEADERS: Record<string, string> = {
  ...ANIME_HEADERS,
};
