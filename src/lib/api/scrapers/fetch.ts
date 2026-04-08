/**
 * Shared HTML fetch helper for scrapers.
 *
 * Uses Next.js ISR fetch caching. If SCRAPER_PROXY_URL is set, all
 * requests are routed through that proxy (CF Worker transparent HTML proxy)
 * to bypass potential IP blocks on Azure.
 */

import * as cheerio from "cheerio";

// Route through CF Worker if Azure IPs are blocked by the target sites.
// Set SCRAPER_PROXY_URL=https://kuromanga.me/proxy in Azure App Settings.
const SCRAPER_PROXY_URL = process.env.SCRAPER_PROXY_URL;
const SCRAPER_PROXY_TOKEN = process.env.SCRAPER_PROXY_TOKEN;

export const SCRAPE_HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
  "Cache-Control": "no-cache",
};

/**
 * Fetch a URL and return a loaded Cheerio instance.
 *
 * @param url - Full URL to fetch
 * @param revalidate - ISR revalidation seconds (0 = no cache)
 */
export async function fetchHtml(url: string, revalidate: number): Promise<cheerio.CheerioAPI> {
  const useProxy = !!SCRAPER_PROXY_URL;
  const fetchUrl = useProxy ? `${SCRAPER_PROXY_URL}?url=${encodeURIComponent(url)}` : url;

  const headers: Record<string, string> = { ...SCRAPE_HEADERS };
  if (useProxy && SCRAPER_PROXY_TOKEN) {
    headers["x-scraper-proxy-token"] = SCRAPER_PROXY_TOKEN;
  }

  const res = await fetch(fetchUrl, {
    headers,
    next: { revalidate },
  });

  if (!res.ok) {
    throw new Error(`Scrape failed: HTTP ${res.status} from ${url}`);
  }

  const html = await res.text();
  return cheerio.load(html);
}

/**
 * Extract a slug from a full URL by taking the last non-empty path segment.
 *
 * e.g. "https://otakudesu.cloud/anime/one-piece-sub-indo/" → "one-piece-sub-indo"
 */
export function slugFromUrl(url: string | undefined, base?: string): string {
  if (!url) return "";
  let path = url;
  if (base) path = path.replace(base, "");
  return (
    path
      .replace(/^\/|\/$/g, "")
      .split("/")
      .filter(Boolean)
      .pop() ?? ""
  );
}
