import { createClerkClient } from "@clerk/react-router/api.server";
import {
  clerkMiddleware,
  getAuth,
  rootAuthLoader,
} from "@clerk/react-router/server";
import { redirect, type LoaderFunctionArgs } from "react-router";
import { prisma } from "~/lib/db.server";

export { clerkMiddleware, getAuth, rootAuthLoader };

export const clerkEnabled = Boolean(
  process.env.CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY,
);

type AuthArgs = Parameters<typeof getAuth>[0];

export async function requireAuth(args: LoaderFunctionArgs) {
  const auth = await getAuth(args as AuthArgs);
  if (!auth.userId) throw redirect("/sign-in");
  return auth;
}

/** Clerk userId -> local DB user id (upsert, refresh lastSeenAt). Null when guest/disabled. */
export async function getCurrentUserId(args: AuthArgs): Promise<string | null> {
  if (!clerkEnabled) return null;
  const auth = await getAuth(args).catch(() => null);
  if (!auth?.userId) return null;

  let email = `${auth.userId}@clerk.local`;
  try {
    const clerk = createClerkClient({
      secretKey: process.env.CLERK_SECRET_KEY,
    });
    const user = await clerk.users.getUser(auth.userId);
    email = user.emailAddresses[0]?.emailAddress ?? email;
  } catch {
    // keep fallback email
  }

  const dbUser = await prisma.user.upsert({
    where: { clerkId: auth.userId },
    update: { email, lastSeenAt: new Date() },
    create: { clerkId: auth.userId, email },
    select: { id: true },
  });
  return dbUser.id;
}

export async function requireCurrentUserId(args: AuthArgs): Promise<string> {
  const id = await getCurrentUserId(args);
  if (!id) throw new Error(clerkEnabled ? "UNAUTHORIZED" : "AUTH_DISABLED");
  return id;
}
