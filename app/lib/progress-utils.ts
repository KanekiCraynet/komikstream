export function clampPage(
  stored: number | undefined | null,
  totalImages: number,
): number {
  if (totalImages < 1) return 0;
  return Math.min(Math.max(stored ?? 0, 0), totalImages - 1);
}
