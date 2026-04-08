/**
 * Sansekai API Client
 *
 * Generic JSON fetcher for api.sansekai.my.id with ISR caching
 * and a single 429 retry. All anime/komik modules use this.
 */

const SANSEKAI_BASE = (process.env.SANSEKAI_BASE_URL ?? "https://api.sansekai.my.id/api").replace(
  /\/$/,
  ""
);

export async function fetchSansekai<T>(path: string, revalidate: number): Promise<T> {
  const url = `${SANSEKAI_BASE}${path}`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    next: { revalidate },
  });

  if (res.status === 429) {
    await new Promise((r) => setTimeout(r, 2000));
    const retry = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate },
    });
    if (!retry.ok) throw new Error(`Sansekai ${retry.status}: ${path}`);
    return retry.json();
  }

  if (!res.ok) throw new Error(`Sansekai ${res.status}: ${path}`);
  return res.json();
}
