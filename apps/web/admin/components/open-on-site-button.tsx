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
    <>
      <Button
        el="anchor"
        url={url}
        newTab
        buttonStyle="secondary"
        size="medium"
        margin={false}
        className="open-on-site-btn"
        extraButtonProps={{ title: "Åpne på nettsiden" }}
      >
        Åpne på nettsiden
      </Button>
      {/* Payload gir bare `button` nowrap i dokument-headeren — en <a class="btn">
          er inline-block og bryter over flere linjer. Gjør den lik de andre. */}
      <style>{`
        .doc-controls a.btn.open-on-site-btn {
          display: inline-flex;
          align-items: center;
          flex-shrink: 1;
          min-width: 0;
          max-width: calc(var(--base) * 10);
          white-space: nowrap;
        }
        .open-on-site-btn .btn__content,
        .open-on-site-btn .btn__label {
          display: block;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      `}</style>
    </>
  );
}
