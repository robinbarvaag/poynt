import { Button, Section, Text } from "@react-email/components";
import * as React from "react";
import { EmailShell, emailStyles } from "./_layout";

export interface EventWaitlistedEmailProps {
  name?: string;
  eventTitle: string;
  when: string;
  where?: string;
  /** Plassen på ventelista. */
  position?: number;
  ticketUrl: string;
}

/** Til den som havnet på ventelista fordi eventet var fullt. */
export default function EventWaitlistedEmail({
  name,
  eventTitle,
  when,
  where,
  position,
  ticketUrl,
}: EventWaitlistedEmailProps) {
  return (
    <EmailShell preview={`Du står på ventelista til ${eventTitle}.`}>
      <Text style={emailStyles.eyebrow}>Venteliste</Text>
      <Text style={emailStyles.heading}>{eventTitle}</Text>
      <Text style={emailStyles.text}>Hei{name ? ` ${name}` : ""},</Text>
      <Text style={emailStyles.text}>
        Det er fullt akkurat nå, men du står på ventelista
        {position ? ` som nummer ${position}` : ""}. Melder noen seg av, får du
        plassen automatisk og en ny e-post med billett. Du trenger ikke gjøre
        noe.
      </Text>

      <Section>
        <Text style={emailStyles.label}>Når</Text>
        <Text style={emailStyles.value}>{when}</Text>
        {where ? (
          <>
            <Text style={emailStyles.label}>Hvor</Text>
            <Text style={emailStyles.value}>{where}</Text>
          </>
        ) : null}
      </Section>

      <Text style={emailStyles.text}>
        Kan du ikke likevel? Meld deg av ventelista her, så slipper vi å holde
        av plassen til deg:
      </Text>
      <Section style={{ textAlign: "center", margin: "0 0 24px" }}>
        <Button href={ticketUrl} style={emailStyles.button}>
          Se plassen din
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
