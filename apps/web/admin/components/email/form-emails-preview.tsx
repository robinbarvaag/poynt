"use client";

import { useFormFields } from "@payloadcms/ui";
import { useMemo } from "react";
import { PreviewFrame, useEmailPreview } from "./preview-frame";

/**
 * Live forhåndsvisning av skjemaets e-poster («E-poster ved innsending»),
 * rett under feltene på skjema-dokumentet. Viser hver e-post i Poynt-ramma
 * slik den faktisk sendes, med eksempeldata i {{flettefeltene}}.
 */

function SingleEmailPreview({
  subject,
  message,
}: {
  subject?: string;
  message?: unknown;
}) {
  const request = useMemo(
    () => ({ kind: "form", subject, message }),
    [subject, message]
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
      title="Forhåndsvisning av skjema-e-posten"
    />
  );
}

export const FormEmailsPreview = () => {
  // Radene i emails-arrayet ligger flatt i form-staten som
  // «emails.0.subject», «emails.0.message» osv.
  const entries = useFormFields(([fields]) => {
    const result: { subject?: string; message?: unknown }[] = [];
    for (let index = 0; ; index++) {
      const subjectField = fields[`emails.${index}.subject`];
      const messageField = fields[`emails.${index}.message`];
      if (!subjectField && !messageField) break;
      result.push({
        subject: subjectField?.value as string | undefined,
        message: messageField?.value,
      });
    }
    return result;
  });

  if (!entries.length) {
    return (
      <p style={{ color: "var(--theme-elevation-500)", fontSize: "0.85rem" }}>
        Skjemaet har ingen e-poster ennå. Legg til en under «E-poster»-fanen, så
        dukker forhåndsvisningen opp her.
      </p>
    );
  }

  return (
    <div>
      {entries.map((entry, index) => (
        <SingleEmailPreview
          // biome-ignore lint/suspicious/noArrayIndexKey: radene har ingen stabil id i form-staten
          key={index}
          subject={entry.subject}
          message={entry.message}
        />
      ))}
    </div>
  );
};
