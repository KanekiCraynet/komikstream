/**
 * Otakudesu HTML Scraper
 *
 * Scrapes anime data directly from otakudesu.cloud using cheerio.
 * Replaces the sankavollerei.com API for all anime endpoints.
 *
 * Base URL is configurable via OTAKUDESU_URL env var so the domain
 * can be updated if it changes without a redeploy.
 */

import * as cheerio from "cheerio";
import type { Element } from "domhandler";
import type {
  Anime,
  AnimeEpisode,
  AnimeGenre,
  AnimeScheduleDay,
  AnimeBatchDownload,
  PaginatedResult,
} from "@/types";
import type { RawEpisodeData, RawQualityItem, RawServerItem } from "../types";
import { CACHE_TIMES } from "@/lib/cache-config";
import { fetchHtml, slugFromUrl } from "./fetch";

const BASE = (process.env.OTAKUDESU_URL ?? "https://otakudesu.cloud").replace(/\/$/, "");

// ─── Helpers ─────────────────────────────────────────────────────────────────

function animeIdFromHref(href: string | undefined): string {
  if (!href) return "";
  return slugFromUrl(href, `${BASE}/anime/`);
}

function episodeIdFromHref(href: string | undefined): string {
  if (!href) return "";
  // Remove base prefix and trailing slash
  return href.replace(BASE, "").replace(/^\/|\/$/g, "");
}

function parseEpisodeNumber(title: string): number {
  const m = title.match(/(\d+(?:\.\d+)?)/);
  return m ? parseFloat(m[1]) : 0;
}

/** Build an Anime list item from the common .venz list structure. */
function parseAnimeListItem($: cheerio.CheerioAPI, el: Element): Anime {
  const $el = $(el);
  const anchor = $el.find(".thumb > a");
  const href = anchor.attr("href") ?? "";
  const urlId = animeIdFromHref(href);
  const title = anchor.find(".thumbz > h2").text().trim() || anchor.find("h2").text().trim();
  const thumbnail = anchor.find(".thumbz > img, img").first().attr("src") ?? "";
  const episodeText = $el.find(".epz").text().trim();
  const scoreText = $el.find(".epztipe").text().trim();

  return {
    urlId,
    title,
    thumbnail,
    totalEpisodes: episodeText ? parseInt(episodeText) || undefined : undefined,
    rating: scoreText && !isNaN(parseFloat(scoreText)) ? parseFloat(scoreText) : undefined,
  };
}

// ─── Anime Lists ─────────────────────────────────────────────────────────────

export async function getOngoingAnime(): Promise<Anime[]> {
  const $ = await fetchHtml(`${BASE}/ongoing-anime/`, CACHE_TIMES.LATEST);
  const items: Anime[] = [];
  $(".venz > div:first-child ul > li, .venz ul > li").each((_, el) => {
    const anime = parseAnimeListItem($, el);
    if (anime.urlId) items.push(anime);
  });
  return items;
}

export async function getCompleteAnime(page = 1): Promise<Anime[]> {
  const url = page > 1 ? `${BASE}/complete-anime/page/${page}/` : `${BASE}/complete-anime/`;
  const $ = await fetchHtml(url, CACHE_TIMES.POPULAR);
  const items: Anime[] = [];
  $(".venz > div:first-child ul > li, .venz ul > li").each((_, el) => {
    const anime = parseAnimeListItem($, el);
    if (anime.urlId) items.push(anime);
  });
  return items;
}

export async function getHomeAnime(): Promise<{ ongoing: Anime[]; complete: Anime[] }> {
  const $ = await fetchHtml(`${BASE}/`, CACHE_TIMES.LATEST);
  const ongoing: Anime[] = [];
  const complete: Anime[] = [];

  $(".venz > div").each((sectionIdx, section) => {
    const list = sectionIdx === 0 ? ongoing : complete;
    $(section)
      .find("ul > li")
      .each((_, el) => {
        const anime = parseAnimeListItem($, el);
        if (anime.urlId) list.push(anime);
      });
  });

  return { ongoing, complete };
}

// ─── Anime Detail ─────────────────────────────────────────────────────────────

export async function getAnimeDetail(slug: string): Promise<Anime | null> {
  const $ = await fetchHtml(`${BASE}/anime/${slug}/`, CACHE_TIMES.DETAIL);

  const thumbnail = $(".venser .fotoanime img").first().attr("src") ?? "";
  if (!thumbnail && !$(".infozin, .infozinge, .infozingle").length) return null;

  // Parse info table — keys are like "Judul:", "Skor:", etc.
  const info: Record<string, string> = {};
  $(".infozin p, .infozinge p, .infozingle p").each((_, el) => {
    const text = $(el).text();
    const colonIdx = text.indexOf(":");
    if (colonIdx === -1) return;
    const key = text.slice(0, colonIdx).trim().toLowerCase();
    const val = text.slice(colonIdx + 1).trim();
    info[key] = val;
  });

  const title = info["judul"] || info["title"] || $(".jdlrx h1, .infozin h1").first().text().trim();
  const synopsis =
    $(".sinopc p")
      .map((_, el) => $(el).text().trim())
      .get()
      .join("\n\n") || $(".sinopc").text().trim();

  // Genres
  const genres: string[] = [];
  $(".infozin p, .infozinge p, .infozingle p")
    .last()
    .find("a")
    .each((_, el) => {
      genres.push($(el).text().trim());
    });
  // fallback: look for genre links directly
  if (!genres.length) {
    $("a[href*='/genres/']").each((_, el) => {
      const g = $(el).text().trim();
      if (g) genres.push(g);
    });
  }

  // Episodes — in #venkonten list
  const episodes: AnimeEpisode[] = [];
  $("#venkonten .venser li, .venser .episodelist li").each((_, el) => {
    const a = $(el).find("span > a, a").first();
    const epHref = a.attr("href") ?? "";
    const epTitle = a.text().trim();
    if (!epHref || !epTitle) return;
    const epId = episodeIdFromHref(epHref);
    episodes.push({
      episodeId: epId,
      title: epTitle,
      episode: parseEpisodeNumber(epTitle),
      url: epId,
      date: $(el).find(".zeebr").text().trim() || undefined,
    });
  });
  episodes.sort((a, b) => parseEpisodeNumber(a.title) - parseEpisodeNumber(b.title));

  return {
    urlId: slug,
    title,
    thumbnail,
    cover: thumbnail,
    synopsis,
    rating: info["skor"] ? parseFloat(info["skor"]) || undefined : undefined,
    type: info["tipe"] || info["type"] || undefined,
    status: info["status"] || undefined,
    genres,
    episodes,
    totalEpisodes: info["total episode"] ? parseInt(info["total episode"]) || undefined : undefined,
    duration: info["durasi"] || info["duration"] || undefined,
    studio: info["studio"] || undefined,
  };
}

// ─── Episode & Streaming ─────────────────────────────────────────────────────

export async function getAnimeEpisode(episodeId: string): Promise<RawEpisodeData | null> {
  // episodeId may be "episode/anime-episode-1-sub-indo" or just "anime-episode-1-sub-indo"
  const path = episodeId.startsWith("episode/") ? episodeId : `episode/${episodeId}`;
  const $ = await fetchHtml(`${BASE}/${path}/`, CACHE_TIMES.SEARCH);

  const title = $(".venutama h1, h1.entry-title").first().text().trim();
  if (!title) return null;

  // Default stream URL — iframe in the video player
  const defaultStreamingUrl =
    $("#lightsVideo iframe, #pembed iframe").first().attr("src") ?? undefined;

  // Prev/next episode navigation
  const prevHref = $(".nvs.nvprev a, .nvs a.prev").first().attr("href");
  const nextHref = $(".nvs.nvnext a, .nvs a.next").first().attr("href");
  const prevId = prevHref ? episodeIdFromHref(prevHref) : null;
  const nextId = nextHref ? episodeIdFromHref(nextHref) : null;

  // Mirror streams — build quality list from .mirrorstream
  const qualityMap: Record<string, RawServerItem[]> = {};
  const qualityOrder = ["1080p", "720p", "480p", "360p"];

  // ul.m1080p, ul.m720p, ul.m480p, ul.m360p
  for (const q of qualityOrder) {
    const servers: RawServerItem[] = [];
    $(`#embed_holder .mirrorstream ul.m${q} li, .mirrorstream ul.m${q} li`).each((_, el) => {
      const a = $(el).find("a");
      const host = a.text().trim();
      // data-content is base64-encoded embed URL on modern Otakudesu
      const dataContent = a.attr("data-content") ?? a.attr("href") ?? "";
      if (host && dataContent && dataContent !== "#") {
        servers.push({ title: host, serverId: dataContent });
      }
    });
    if (servers.length) qualityMap[q] = servers;
  }

  const qualities: RawQualityItem[] = Object.entries(qualityMap).map(([q, serverList]) => ({
    title: q,
    serverList,
  }));

  // Download links
  const downloadQualities: RawEpisodeData["downloadUrl"] = { qualities: [] };
  $(".download ul").each((_, ul) => {
    const qualityEl = $(ul).find("li strong").first();
    const qualityText = qualityEl.text().trim();
    const size = $(ul).find("li i").first().text().trim();
    const urls: Array<{ title?: string; url?: string }> = [];
    $(ul)
      .find("li a")
      .each((_, a) => {
        urls.push({ title: $(a).text().trim(), url: $(a).attr("href") });
      });
    if (qualityText && urls.length) {
      downloadQualities.qualities!.push({ title: qualityText, size, urls });
    }
  });

  return {
    title,
    defaultStreamingUrl,
    hasPrevEpisode: !!prevId,
    prevEpisode: prevId ? { episodeId: prevId } : null,
    hasNextEpisode: !!nextId,
    nextEpisode: nextId ? { episodeId: nextId } : null,
    server: { qualities },
    downloadUrl: downloadQualities,
  };
}

/**
 * Decode a server ID (base64 or plain URL) into an embed URL.
 *
 * Otakudesu's data-content attributes are base64-encoded iframe URLs.
 */
export async function getAnimeServerUrl(serverId: string): Promise<string | null> {
  if (!serverId) return null;

  // If it already looks like a URL, return as-is
  if (serverId.startsWith("http")) return serverId;

  // Try base64 decode
  try {
    const decoded = Buffer.from(serverId, "base64").toString("utf-8");
    if (decoded.startsWith("http")) return decoded;
  } catch {
    // not valid base64
  }

  return serverId;
}

// ─── Search ───────────────────────────────────────────────────────────────────

export async function searchAnime(query: string): Promise<Anime[]> {
  const $ = await fetchHtml(
    `${BASE}/?s=${encodeURIComponent(query)}&post_type=anime`,
    CACHE_TIMES.SEARCH
  );

  const items: Anime[] = [];
  // Search results use .chivsrc li or .page ul > li
  $(".chivsrc li, .page ul > li").each((_, el) => {
    const a = $(el).find("h2 > a, h2 a").first();
    const href = a.attr("href") ?? "";
    const title = a.text().trim();
    if (!href || !title) return;
    const thumbnail = $(el).find("img").first().attr("src") ?? "";
    const urlId = animeIdFromHref(href);
    const status = $(el)
      .find(".set")
      .eq(1)
      .text()
      .replace(/status\s*:\s*/i, "")
      .trim();
    const scoreText = $(el)
      .find(".set")
      .eq(2)
      .text()
      .replace(/rating\s*:\s*/i, "")
      .trim();
    const genres: string[] = [];
    $(el)
      .find("a[href*='/genres/']")
      .each((_, g) => {
        genres.push($(g).text().trim());
      });

    items.push({
      urlId,
      title,
      thumbnail,
      status: status || undefined,
      rating: scoreText && !isNaN(parseFloat(scoreText)) ? parseFloat(scoreText) : undefined,
      genres,
    });
  });

  return items;
}

// ─── Schedule ─────────────────────────────────────────────────────────────────

export async function getAnimeSchedule(): Promise<AnimeScheduleDay[]> {
  const $ = await fetchHtml(`${BASE}/jadwal-rilis/`, CACHE_TIMES.POPULAR);
  const days: AnimeScheduleDay[] = [];

  $(".kgjdwl321 .kglist321, .jadwal .hari").each((_, section) => {
    const day = $(section).find("h2").text().trim();
    const animeList: AnimeScheduleDay["animeList"] = [];
    $(section)
      .find("ul > li")
      .each((_, li) => {
        const a = $(li).find("a").first();
        const href = a.attr("href") ?? "";
        const title = a.text().trim();
        if (!title) return;
        animeList.push({
          title,
          slug: animeIdFromHref(href),
          url: href,
          poster: "",
        });
      });
    if (day && animeList.length) days.push({ day, animeList });
  });

  return days;
}

// ─── Genres ───────────────────────────────────────────────────────────────────

export async function getAnimeGenres(): Promise<AnimeGenre[]> {
  const $ = await fetchHtml(`${BASE}/genre-list/`, CACHE_TIMES.STATIC);
  const genres: AnimeGenre[] = [];

  $(".genres li > a, .genre-list li > a").each((_, el) => {
    const href = $(el).attr("href") ?? "";
    const title = $(el).text().trim();
    const genreId = href.replace(/.*\/genres\//, "").replace(/\/$/, "");
    if (title && genreId) {
      genres.push({ title, genreId, href, otakudesuUrl: href });
    }
  });

  return genres;
}

export async function getAnimeByGenre(slug: string, page = 1): Promise<PaginatedResult<Anime>> {
  const url = `${BASE}/genres/${slug}/page/${page}/`;
  const $ = await fetchHtml(url, CACHE_TIMES.POPULAR);
  const items: Anime[] = [];

  $(".page .col-md-4").each((_, el) => {
    const a = $(el).find(".col-anime-title > a, a").first();
    const href = a.attr("href") ?? "";
    const title = $(el).find(".col-anime-title").text().trim() || a.text().trim();
    if (!title) return;
    const thumbnail = $(el).find(".col-anime-cover img, img").first().attr("src") ?? "";
    const urlId = animeIdFromHref(href);
    const genres: string[] = [];
    $(el)
      .find(".col-anime-genre a")
      .each((_, g) => {
        genres.push($(g).text().trim());
      });
    const scoreText = $(el).find(".col-anime-rating").text().trim();

    items.push({
      urlId,
      title,
      thumbnail,
      genres,
      rating: scoreText && !isNaN(parseFloat(scoreText)) ? parseFloat(scoreText) : undefined,
    });
  });

  // Detect next page from pagination
  const hasNextPage = !!$("a.next, .pagination a.next, .nav-links a.next").length;

  return { items, hasNextPage, totalPages: hasNextPage ? page + 1 : page };
}

// ─── Batch Download ───────────────────────────────────────────────────────────

export async function getAnimeBatch(slug: string): Promise<AnimeBatchDownload | null> {
  const $ = await fetchHtml(`${BASE}/batch/${slug}/`, CACHE_TIMES.DETAIL);

  const title = $(".batchlink h4, .entry-title h1, h1").first().text().trim();
  if (!title) return null;

  const qualities: AnimeBatchDownload["batchList"][0]["qualities"] = [];

  $(".download .batchlink ul, .batchlink .download ul").each((_, ul) => {
    const qualityText = $(ul).find("li strong").first().text().trim();
    const size = $(ul).find("li i").first().text().trim();
    const urls: Array<{ host: string; url: string }> = [];
    $(ul)
      .find("li a")
      .each((_, a) => {
        const host = $(a).text().trim();
        const url = $(a).attr("href") ?? "";
        if (host && url) urls.push({ host, url });
      });
    if (qualityText && urls.length) {
      qualities.push({ resolution: `${qualityText} ${size}`.trim(), urls });
    }
  });

  if (!qualities.length) return null;

  return {
    title,
    batchList: [{ title: "Batch Download", qualities }],
  };
}
