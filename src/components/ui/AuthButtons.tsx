"use client";

import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { LogIn } from "lucide-react";

interface AuthButtonsProps {
  clerkEnabled: boolean;
}

export function AuthButtons({ clerkEnabled }: AuthButtonsProps) {
  // If Clerk is not enabled, show a simple login link
  if (!clerkEnabled) {
    return (
      <Link href="/sign-in">
        <Button variant="ghost" size="icon" className="flex md:hidden" aria-label="Masuk">
          <LogIn className="h-5 w-5" />
        </Button>
        <Button variant="outline" size="sm" className="hidden gap-2 md:flex">
          <LogIn className="h-4 w-4" />
          Masuk
        </Button>
      </Link>
    );
  }

  // Clerk is enabled, use Clerk components
  return (
    <>
      <SignedOut>
        <SignInButton mode="modal">
          <Button variant="ghost" size="icon" className="flex md:hidden" aria-label="Masuk">
            <LogIn className="h-5 w-5" />
          </Button>
        </SignInButton>
        <SignInButton mode="modal">
          <Button variant="default" size="sm" className="hidden md:flex">
            Masuk
          </Button>
        </SignInButton>
      </SignedOut>
      <SignedIn>
        <UserButton
          afterSignOutUrl="/"
          appearance={{
            elements: {
              avatarBox: "h-9 w-9",
            },
          }}
        />
      </SignedIn>
    </>
  );
}
