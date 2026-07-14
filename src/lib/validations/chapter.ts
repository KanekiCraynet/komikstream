import { z } from 'zod';

export const ChapterImagesSchema = z.object({
  images: z.array(z.string().url()).nonempty(),
});

export const ChapterSchema = z.object({
  id: z.string().min(1),
  title: z.string().optional(),
  images: ChapterImagesSchema.shape.images,
});

// ponytail: skipped chapter title sanitization, add when need.
