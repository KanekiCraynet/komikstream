export async function upsertHistory(contentId: string, lastPage: number) {
  await fetch("/api/history", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ contentId, lastPage }),
  });
}
