/**
 * Seeder «E-postmaler»-collectionen med dagens tekster fra de kodede malene i
 * @poynt/email. Idempotent: oppdaterer IKKE eksisterende maler (partnerens
 * redigeringer skal aldri overskrives) — oppretter bare de som mangler.
 *
 *   bun run --cwd apps/web payload run scripts/seed-email-templates.ts
 */
import config from "@payload-config";
import { getPayload } from "payload";
import { type DocBlock, richDoc } from "./_lexical";

interface TemplateSeed {
  templateKey: string;
  name: string;
  subject: string;
  body: DocBlock[];
  hint: string;
}

const templates: TemplateSeed[] = [
  {
    templateKey: "contact-confirmation",
    name: "Kontakt-bekreftelse",
    subject: "Takk for din henvendelse – Poynt",
    body: [
      { heading: "Takk for din henvendelse!" },
      "Hei {{navn}},",
      "Tusen takk for at du tok kontakt. Jeg har mottatt meldingen din og svarer så snart jeg kan – vanligvis innen et par dager.",
      "Dette skrev du:",
      { quote: "{{melding}}" },
      "Vennlig hilsen,",
      "Susanne Todnem · Poynt",
    ],
    hint: "Sendes til den som fyller ut kontaktskjemaet. Flettefelt: {{navn}}, {{epost}}, {{melding}}, {{telefon}}, {{gjelder}}. Poynt-ramma legges på automatisk. Tømmer du både emne og innhold, brukes standardteksten i koden.",
  },
  {
    templateKey: "contact-notification",
    name: "Kontakt-varsel (til dere)",
    subject: "Ny henvendelse fra {{navn}}",
    body: [
      { heading: "Noen vil i kontakt" },
      "Du har fått en ny melding via kontaktskjemaet på poynt.no.",
    ],
    hint: "Varselet dere får ved nye henvendelser. Dette er innledningen — navn, e-post, melding og svar-knapp legges på automatisk under. Flettefelt: {{navn}}, {{epost}}, {{gjelder}}, {{kilde}}.",
  },
  {
    templateKey: "sale-notification",
    name: "Salgsvarsel (til dere)",
    subject: "",
    body: [
      { heading: "Kaching! 🎉" },
      "Det har kommet et nytt salg på poynt.no.",
    ],
    hint: "Varselet dere får ved salg og nye medlemskap. Dette er innledningen — kunde, produkter og sum legges på automatisk under. La emnet stå tomt for automatisk emne med sum og ordrenummer. Flettefelt: {{type}}, {{navn}}, {{epost}}, {{sum}}, {{ordrenummer}}, {{betaling}}.",
  },
  {
    templateKey: "newsletter-signup-notification",
    name: "Nyhetsbrev-påmelding (til dere)",
    subject: "Ny på nyhetsbrevet: {{epost}}",
    body: [
      { heading: "Ny påmelding" },
      "Noen har meldt seg på nyhetsbrevet på poynt.no.",
    ],
    hint: "Varselet dere får når noen melder seg på nyhetsbrevet. Dette er innledningen — e-postadressen og kilden legges på automatisk under. Flettefelt: {{epost}}, {{kilde}}.",
  },
  {
    templateKey: "welcome-member",
    name: "Velkommen som medlem (On Poynt)",
    subject: "Velkommen til On Poynt!",
    body: [
      { heading: "Velkommen til On Poynt!" },
      "Hei {{navn}},",
      "Så gøy at du er med! Du har nå tilgang til hele On Poynt — verktøyene, planene og fellesskapet som gjør markedsføringen litt enklere å faktisk få gjort.",
      "Dette venter på deg:",
      {
        list: [
          "En kort onboarding som blir kjent med bedriften din",
          "Verktøy for kanalvalg, markedsplan og årshjul",
          "Et fellesskap av folk som står i det samme som deg",
        ],
      },
      "Lurer du på noe? Det er bare å svare på denne e-posten — vi leser alt.",
    ],
    hint: "Sendes til nye On Poynt-medlemmer. «Kom i gang»-knappen med lenke til onboardingen legges på automatisk til slutt. Flettefelt: {{navn}}, {{nivå}}.",
  },
  {
    templateKey: "magic-link",
    name: "Innloggingslenke (On Poynt)",
    subject: "Logg inn på On Poynt",
    body: [
      { heading: "Logg inn på On Poynt" },
      "Klikk på knappen under for å logge inn. Lenken er personlig – ikke del den med andre.",
      "Lenken utløper om {{minutter}} minutter. Hvis du ikke ba om denne e-posten, kan du trygt ignorere den.",
    ],
    hint: "Sendes når et medlem logger inn med e-post. «Logg inn»-knappen med selve lenken legges på automatisk til slutt. Flettefelt: {{minutter}}.",
  },
  {
    templateKey: "password-reset",
    name: "Tilbakestill passord (admin)",
    subject: "Tilbakestill passordet ditt – Poynt-admin",
    body: [
      { heading: "Tilbakestill passordet ditt" },
      "Vi mottok en forespørsel om å tilbakestille passordet til admin-kontoen din. Klikk på knappen under for å velge et nytt passord.",
      "Hvis du ikke ba om dette, kan du trygt ignorere e-posten – passordet ditt forblir uendret.",
    ],
    hint: "Sendes til admin-brukere som ber om nytt passord. «Velg nytt passord»-knappen legges på automatisk til slutt. Flettefelt: {{navn}}.",
  },
];

const payload = await getPayload({ config });

for (const template of templates) {
  const existing = await payload.find({
    collection: "email-templates",
    where: { templateKey: { equals: template.templateKey } },
    limit: 1,
    depth: 0,
  });

  if (existing.docs.length > 0) {
    payload.logger.info(`Finnes allerede (urørt): ${template.name}`);
    continue;
  }

  await payload.create({
    collection: "email-templates",
    data: {
      templateKey: template.templateKey,
      name: template.name,
      subject: template.subject,
      body: richDoc(template.body),
      hint: template.hint,
      // biome-ignore lint/suspicious/noExplicitAny: seed-data matcher collection-skjemaet
    } as any,
  });
  payload.logger.info(`Opprettet e-postmal: ${template.name}`);
}

payload.logger.info("Ferdig med å seede E-postmaler.");
process.exit(0);
