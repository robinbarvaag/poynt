"use client";

import { useDrawerSlug, useField, useModal } from "@payloadcms/ui";
import { StockPickerDrawer } from "./stock-picker-modal";

/**
 * «Finn gratis bilde»-knapp rett under et upload-felt (montert som
 * `admin.components.afterInput`). Søker i Pexels/Giphy, importerer valgt bilde
 * til Media, og setter feltverdien til det nye mediet — så bildet auto-velges
 * inn i feltet. `path` kommer fra Payloads felt-clientProps.
 */
export const StockFieldButton = ({ path }: { path: string }) => {
  const { setValue } = useField<string | number>({ path });
  const { openModal } = useModal();
  const drawerSlug = useDrawerSlug(`stock-field-${path}`);

  return (
    <div style={{ marginTop: "0.5rem" }}>
      <button
        type="button"
        onClick={() => openModal(drawerSlug)}
        className="btn btn--style-secondary btn--size-small"
        style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
      >
        <span aria-hidden>🔍</span> Finn gratis bilde (Pexels / Giphy)
      </button>

      <StockPickerDrawer
        drawerSlug={drawerSlug}
        mode="select"
        onImported={(res) => setValue(res.id)}
      />
    </div>
  );
};
