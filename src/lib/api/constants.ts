/**
 * API Constants — sankavollerei.com Provider
 *
 * Base URLs and browser-like headers required to bypass the Plana AI Detector.
 */

const DIRECT_API_URL = "https://www.sankavollerei.com";

// Server-side: route API calls through CF Worker proxy to bypass Plana AI Detector
// (Azure IPs AND CF Worker IPs are blocked; Deno Deploy IPs are not).
// Client-side: use direct URL (browser IPs are not blocked).
const API_PROXY_URL = process.env.API_PROXY_URL; // e.g. https://kuromanga.me/api-proxy
const API_PROXY_TOKEN = process.env.API_PROXY_TOKEN;

export const BASE_URL = API_PROXY_URL || process.env.NEXT_PUBLIC_API_URL || DIRECT_API_URL;

// ==================== BROWSER-LIKE HEADERS ====================
// Required to bypass the Plana AI Detector on sankavollerei.com.
// When using CF Worker proxy, the Worker adds its own headers — but we
// still include these as fallback for direct calls.

export const ANIME_HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
  Referer: "https://www.sankavollerei.com/anime/",
  "sec-ch-ua": '"Chromium";v="136", "Google Chrome";v="136", "Not.A/Brand";v="99"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"Windows"',
  "sec-fetch-dest": "empty",
  "sec-fetch-mode": "cors",
  "sec-fetch-site": "same-origin",
  ...(API_PROXY_TOKEN ? { "x-api-proxy-token": API_PROXY_TOKEN } : {}),
};

export const COMIC_HEADERS: Record<string, string> = {
  ...ANIME_HEADERS,
  Referer: "https://www.sankavollerei.com/comic",
};
