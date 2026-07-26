"use client";

import { Button, useDrawerSlug, useModal } from "@payloadcms/ui";
import { useRouter } from "next/navigation";
import { StockPickerDrawer } from "./stock-picker-modal";

/**
 * «Finn gratisbilde» — knapp + Payload-skuff som brukes over Media-lista og
 * øverst i media-skjemaet (ui-felt). Importerte bilder havner i
 * Media-collection. Auto-velg rett inn i et bildefelt håndteres av
 * `StockFieldButton`.
 */
export const StockMediaPicker = () => {
  const router = useRouter();
  const { openModal } = useModal();
  const drawerSlug = useDrawerSlug("stock-picker");

  return (
    <div style={{ marginBottom: "1rem" }}>
      <Button
        buttonStyle="pill"
        size="small"
        margin={false}
        onClick={() => openModal(drawerSlug)}
      >
        Finn gratisbilde
      </Button>

      <StockPickerDrawer
        drawerSlug={drawerSlug}
        mode="library"
        onImported={() => router.refresh()}
      />
    </div>
  );
};
