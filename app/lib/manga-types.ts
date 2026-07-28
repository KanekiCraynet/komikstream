export type SankaChapter = {
  title?: string;
  slug: string;
  date?: string;
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
  genres?: { title?: string; slug?: string }[];
  chapters?: SankaChapter[];
};

export function parseMangaMetadata(raw: unknown): MangaMetadata {
  if (!Array.isArray(raw) || typeof raw[0] !== "object" || raw[0] === null) return {};
  return raw[0] as MangaMetadata;
}
