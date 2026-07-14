import { z } from 'zod';

export const KomikSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  genres: z.array(z.string()).optional(),
  chapters: z.array(z.object({
    id: z.string(),
    title: z.string().optional(),
    images: z.array(z.string()).optional(),
  })).optional(),
});

// ponytail: skipped advanced sanitization, add when need strict image URL validation.
