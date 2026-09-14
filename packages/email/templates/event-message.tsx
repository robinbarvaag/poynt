import { Button, Section, Text } from "@react-email/components";
import * as React from "react";
import { EmailShell, emailStyles } from "./_layout";

export interface EventMessageEmailProps {
  name?: string;
  eventTitle: string;
  when: string;
  /** Meldingen fra admin, som ren tekst (linjeskift beholdes). */
  message: string;
  /** Lenke til personens billett, eller til eventsiden. */
  ticketUrl?: string;
}

/** Beskjed fra Poynt til de påmeldte (endringer, avlysning, praktisk info). */
export default function EventMessageEmail({
  name,
  eventTitle,
  when,
  message,
  ticketUrl,
}: EventMessageEmailProps) {
  const paragraphs = message
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return (
    <EmailShell preview={paragraphs[0]?.slice(0, 120) ?? eventTitle}>
      <Text style={emailStyles.eyebrow}>Om eventet</Text>
      <Text style={emailStyles.heading}>{eventTitle}</Text>
      <Text style={{ ...emailStyles.text, marginTop: 0 }}>{when}</Text>
      <Text style={emailStyles.text}>Hei{name ? ` ${name}` : ""},</Text>
      {paragraphs.map((paragraph) => (
        <Text
          key={paragraph}
          style={{ ...emailStyles.text, whiteSpace: "pre-line" }}
        >
          {paragraph}
        </Text>
      ))}
      {ticketUrl ? (
        <Section style={{ textAlign: "center", margin: "8px 0 24px" }}>
          <Button href={ticketUrl} style={emailStyles.button}>
            Åpne billetten
          </Button>
        </Section>
      ) : null}
      <Text style={{ ...emailStyles.text, marginTop: "24px" }}>
        Har du spørsmål, er det bare å svare på denne e-posten.
        <br />
        <br />
        Vennlig hilsen,
        <br />
        Susanne og Poynt
      </Text>
    </EmailShell>
  );
}
