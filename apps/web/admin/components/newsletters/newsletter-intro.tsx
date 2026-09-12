"use client";

import { useState } from "react";

/**
 * Intro over Nyhetsbrev-lista (beforeListTable): kort forklaring av hvordan
 * man skriver, tester og sender et nyhetsbrev. Kan lukkes/åpnes.
 */
export const NewsletterIntro = () => {
  const [open, setOpen] = useState(true);

  const heading = {
    fontSize: "0.9rem",
    fontWeight: 600,
    margin: "1rem 0 0.35rem",
  };
  const text = { fontSize: "0.85rem", lineHeight: 1.55, margin: 0 };

  return (
    <div
      style={{
        border: "1px solid var(--theme-elevation-150)",
        borderRadius: "var(--style-radius-m, 6px)",
        background: "var(--theme-elevation-50)",
        padding: "1rem 1.25rem",
        marginBottom: "1.5rem",
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          all: "unset",
          cursor: "pointer",
          display: "flex",
          justifyContent: "space-between",
          width: "100%",
          fontWeight: 600,
          fontSize: "1rem",
        }}
      >
        <span>Slik fungerer nyhetsbrevet</span>
        <span style={{ color: "var(--theme-elevation-500)" }}>
          {open ? "Skjul" : "Vis"}
        </span>
      </button>

      {open && (
        <div>
          <p style={{ ...text, marginTop: "0.5rem" }}>
            Nyhetsbrevet skrives her og sendes via Resend til alle som har meldt
            seg på — fra nyhetsbrev-skjemaet på nettsiden, i utsjekken eller via
            ventelister. Selve abonnentlista ligger i Resend, ikke her.
          </p>

          <p style={heading}>1. Skriv</p>
          <p style={text}>
            Trykk «Lag ny» og fyll ut <strong>Emne</strong> (det mottakerne ser
            i innboksen), <strong>Forhåndsvisningstekst</strong> (valgfri — den
            korte teksten etter emnet) og <strong>Innhold</strong>. Husk å{" "}
            <strong>lagre</strong>.
          </p>

          <p style={heading}>2. Se hvordan det blir</p>
          <p style={text}>
            Fanen <strong>Forhåndsvisning</strong> viser e-posten slik
            mottakerne får den, og oppdateres mens du skriver.
          </p>

          <p style={heading}>3. Send en test til deg selv</p>
          <p style={text}>
            I sidepanelet til høyre, under <strong>Utsending</strong>, trykker
            du «Send test til meg». Testen går bare til e-postadressen du er
            logget inn med, og emnet starter med [TEST]. Sjekk gjerne både på
            mobil og PC. Du kan sende så mange tester du vil. (Avmeldingslenken
            virker ikke i testen — den fungerer bare i den ekte utsendingen.)
          </p>

          <p style={heading}>4. Send til alle</p>
          <p style={text}>
            Når alt ser riktig ut: lagre, og trykk «Send til alle abonnenter».
            Du får et spørsmål om å bekrefte.{" "}
            <strong>Dette kan ikke angres</strong> — e-posten går ut med én
            gang.
          </p>

          <p style={heading}>Etter utsending</p>
          <p style={text}>
            Nyhetsbrevet får status <strong>Sendt</strong> med dato og kan ikke
            sendes på nytt. Neste gang lager du et nytt nyhetsbrev. Mottakerne
            kan melde seg av via lenken nederst i e-posten — det håndteres
            automatisk.
          </p>
        </div>
      )}
    </div>
  );
};
