import { Button, Section, Text } from "@react-email/components";
import * as React from "react";
import { EmailShell, emailStyles } from "./_layout";

export interface ContactNotificationProps {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  /** Intern sporing: hvor henvendelsen ble sendt fra. */
  source?: string;
  sourcePath?: string;
}

/** Varsel til Poynt når noen sender inn kontaktskjemaet. */
export default function ContactNotificationEmail({
  name,
  email,
  phone,
  subject,
  message,
  source,
  sourcePath,
}: ContactNotificationProps) {
  return (
    <EmailShell preview={`Ny henvendelse fra ${name}`}>
      <Text style={emailStyles.eyebrow}>Ny henvendelse</Text>
      <Text style={emailStyles.heading}>Noen vil i kontakt</Text>
      <Text style={emailStyles.text}>
        Du har fått en ny melding via kontaktskjemaet på poynt.no.
      </Text>

      <Section>
        <Text style={emailStyles.label}>Navn</Text>
        <Text style={emailStyles.value}>{name}</Text>

        <Text style={emailStyles.label}>E-post</Text>
        <Text style={emailStyles.value}>{email}</Text>

        {phone ? (
          <>
            <Text style={emailStyles.label}>Telefon</Text>
            <Text style={emailStyles.value}>{phone}</Text>
          </>
        ) : null}

        {subject ? (
          <>
            <Text style={emailStyles.label}>Hva gjelder det</Text>
            <Text style={emailStyles.value}>{subject}</Text>
          </>
        ) : null}

        <Text style={emailStyles.label}>Melding</Text>
        <Text style={emailStyles.quote}>{message}</Text>

        {source || sourcePath ? (
          <>
            <Text style={emailStyles.label}>Sendt fra</Text>
            <Text style={emailStyles.value}>
              {[source, sourcePath].filter(Boolean).join(" · ")}
            </Text>
          </>
        ) : null}
      </Section>

      <Section style={{ marginTop: "24px" }}>
        <Button style={emailStyles.button} href={`mailto:${email}`}>
          Svar til {name}
        </Button>
      </Section>
    </EmailShell>
  );
}
