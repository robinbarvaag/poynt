import { Button, Section, Text } from "@react-email/components";
import * as React from "react";
import { EmailShell, emailStyles } from "./_layout";

export interface MagicLinkEmailProps {
  url: string;
  /** Minutter til lenken utløper (default 10). */
  expiresInMinutes?: number;
}

/** Magisk innloggingslenke for On Poynt-medlemmer. */
export default function MagicLinkEmail({
  url,
  expiresInMinutes = 10,
}: MagicLinkEmailProps) {
  return (
    <EmailShell preview="Din innloggingslenke til On Poynt">
      <Text style={emailStyles.eyebrow}>Innlogging</Text>
      <Text style={emailStyles.heading}>Logg inn på On Poynt</Text>
      <Text style={emailStyles.text}>
        Klikk på knappen under for å logge inn. Lenken er personlig – ikke del
        den med andre.
      </Text>

      <Section style={{ margin: "8px 0 24px" }}>
        <Button href={url} style={emailStyles.button}>
          Logg inn
        </Button>
      </Section>

      <Text style={{ ...emailStyles.text, fontSize: "13px", color: "#29664f" }}>
        Lenken utløper om {expiresInMinutes} minutter. Hvis du ikke ba om denne
        e-posten, kan du trygt ignorere den.
      </Text>
    </EmailShell>
  );
}
