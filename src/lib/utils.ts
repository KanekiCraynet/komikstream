import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("id-ID", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

export function formatNumber(num: number): string {
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  }
  return num.toString();
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Whitelisted external image hostnames that are proxied through /cdn/
 * to bypass Indonesian ISP DNS blocking of upstream CDN domains.
 */
const PROXIED_IMAGE_HOSTS = [
  "thumbnail.komiku.org",
  "img.komiku.org",
  "cdn.komiku.org",
  "otakudesu.blog",
];

export function getImageUrl(url: string): string {
  // Handle different image URL formats from API
  if (!url || url === "undefined" || url === "null") {
    return "https://placehold.co/300x450/1a1a2e/ffffff?text=No+Image";
  }
  if (url.startsWith("//")) url = `https:${url}`;
  if (url.startsWith("http")) {
    try {
      const parsed = new URL(url);
      if (PROXIED_IMAGE_HOSTS.includes(parsed.hostname)) {
        // Convert landscape resize params to portrait for card display
        let search = parsed.search;
        if (/[?&]resize=\d+,\d+/.test(search)) {
          search = search.replace(/([?&]resize=)\d+,\d+/, "$1300,450");
        }
        // Proxy through our domain: /cdn/hostname/path?query
        return `/cdn/${parsed.hostname}${parsed.pathname}${search}`;
      }
    } catch {
      // Invalid URL — return as-is
    }
    return url;
  }
  return url;
}
