import { Section, Text } from "@react-email/components";
import * as React from "react";
import { EmailShell, emailStyles } from "./_layout";

export interface WaitlistConfirmationProps {
  name?: string;
  /** Tittelen på boka/produktet det ventes på. */
  title: string;
  /** Om personen samtidig meldte seg på nyhetsbrevet. */
  newsletter?: boolean;
}

/** Bekreftelse til den som meldte seg på ventelista for en bok. */
export default function WaitlistConfirmationEmail({
  name,
  title,
  newsletter,
}: WaitlistConfirmationProps) {
  return (
    <EmailShell preview={`Du står på ventelista for «${title}».`}>
      <Text style={emailStyles.eyebrow}>Venteliste</Text>
      <Text style={emailStyles.heading}>Du står på lista!</Text>
      <Text style={emailStyles.text}>Hei{name ? ` ${name}` : ""},</Text>
      <Text style={emailStyles.text}>
        Takk for at du meldte deg på ventelista for «{title}». Du er blant de
        første som får beskjed når boka er klar – både når den kan
        forhåndsbestilles og når den faktisk ligger i posten.
      </Text>

      <Section>
        <Text style={emailStyles.label}>Hva skjer nå</Text>
        <Text style={emailStyles.value}>
          Ingenting du trenger å gjøre. Jeg sender deg en e-post så snart det er
          nytt å melde – ikke oftere.
        </Text>
      </Section>

      {newsletter ? (
        <Text style={emailStyles.text}>
          Innimellom sender jeg deg også en smakebit fra boka eller noe annet
          som er verdt å vite om vekst. Du kan melde deg av når som helst,
          nederst i hvilken som helst e-post.
        </Text>
      ) : null}

      <Text style={{ ...emailStyles.text, marginTop: "24px" }}>
        Vennlig hilsen,
        <br />
        Susanne Todnem · Poynt
      </Text>
    </EmailShell>
  );
}
