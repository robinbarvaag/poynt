import { Button, Section, Text } from "@react-email/components";
import * as React from "react";
import { EmailShell, emailStyles } from "./_layout";

export interface PasswordResetEmailProps {
  url: string;
  /** Visningsnavn på mottakeren (valgfritt). */
  name?: string;
}

/** Tilbakestilling av passord for Poynt-admin (Payload). */
export default function PasswordResetEmail({
  url,
  name,
}: PasswordResetEmailProps) {
  return (
    <EmailShell preview="Tilbakestill passordet ditt for Poynt-admin">
      <Text style={emailStyles.eyebrow}>Admin</Text>
      <Text style={emailStyles.heading}>Tilbakestill passordet ditt</Text>
      {name ? <Text style={emailStyles.text}>Hei {name},</Text> : null}
      <Text style={emailStyles.text}>
        Vi mottok en forespørsel om å tilbakestille passordet til admin-kontoen
        din. Klikk på knappen under for å velge et nytt passord.
      </Text>

      <Section style={{ margin: "8px 0 24px" }}>
        <Button href={url} style={emailStyles.button}>
          Velg nytt passord
        </Button>
      </Section>

      <Text style={{ ...emailStyles.text, fontSize: "13px", color: "#29664f" }}>
        Hvis du ikke ba om dette, kan du trygt ignorere e-posten – passordet
        ditt forblir uendret.
      </Text>
    </EmailShell>
  );
}
