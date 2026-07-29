export function parseImages(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item: unknown): string | null => {
      if (typeof item === "string") return item;
      if (
        item &&
        typeof item === "object" &&
        "url" in item &&
        typeof item.url === "string"
      ) {
        return item.url;
      }
      return null;
    })
    .filter((url): url is string => url !== null && url.length > 0);
}

type SourceName = "bacakomik" | "komikindo";

const SOURCE_URL: Record<SourceName, string> = {
  bacakomik: "https://www.sankavollerei.web.id/comic/bacakomik",
  komikindo: "https://www.sankavollerei.web.id/comic/komikindo",
};

export async function fetchSankaChapter(
  chapterId: string,
  source: SourceName = "bacakomik",
) {
  const response = await fetch(
    `${SOURCE_URL[source]}/chapter/${encodeURIComponent(chapterId)}`,
    { headers: { "user-agent": "KomikStream development reader" } },
  );
  if (!response.ok) return null;
  const body = (await response.json()) as {
    success?: boolean;
    title?: string;
    images?: unknown;
    navigation?: { next?: string | null; prev?: string | null };
    data?: {
      title?: string;
      images?: unknown;
      navigation?: { next?: string | null; prev?: string | null };
    };
  };
  if (!body.success) return null;
  const data = source === "komikindo" ? body.data : body;
  if (!data) return null;
  return {
    title: data.title ?? chapterId,
    images: parseImages(data.images),
    next: data.navigation?.next ?? null,
    prev: data.navigation?.prev ?? null,
  };
}
