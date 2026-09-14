import { Button, Img, Section, Text } from "@react-email/components";
import * as React from "react";
import { EmailShell, brand, emailStyles } from "./_layout";

export interface EventTicketEmailProps {
  name?: string;
  eventTitle: string;
  /** Ferdig formatert tidspunkt, f.eks. «torsdag 15. oktober 2026, kl. 18:00–21:00». */
  when: string;
  where?: string;
  mapUrl?: string;
  /** «Dørene åpner kl. 17:30» */
  doorsOpen?: string;
  /** Billettkoden («POY-7K3M») — mangler når eventet ikke bruker billetter. */
  code?: string;
  /** Kilden til QR-bildet: `cid:…` i ekte e-post, data-URL i forhåndsvisning. */
  qrSrc?: string;
  ticketUrl: string;
  /** Egen hilsen fra admin («Ekstra hilsen i bekreftelsen»). */
  greeting?: string;
  /** Praktisk info som avsnitt. */
  practicalInfo?: string[];
  /** Personen rykket opp fra ventelista. */
  promoted?: boolean;
  /** Påminnelse dagen før (samme billett, annen innledning). */
  reminder?: boolean;
}

const codeBox = {
  backgroundColor: brand.bg,
  border: `2px dashed ${brand.panel}`,
  borderRadius: "16px",
  padding: "20px",
  textAlign: "center" as const,
  margin: "8px 0 24px",
};

const codeText = {
  color: brand.ink,
  fontFamily: "ui-monospace,SFMono-Regular,Menlo,Consolas,monospace",
  fontSize: "30px",
  fontWeight: "800",
  letterSpacing: "0.12em",
  margin: "12px 0 4px",
};

/** Bekreftelse med billett: kode, QR og lenke til billettsiden. */
export default function EventTicketEmail({
  name,
  eventTitle,
  when,
  where,
  mapUrl,
  doorsOpen,
  code,
  qrSrc,
  ticketUrl,
  greeting,
  practicalInfo = [],
  promoted,
  reminder,
}: EventTicketEmailProps) {
  const intro = reminder
    ? {
        preview: `Snart er det tid for ${eventTitle}. Billetten ligger her.`,
        eyebrow: "Snart er det tid",
        text: "En liten påminnelse: vi ses snart! Billetten ligger under, så du har den klar i døra.",
      }
    : promoted
      ? {
          preview: `Det ble plass! Du er med på ${eventTitle}.`,
          eyebrow: "Det ble plass",
          text: "Noen meldte seg av, og du sto først på ventelista. Plassen er din!",
        }
      : {
          preview: `Du er påmeldt ${eventTitle}. Her er billetten din.`,
          eyebrow: "Du er påmeldt",
          text: "Så fint at du vil være med. Plassen din er klar.",
        };

  return (
    <EmailShell preview={intro.preview}>
      <Text style={emailStyles.eyebrow}>{intro.eyebrow}</Text>
      <Text style={emailStyles.heading}>{eventTitle}</Text>
      <Text style={emailStyles.text}>Hei{name ? ` ${name}` : ""},</Text>
      <Text style={emailStyles.text}>{intro.text}</Text>
      {greeting && !reminder ? (
        <Text style={{ ...emailStyles.text, whiteSpace: "pre-line" }}>
          {greeting}
        </Text>
      ) : null}

      <Section>
        <Text style={emailStyles.label}>Når</Text>
        <Text style={emailStyles.value}>
          {when}
          {doorsOpen ? (
            <>
              <br />
              {doorsOpen}
            </>
          ) : null}
        </Text>
        {where ? (
          <>
            <Text style={emailStyles.label}>Hvor</Text>
            <Text style={emailStyles.value}>
              {mapUrl ? (
                <a href={mapUrl} style={{ color: brand.ink }}>
                  {where}
                </a>
              ) : (
                where
              )}
            </Text>
          </>
        ) : null}
      </Section>

      {code ? (
        <Section style={codeBox}>
          <Text style={{ ...emailStyles.label, margin: 0 }}>Billetten din</Text>
          {qrSrc ? (
            <Img
              src={qrSrc}
              width="200"
              height="200"
              alt={`QR-kode for billett ${code}`}
              style={{ margin: "16px auto 0", display: "block" }}
            />
          ) : null}
          <Text style={codeText}>{code}</Text>
          <Text style={{ ...emailStyles.text, fontSize: "14px", margin: 0 }}>
            Ta vare på denne e-posten. Vis QR-koden i døra, eller si koden.
          </Text>
        </Section>
      ) : null}

      <Section style={{ textAlign: "center", margin: "0 0 24px" }}>
        <Button href={ticketUrl} style={emailStyles.button}>
          Åpne billetten
        </Button>
      </Section>

      {practicalInfo.length ? (
        <Section>
          <Text style={emailStyles.label}>Praktisk info</Text>
          {practicalInfo.map((paragraph) => (
            <Text key={paragraph} style={emailStyles.text}>
              {paragraph}
            </Text>
          ))}
        </Section>
      ) : null}

      <Text style={emailStyles.text}>
        Kalenderfilen ligger vedlagt. Får du ikke kommet likevel? Meld deg av på
        billettsiden, så kan noen andre få plassen.
      </Text>

      <Text style={{ ...emailStyles.text, marginTop: "24px" }}>
        Vi gleder oss til å se deg!
        <br />
        Susanne og Poynt
      </Text>
    </EmailShell>
  );
}
