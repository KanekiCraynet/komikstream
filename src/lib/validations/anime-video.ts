import { z } from "zod";

// ─── GET /api/anime/video ──────────────────────────────────────────

export const animeVideoParamsSchema = z.object({
  episodeId: z.string().min(1, "episodeId is required").max(500),
  quality: z.string().max(20).default("480p"),
});

export type AnimeVideoParams = z.infer<typeof animeVideoParamsSchema>;
