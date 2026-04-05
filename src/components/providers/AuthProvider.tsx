"use client";

import { ClerkProvider, useAuth as useClerkAuth } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { useTheme } from "next-themes";
import { createContext, useContext, useSyncExternalStore, type ReactNode } from "react";

// ── Auth context ──────────────────────────────────────────────────────
// Exposes a minimal { isSignedIn, isLoaded } contract that works
// regardless of whether Clerk is configured.  Components such as
// useSync consume this context instead of importing useAuth from
// @clerk/nextjs directly, which would throw when ClerkProvider is
// absent from the tree.

export interface AuthState {
  isSignedIn: boolean;
  isLoaded: boolean;
}

const AuthContext = createContext<AuthState>({
  isSignedIn: false,
  isLoaded: true,
});

/**
 * Safe replacement for Clerk's useAuth().
 * Returns { isSignedIn, isLoaded } from the nearest AuthProvider.
 * Never throws, even when Clerk is not configured.
 */
export function useAuthState(): AuthState {
  return useContext(AuthContext);
}

// ── Internal helpers ──────────────────────────────────────────────────

interface AuthProviderProps {
  children: ReactNode;
  clerkEnabled: boolean;
}

/**
 * Bridges Clerk's useAuth() into our AuthContext so downstream
 * consumers don't need a direct Clerk dependency.
 */
function ClerkAuthBridge({ children }: { children: ReactNode }) {
  const { isSignedIn, isLoaded } = useClerkAuth();
  return (
    <AuthContext.Provider value={{ isSignedIn: isSignedIn ?? false, isLoaded }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hydration-safe mounted check using useSyncExternalStore (no setState in effect)
const noop = () => () => {};
const getMounted = () => true;
const getServerMounted = () => false;

/**
 * Derives the Clerk appearance from the current next-themes theme.
 *
 * useTheme() is safe to call here because ThemeProvider is loaded via
 * next/dynamic with ssr:false, so this component only renders on the
 * client where React's dispatcher is available.
 *
 * See: https://github.com/vercel/next.js/issues/74616
 */
function useClerkAppearance() {
  const { resolvedTheme } = useTheme();
  const mounted = useSyncExternalStore(noop, getMounted, getServerMounted);

  return {
    baseTheme: mounted && resolvedTheme === "dark" ? dark : undefined,
    variables: {
      colorPrimary: "hsl(263 70% 50%)",
    },
  };
}

function ClerkProviderWithTheme({ children }: { children: ReactNode }) {
  const appearance = useClerkAppearance();

  // NOTE: publishableKey must be passed explicitly here.
  // In @clerk/nextjs@6 (App Router), ClerkProvider used inside a "use client"
  // component does NOT automatically read NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY from
  // process.env. Without an explicit prop, Clerk enters "keyless mode" and calls
  // the createOrReadKeylessAction Server Action, which fails in the Cloudflare
  // Workers runtime, throwing "Missing publishableKey". Passing the prop uses
  // Next.js's static NEXT_PUBLIC_* build-time replacement, bypassing keyless mode.
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      proxyUrl={process.env.NEXT_PUBLIC_CLERK_PROXY_URL}
      appearance={appearance}
      signInFallbackRedirectUrl="/"
      signUpFallbackRedirectUrl="/"
    >
      <ClerkAuthBridge>{children}</ClerkAuthBridge>
    </ClerkProvider>
  );
}

export function AuthProvider({ children, clerkEnabled }: AuthProviderProps) {
  // If Clerk is not configured, provide a static "not signed in" context
  if (!clerkEnabled) {
    return (
      <AuthContext.Provider value={{ isSignedIn: false, isLoaded: true }}>
        {children}
      </AuthContext.Provider>
    );
  }

  return <ClerkProviderWithTheme>{children}</ClerkProviderWithTheme>;
}
