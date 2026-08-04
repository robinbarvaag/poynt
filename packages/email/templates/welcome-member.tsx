import { Button, Section, Text } from "@react-email/components";
import * as React from "react";
import { EmailShell, brand, emailStyles } from "./_layout";
import { RichContent } from "./rich-content";

interface WelcomeMemberEmailProps {
  memberName: string;
  tier: "Community" | "Community + AI";
  onboardingUrl: string;
  /**
   * Admin-redigert innhold (E-postmaler) — erstatter standardteksten.
   * «Kom i gang»-knappen (med riktig lenke) legges alltid på til slutt.
   */
  contentHtml?: string;
}

/** Velkomst til nye On Poynt-medlemmer — samme Poynt-drakt som resten. */
export default function WelcomeMemberEmail({
  memberName,
  tier,
  onboardingUrl,
  contentHtml,
}: WelcomeMemberEmailProps) {
  if (contentHtml) {
    return (
      <EmailShell preview="Velkommen til On Poynt — la oss komme i gang!">
        <RichContent html={contentHtml} />
        <Section style={{ margin: "16px 0 8px" }}>
          <Button href={onboardingUrl} style={emailStyles.button}>
            Kom i gang
          </Button>
        </Section>
      </EmailShell>
    );
  }
  return (
    <EmailShell preview="Velkommen til On Poynt — la oss komme i gang!">
      <Text style={emailStyles.eyebrow}>Medlemskap · {tier}</Text>
      <Text style={emailStyles.heading}>Velkommen til On Poynt!</Text>
      <Text style={emailStyles.text}>Hei {memberName},</Text>
      <Text style={emailStyles.text}>
        Så gøy at du er med! Du har nå tilgang til hele On Poynt — verktøyene,
        planene og fellesskapet som gjør markedsføringen litt enklere å faktisk
        få gjort.
      </Text>

      <Section
        style={{
          backgroundColor: brand.panel,
          borderRadius: "14px",
          padding: "18px 20px",
          margin: "0 0 24px",
        }}
      >
        <Text style={{ ...emailStyles.label, margin: "0 0 8px" }}>
          Dette venter på deg
        </Text>
        <Text style={{ ...emailStyles.text, margin: "0 0 6px" }}>
          → En kort onboarding som blir kjent med bedriften din
        </Text>
        <Text style={{ ...emailStyles.text, margin: "0 0 6px" }}>
          → Verktøy for kanalvalg, markedsplan og årshjul
        </Text>
        <Text style={{ ...emailStyles.text, margin: 0 }}>
          → Et fellesskap av folk som står i det samme som deg
        </Text>
      </Section>

      <Section style={{ margin: "8px 0 24px" }}>
        <Button href={onboardingUrl} style={emailStyles.button}>
          Kom i gang
        </Button>
      </Section>

      <Text style={{ ...emailStyles.text, fontSize: "13px", margin: 0 }}>
        Lurer du på noe? Det er bare å svare på denne e-posten — vi leser alt.
      </Text>
    </EmailShell>
  );
}
