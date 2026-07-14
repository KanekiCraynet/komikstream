import { z } from 'zod';

export const UserPreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  language: z.enum(['id', 'en', 'ja', 'ko']).optional(),
  notifications: z.enum(['all', 'comments', 'mentions', 'none']).default('all'),
});

export const UserSchema = z.object({
  id: z.string().cuid(),
  clerkId: z.string().min(1),
  email: z.string().email(),
  tier: z.enum(['free', 'premium']).default('free'),
  preferences: UserPreferencesSchema.optional(),
  lastSeenAt: z.date().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});