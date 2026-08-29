"use client";

import { RefreshRouteOnSave as PayloadRefresh } from "@payloadcms/live-preview-react";
import { useRouter } from "next/navigation";

/**
 * Lytter på Payloads live-preview-meldinger fra admin-iframen og refresher
 * server-komponentene når et utkast autosaves — så forhåndsvisningen følger
 * med mens redaktøren skriver. Kun brukt på /forhandsvisning.
 */
export function RefreshOnSave() {
  const router = useRouter();
  return (
    <PayloadRefresh
      refresh={() => router.refresh()}
      serverURL={process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}
    />
  );
}
