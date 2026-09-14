import { Button, Section, Text } from "@react-email/components";
import * as React from "react";
import { EmailShell, emailStyles } from "./_layout";

export interface EventCancelledEmailProps {
  name?: string;
  eventTitle: string;
  when: string;
  eventUrl: string;
  /** Avmeldt av dere (admin), ikke av personen selv. */
  byAdmin?: boolean;
}

/** Kvittering på at påmeldingen er avmeldt. */
export default function EventCancelledEmail({
  name,
  eventTitle,
  when,
  eventUrl,
  byAdmin,
}: EventCancelledEmailProps) {
  return (
    <EmailShell preview={`Du er meldt av ${eventTitle}.`}>
      <Text style={emailStyles.eyebrow}>Avmeldt</Text>
      <Text style={emailStyles.heading}>{eventTitle}</Text>
      <Text style={emailStyles.text}>Hei{name ? ` ${name}` : ""},</Text>
      <Text style={emailStyles.text}>
        {byAdmin
          ? `Påmeldingen din til ${eventTitle} (${when}) er meldt av. Tror du det er en feil, er det bare å svare på denne e-posten.`
          : `Takk for at du sa fra! Du er meldt av ${eventTitle} (${when}), og plassen din går videre til noen andre. Billetten virker ikke lenger.`}
      </Text>
      <Text style={emailStyles.text}>
        Ombestemmer du deg, kan du melde deg på igjen så lenge det er plass.
      </Text>
      <Section style={{ textAlign: "center", margin: "0 0 24px" }}>
        <Button href={eventUrl} style={emailStyles.button}>
          Gå til eventet
        </Button>
      </Section>
      <Text style={{ ...emailStyles.text, marginTop: "24px" }}>
        Vennlig hilsen,
        <br />
        Susanne og Poynt
      </Text>
    </EmailShell>
  );
}
