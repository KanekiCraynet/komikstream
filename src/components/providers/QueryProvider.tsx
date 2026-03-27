"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";

/** Shared QueryClient factory — used by both the client provider and server-side prefetching. */
export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Keep data fresh for 10 minutes (reduces refetches)
        staleTime: 10 * 60 * 1000,
        // Garbage collect after 30 minutes (prevents memory leaks)
        gcTime: 30 * 60 * 1000,
        // Don't refetch on window focus (reduces API calls)
        refetchOnWindowFocus: false,
        // Don't refetch on reconnect (we have ISR caching)
        refetchOnReconnect: false,
        // Retry once on failure
        retry: 1,
        // Retry delay with exponential backoff
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
      },
      mutations: {
        // Retry mutations once
        retry: 1,
      },
    },
  });
}

interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(() => makeQueryClient());

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
