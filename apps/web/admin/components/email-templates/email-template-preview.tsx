"use client";

import { useFormFields } from "@payloadcms/ui";
import { useMemo } from "react";
import { PreviewFrame, useEmailPreview } from "../email/preview-frame";

/**
 * «Forhåndsvisning»-fanen på et E-postmaler-dokument: viser malen nøyaktig
 * slik den sendes (samme render-løype som utsendingen), live mens partneren
 * skriver, med eksempeldata i flettefeltene. Faste deler (knapper,
 * ordredetaljer osv.) legges på automatisk — akkurat som ved sending.
 */
export const EmailTemplatePreview = () => {
  const templateKey = useFormFields(
    ([fields]) => fields.templateKey?.value as string | undefined
  );
  const subject = useFormFields(
    ([fields]) => fields.subject?.value as string | undefined
  );
  const body = useFormFields(([fields]) => fields.body?.value);

  const request = useMemo(
    () =>
      templateKey ? { kind: "template", templateKey, subject, body } : null,
    [templateKey, subject, body]
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
      emptyText="Skriv litt innhold i «Innhold»-fanen, så dukker forhåndsvisningen opp her."
      title="Forhåndsvisning av e-postmalen"
    />
  );
};
