export async function upsertHistory(contentId: string, lastPage: number) {
  const response = await fetch("/api/history", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ contentId, lastPage }),
  });
  if (!response.ok) throw new Error(`History sync failed: ${response.status}`);
}
