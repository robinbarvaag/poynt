"use client";

import { Button, useDocumentInfo, useFormFields } from "@payloadcms/ui";
import { getPublicUrl } from "../../lib/public-path";

/**
 * «Åpne på nettsiden»-knapp i dokument-headeren. I motsetning til
 * «Preview» (som går via /api/preview og draft mode) åpner denne den
 * publiserte, offentlige URL-en i ny fane — nøyaktig slik besøkende ser den.
 * Montert via `admin.components.edit.beforeDocumentControls`.
 */
export function OpenOnSiteButton() {
  const { collectionSlug, id } = useDocumentInfo();
  const slug = useFormFields(
    ([fields]) => fields?.slug?.value as string | undefined
  );

  if (!id || !collectionSlug) return null;
  const url = getPublicUrl(collectionSlug, slug);
  if (!url) return null;

  return (
    <Button
      el="anchor"
      url={url}
      newTab
      buttonStyle="secondary"
      size="medium"
      margin={false}
    >
      Åpne på nettsiden
    </Button>
  );
}
