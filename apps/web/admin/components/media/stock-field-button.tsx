"use client";

import { Button, useDrawerSlug, useField, useModal } from "@payloadcms/ui";
import { StockPickerDrawer } from "./stock-picker-modal";

/**
 * «Finn gratisbilde»-knapp rett under et upload-felt (montert som
 * `admin.components.afterInput`). Søker i Pexels/Giphy, importerer valgt bilde
 * til Media, og setter feltverdien til det nye mediet — så bildet auto-velges
 * inn i feltet. `path` kommer fra Payloads felt-clientProps.
 *
 * Bruker Payloads egen `Button` med pill-stil, samme som upload-feltets
 * innebygde «Opprett ny» / «Velg fra eksisterende», så den ser hjemmehørende ut.
 */
export const StockFieldButton = ({ path }: { path: string }) => {
  const { setValue } = useField<string | number>({ path });
  const { openModal } = useModal();
  const drawerSlug = useDrawerSlug(`stock-field-${path}`);

  return (
    <div style={{ marginTop: "0.5rem" }}>
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
        mode="select"
        onImported={(res) => setValue(res.id)}
      />
    </div>
  );
};
