import { Section, Text } from "@react-email/components";
import * as React from "react";
import { EmailShell, emailStyles } from "./_layout";
import { RichContent } from "./rich-content";

export interface ContactConfirmationProps {
  name: string;
  message: string;
  /** Admin-redigert innhold (E-postmaler) — erstatter hele standardteksten. */
  contentHtml?: string;
}

/** Bekreftelse til den som sendte inn kontaktskjemaet. */
export default function ContactConfirmationEmail({
  name,
  message,
  contentHtml,
}: ContactConfirmationProps) {
  if (contentHtml) {
    return (
      <EmailShell preview="Takk for din henvendelse – jeg svarer så snart jeg kan.">
        <RichContent html={contentHtml} />
      </EmailShell>
    );
  }
  return (
    <EmailShell preview="Takk for din henvendelse – jeg svarer så snart jeg kan.">
      <Text style={emailStyles.eyebrow}>Bekreftelse</Text>
      <Text style={emailStyles.heading}>Takk for din henvendelse!</Text>
      <Text style={emailStyles.text}>Hei {name},</Text>
      <Text style={emailStyles.text}>
        Tusen takk for at du tok kontakt. Jeg har mottatt meldingen din og
        svarer så snart jeg kan – vanligvis innen et par dager.
      </Text>

      <Section>
        <Text style={emailStyles.label}>Dette skrev du</Text>
        <Text style={emailStyles.quote}>{message}</Text>
      </Section>

      <Text style={{ ...emailStyles.text, marginTop: "24px" }}>
        Vennlig hilsen,
        <br />
        Susanne Todnem · Poynt
      </Text>
    </EmailShell>
  );
}
