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

/** Extract the raw latest-chapter slug from metadata JSON. */
export function getLatestChapterSlug(raw: unknown): string | undefined {
  if (!Array.isArray(raw) || raw.length === 0) return undefined;
  const item = raw[0];
  if (typeof item !== "object" || item === null) return undefined;
  return ((item as Record<string, unknown>).slug ??
    (item as Record<string, unknown>).chapterId ??
    (item as Record<string, unknown>).chapter) as string | undefined;
}
