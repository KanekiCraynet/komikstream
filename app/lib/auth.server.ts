import {
  clerkMiddleware,
  getAuth,
  rootAuthLoader,
} from "@clerk/react-router/server";
import { redirect, type LoaderFunctionArgs } from "react-router";

export { clerkMiddleware, getAuth, rootAuthLoader };

export async function requireAuth(args: LoaderFunctionArgs) {
  const auth = await getAuth(args);
  if (!auth.userId) throw redirect("/sign-in");
  return auth;
}
