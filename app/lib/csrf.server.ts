/** Reject cross-site browser mutations using Origin, with Referer fallback. */
export function requireSameOrigin(request: Request): Response | null {
  const requestOrigin = new URL(request.url).origin;
  const origin = request.headers.get("origin");
  if (origin) {
    return origin === requestOrigin
      ? null
      : new Response("Cross-origin request denied", { status: 403 });
  }

  const referer = request.headers.get("referer");
  if (referer) {
    try {
      if (new URL(referer).origin === requestOrigin) return null;
    } catch {
      return new Response("Invalid referer", { status: 403 });
    }
  }
  return new Response("Origin required", { status: 403 });
}