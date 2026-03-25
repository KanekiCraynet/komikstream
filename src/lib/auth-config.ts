// Check if Clerk is properly configured (single source of truth)
export function isClerkConfigured(): boolean {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const secretKey = process.env.CLERK_SECRET_KEY;

  // Check if keys exist
  if (!publishableKey) return false;
  if (!secretKey) return false;

  // Reject known placeholder/dummy values
  if (publishableKey === "pk_test_placeholder" || publishableKey === "pk_test_dummy") return false;
  if (secretKey === "sk_test_placeholder" || secretKey === "sk_test_dummy") return false;

  // Validate key prefixes
  if (!publishableKey.startsWith("pk_")) return false;
  if (!secretKey.startsWith("sk_")) return false;

  // Reject any key with "dummy" or "placeholder" in the third segment
  const pubParts = publishableKey.split("_");
  const secParts = secretKey.split("_");
  if (pubParts.length < 3 || secParts.length < 3) return false;
  if (
    pubParts[2] === "dummy" ||
    pubParts[2] === "placeholder" ||
    secParts[2] === "dummy" ||
    secParts[2] === "placeholder"
  )
    return false;

  // Warn in development if production keys are used (will cause origin mismatch)
  if (process.env.NODE_ENV === "development" && publishableKey.startsWith("pk_live_")) {
    console.warn(
      "[auth] Production Clerk keys detected in development.\n" +
        "This will fail with an origin mismatch error. Use pk_test_* / sk_test_* keys in .env for local dev."
    );
  }

  return true;
}

// Export for use in components
export const CLERK_ENABLED = typeof process !== "undefined" && isClerkConfigured();
