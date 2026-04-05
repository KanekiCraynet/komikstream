"use client";

import dynamic from "next/dynamic";
import { type ReactNode } from "react";

interface ThemeProviderProps {
  children: ReactNode;
}

// Lazily load next-themes' ThemeProvider on the client only.
// next-themes@0.4.6 calls useContext() inside its ThemeProvider component
// to detect nested providers. During SSG prerendering in Next.js 16 + React 19,
// React's internal dispatcher is null, causing:
//   TypeError: Cannot read properties of null (reading 'useContext')
// See: https://github.com/vercel/next.js/issues/74616
//
// Using next/dynamic with ssr:false ensures the provider is never rendered
// during static generation, avoiding the crash entirely.
const NextThemesProvider = dynamic(() => import("next-themes").then((mod) => mod.ThemeProvider), {
  ssr: false,
});

export function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
