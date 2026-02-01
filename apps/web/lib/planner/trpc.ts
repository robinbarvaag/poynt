"use client";

import type { AppRouter } from "@poynt/planner-api";
import { createTRPCClient, httpBatchLink } from "@trpc/client";

function getBaseUrl() {
  if (typeof window !== "undefined") {
    // Browser should use relative path
    return "";
  }

  // SSR should use absolute url
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

export const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${getBaseUrl()}/on-poynt/api/trpc`,
    }),
  ],
});
