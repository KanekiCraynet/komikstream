import { SignUp } from "@clerk/react-router";
import type { Route } from "./+types/sign-up";
import { clerkEnabled } from "~/lib/auth.server";

export function meta() {
  return [{ title: "Sign up — KomikStream" }];
}

export async function loader(_args: Route.LoaderArgs) {
  return { enabled: clerkEnabled };
}

export default function SignUpPage({ loaderData }: Route.ComponentProps) {
  if (!loaderData.enabled) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-gray-400">Sign-up is currently disabled.</p>
      </main>
    );
  }
  return (
    <main className="flex min-h-screen items-center justify-center">
      <SignUp />
    </main>
  );
}
