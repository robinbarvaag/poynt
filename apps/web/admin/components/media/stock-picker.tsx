"use client";

import { useDrawerSlug, useModal } from "@payloadcms/ui";
import { useRouter } from "next/navigation";
import { StockPickerDrawer } from "./stock-picker-modal";

/**
 * «Finn bilde» — knapp + Payload-skuff som brukes over Media-lista og øverst i
 * media-skjemaet (ui-felt). Importerte bilder havner i Media-collection.
 * Auto-velg rett inn i et bildefelt håndteres av `StockFieldButton`.
 */
export const StockMediaPicker = () => {
  const router = useRouter();
  const { openModal } = useModal();
  const drawerSlug = useDrawerSlug("stock-picker");

  return (
    <div style={{ marginBottom: "1rem" }}>
      <button
        type="button"
        onClick={() => openModal(drawerSlug)}
        className="btn btn--style-secondary btn--size-medium"
        style={{ display: "inline-flex", alignItems: "center", gap: "0.45rem" }}
      >
        <span aria-hidden>🔍</span> Finn bilde (Pexels / Giphy)
      </button>

      <StockPickerDrawer
        drawerSlug={drawerSlug}
        mode="library"
        onImported={() => router.refresh()}
      />
    </div>
  );
};
