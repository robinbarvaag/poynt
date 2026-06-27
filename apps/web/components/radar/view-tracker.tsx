"use client";

import { useEffect } from "react";

/**
 * Usynlig visnings-beacon (Fase 4). Sender én telling per innhold per
 * nettlesersesjon (dedup via sessionStorage), så remount/navigasjon frem og
 * tilbake ikke blåser opp tallene. Render den øverst i en innholds-detaljside.
 * Se docs/CONTENT-RADAR.md.
 */
export function ViewTracker({
  collection,
  contentId,
  slug,
}: {
  collection: string;
  contentId: string;
  slug?: string;
}) {
  useEffect(() => {
    const key = `poynt-view:${collection}:${contentId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // sessionStorage utilgjengelig (privat modus e.l.) → tell uansett.
    }

    const payload = JSON.stringify({ collection, contentId, slug });
    // sendBeacon overlever sidenavigasjon; fall tilbake til fetch keepalive.
    try {
      const blob = new Blob([payload], { type: "application/json" });
      if (navigator.sendBeacon?.("/api/radar/track", blob)) return;
    } catch {
      // faller gjennom til fetch
    }
    void fetch("/api/radar/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => {});
  }, [collection, contentId, slug]);

  return null;
}
