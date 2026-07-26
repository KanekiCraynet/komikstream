export function parseImages(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (x): x is string => typeof x === "string" && x.length > 0,
  );
}
