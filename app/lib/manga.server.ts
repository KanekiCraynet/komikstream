export function parseImages(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (x): x is string => typeof x === "string" && x.length > 0,
  );
}

export async function fetchSankaChapter(chapterId: string) {
  const response = await fetch(
    `https://www.sankavollerei.web.id/comic/bacakomik/chapter/${encodeURIComponent(chapterId)}`,
    { headers: { "user-agent": "KomikStream development reader" } },
  );
  if (!response.ok) return null;
  const body = (await response.json()) as {
    success?: boolean;
    title?: string;
    images?: unknown;
    navigation?: { next?: string | null; prev?: string | null };
  };
  if (!body.success) return null;
  return {
    title: body.title ?? chapterId,
    images: parseImages(body.images),
    next: body.navigation?.next ?? null,
    prev: body.navigation?.prev ?? null,
  };
}
