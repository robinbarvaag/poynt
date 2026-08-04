import { Section, Text } from "@react-email/components";
import * as React from "react";
import { EmailShell, emailStyles } from "./_layout";
import { RichContent } from "./rich-content";

export interface NewsletterSignupNotificationProps {
  email: string;
  /** Hvor påmeldingen kom fra, f.eks. «nyhetsbrev-skjema» eller «utsjekk». */
  source?: string;
  /**
   * Admin-redigert innledning (E-postmaler) — erstatter overskrift og intro.
   * Detaljene under legges alltid på automatisk.
   */
  introHtml?: string;
}

/** Internt varsel til Poynt når noen melder seg på nyhetsbrevet. */
export default function NewsletterSignupNotificationEmail({
  email,
  source,
  introHtml,
}: NewsletterSignupNotificationProps) {
  return (
    <EmailShell preview={`Ny på nyhetsbrevet: ${email}`}>
      {introHtml ? (
        <RichContent html={introHtml} />
      ) : (
        <>
          <Text style={emailStyles.eyebrow}>Nyhetsbrev</Text>
          <Text style={emailStyles.heading}>Ny påmelding</Text>
          <Text style={emailStyles.text}>
            Noen har meldt seg på nyhetsbrevet på poynt.no.
          </Text>
        </>
      )}

      <Section>
        <Text style={emailStyles.label}>E-post</Text>
        <Text style={emailStyles.value}>{email}</Text>

        {source ? (
          <>
            <Text style={emailStyles.label}>Meldt på via</Text>
            <Text style={emailStyles.value}>{source}</Text>
          </>
        ) : null}
      </Section>
    </EmailShell>
  );
}
