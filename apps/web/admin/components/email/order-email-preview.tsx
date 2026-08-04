"use client";

import { useFormFields } from "@payloadcms/ui";
import { useMemo } from "react";
import { PreviewFrame, useEmailPreview } from "./preview-frame";

/**
 * Live forhåndsvisning av ordrebekreftelsen, rett under tekstfeltene i
 * «Kasse og kvittering» → Ordrebekreftelse (e-post). Ordrenummer og
 * produktliste er eksempeldata; tekstene er dine egne, også ulagrede.
 */
export const OrderEmailPreview = () => {
  const subject = useFormFields(
    ([fields]) => fields.emailSubject?.value as string | undefined
  );
  const heading = useFormFields(
    ([fields]) => fields.emailHeading?.value as string | undefined
  );
  const intro = useFormFields(
    ([fields]) => fields.emailIntro?.value as string | undefined
  );
  const pdfNote = useFormFields(
    ([fields]) => fields.emailPdfNote?.value as string | undefined
  );
  const footer = useFormFields(
    ([fields]) => fields.emailFooter?.value as string | undefined
  );

  const request = useMemo(
    () => ({ kind: "order", subject, heading, intro, pdfNote, footer }),
    [subject, heading, intro, pdfNote, footer]
  );

  const {
    html,
    subject: renderedSubject,
    error,
    loading,
  } = useEmailPreview(request);

  return (
    <PreviewFrame
      html={html}
      subject={renderedSubject}
      loading={loading}
      error={error}
      title="Forhåndsvisning av ordrebekreftelsen"
    />
  );
};
