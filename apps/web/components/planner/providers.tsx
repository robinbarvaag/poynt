"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

/**
 * Klient-providers for on-poynt-appen. QueryClientProvider gjør react-query
 * (allerede installert) tilgjengelig for alle verktøy — generering, lagring og
 * etter hvert caching av profil/bransjer/lister via `useQuery`/`useMutation`.
 */
export function PlannerProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
