export type SankaChapter = {
  title?: string;
  slug: string;
  date?: string;
  releaseTime?: string;
};

export type MangaMetadata = {
  rating?: string;
  otherTitle?: string;
  status?: string;
  type?: string;
  author?: string;
  artist?: string;
  release?: string;
  series?: string;
  reader?: string;
  synopsis?: string;
  genres?: { title?: string; slug?: string; name?: string }[];
  chapters?: SankaChapter[];
};

export function parseMangaMetadata(raw: unknown): MangaMetadata {
  if (!Array.isArray(raw) || typeof raw[0] !== "object" || raw[0] === null) return {};
  return raw[0] as MangaMetadata;
}

export type GenreItem = { name: string; slug: string };

/** Comic types are not genres. */
const COMIC_TYPES = new Set(["manhwa", "manga", "manhua"]);

/** Genre may be an array of {name,slug} objects, a plain string (e.g. "Action"),
 *  or nested under metadata[0].genres. Collect and dedupe any shape. */
export function extractGenres(raw: unknown): GenreItem[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Map<string, string>();
  const walk = (value: unknown) => {
    if (typeof value === "string" && value.trim()) {
      const name = value.trim();
      if (!COMIC_TYPES.has(name.toLowerCase()) && !seen.has(name)) seen.set(name, name.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
    } else if (Array.isArray(value)) {
      for (const item of value) walk(item);
    } else if (value && typeof value === "object") {
      const obj = value as Record<string, unknown>;
      const add = (name: string, slug?: unknown) => {
        const n = name.trim();
        if (!n || COMIC_TYPES.has(n.toLowerCase())) return;
        if (seen.has(n)) return;
        seen.set(n, typeof slug === "string" && slug ? slug : n.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
      };
      if (typeof obj.name === "string") add(obj.name, obj.slug);
      else if (typeof obj.title === "string") add(obj.title, obj.slug);
      for (const key of ["genres", "items", "tags"]) if (Array.isArray(obj[key])) walk(obj[key]);
    }
  };
  for (const item of raw) walk(item);
  return [...seen.entries()]
    .map(([name, slug]) => ({ name, slug }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** True when the manga carries the given genre slug. */
export function hasGenre(row: { genres: unknown; chapters: unknown }, slug: string): boolean {
  const all = [...extractGenres(row.genres), ...extractGenres(parseMangaMetadata(row.chapters).genres)];
  return all.some((genre) => genre.slug === slug);
}

/** Extract the raw latest-chapter slug from metadata JSON. */
export function getLatestChapterSlug(raw: unknown): string | undefined {
  if (!Array.isArray(raw) || raw.length === 0) return undefined;
  const item = raw[0];
  if (typeof item !== "object" || item === null) return undefined;
  return ((item as Record<string, unknown>).slug ??
    (item as Record<string, unknown>).chapterId ??
    (item as Record<string, unknown>).chapter) as string | undefined;
}
