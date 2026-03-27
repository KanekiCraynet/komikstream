/**
 * Site-wide configuration — single source of truth for branding, URLs, and SEO.
 */

export const siteConfig = {
  /** Brand name */
  name: "KuroManga",
  /** Shortened name for PWA / mobile */
  shortName: "KuroManga",
  /** Logo text split: [highlighted, rest] */
  logoParts: ["Kuro", "Manga"] as const,
  /** Full tagline */
  tagline: "Baca Komik & Nonton Anime Sub Indo Gratis",
  /** Short description for meta */
  description:
    "Baca komik manga, manhwa, manhua subtitle Indonesia gratis. Nonton anime sub Indo terlengkap dengan update terbaru setiap hari di KuroManga.",
  /** Canonical base URL (no trailing slash) */
  url: "https://kuromanga.me",
  /** OG image path (relative to public/) */
  ogImage: "/og-image.png",
  /** Locale */
  locale: "id_ID",
  /** Language */
  lang: "id",
  /** Author / publisher / creator */
  author: "KuroManga",
  /** Team credit */
  team: {
    name: "XenZee Team",
    url: "https://xenzee.site",
  },
  /** SEO keywords */
  keywords: [
    "baca komik online",
    "manga indonesia",
    "manhwa sub indo",
    "manhua terbaru",
    "komik gratis",
    "nonton anime",
    "anime sub indo",
    "streaming anime",
    "kuromanga",
    "kuro manga",
    "baca manga gratis",
    "komik manga online",
  ],
  /** Social / external links */
  links: {
    github: "https://github.com/KanekiCraynet/komikstream",
    telegram: "https://t.me/kuromangame",
    instagram: "https://instagram.com/kuromanga.me",
  },
} as const;

export type SiteConfig = typeof siteConfig;
