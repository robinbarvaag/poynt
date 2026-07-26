/**
 * Seeder «Medlemskapssøknad»-skjemaet (form-builder) + /bli-medlem-siden.
 * Et dedikert, dynamisk skjema for å søke om On Poynt-medlemskap – med
 * faktura-/bedriftsfelt som det generiske kontaktskjemaet ikke har. Partneren
 * kan redigere felt og tekst i admin etterpå. Idempotent: upsert på tittel/slug.
 * Innsendinger havner i «Skjemaer → Innsendinger», og hook-en i payload.config
 * sender en branded varsel-e-post (gjenkjenner medlemskaps-felt-settet).
 *
 *   bun run --cwd apps/web payload run scripts/seed-membership-application.ts
 */
import config from "@payload-config";
import { asc, db, eq } from "@poynt/planner-db";
import { plannerIndustry } from "@poynt/planner-db/schema";
import { getPayload } from "payload";
import { richText } from "./_lexical";

const FORM_TITLE = "Medlemskapssøknad";
const PAGE_SLUG = "bli-medlem";

// Bransje-valg hentes fra planner_industry slik at value = industry-id (matcher
// det godkjenning forhåndsutfyller i bedriftsprofilen). Skjemaet er fortsatt
// partner-redigerbart etterpå.
const industries = await db
  .select({ id: plannerIndustry.id, name: plannerIndustry.name })
  .from(plannerIndustry)
  .where(eq(plannerIndustry.isActive, true))
  .orderBy(asc(plannerIndustry.sortOrder));

const bransjeOptions = industries.map((i) => ({
  label: i.name,
  value: i.id,
}));

// Maskinnavn holdes lowercase – e-post-hook-en matcher feltnavn case-insensitivt.
const formFields = [
  {
    blockType: "text",
    name: "fulltnavn",
    label: "Fullt navn",
    required: true,
    width: 50,
  },
  {
    blockType: "email",
    name: "dinepost",
    label: "Din e-post",
    required: true,
    width: 50,
  },
  {
    blockType: "text",
    name: "bedriftsnavn",
    label: "Bedriftsnavn",
    required: true,
    width: 50,
  },
  {
    blockType: "text",
    name: "orgnummer",
    label: "Organisasjonsnummer",
    required: true,
    width: 50,
  },
  {
    blockType: "email",
    name: "fakturaepost",
    label: "E-post for faktura",
    required: true,
    width: 50,
  },
  {
    blockType: "select",
    name: "omsetning",
    label: "Omsetter du for mer enn 1 million kroner per år?",
    required: true,
    width: 50,
    options: [
      { label: "Ja", value: "Ja" },
      { label: "Nei", value: "Nei" },
    ],
  },
  {
    blockType: "select",
    name: "ehffaktura",
    label: "Vil du motta EHF-faktura?",
    required: true,
    width: 50,
    options: [
      { label: "Ja", value: "Ja" },
      {
        label: "Nei – send PDF på e-posten over",
        value: "Nei – send PDF på e-post",
      },
    ],
  },
  {
    blockType: "select",
    name: "fakturaoppdeling",
    label: "Ønsket fakturaoppdeling",
    required: true,
    width: 50,
    options: [
      { label: "Betalt alt nå", value: "Betalt alt nå" },
      {
        label: "Delt i to – fordelt på to måneder",
        value: "Delt i to",
      },
      {
        label: "Delt i fire – fordelt på fire måneder",
        value: "Delt i fire",
      },
    ],
  },
  {
    blockType: "textarea",
    name: "ombedriften",
    label: "Skriv litt om bedriften eller deg selv",
    required: false,
    width: 100,
  },
  // On Poynt-profil – valgfritt, men forhåndsutfyller verktøyene når medlemmet
  // tas i bruk, så de slipper å fylle inn det samme på nytt.
  ...(bransjeOptions.length > 0
    ? [
        {
          blockType: "select",
          name: "bransje",
          label: "Hvilken bransje er du i?",
          required: false,
          width: 50,
          options: bransjeOptions,
        },
      ]
    : []),
  {
    blockType: "select",
    name: "bedriftsstorrelse",
    label: "Hvor stor er bedriften?",
    required: false,
    width: 50,
    options: [
      { label: "Enmannsbedrift", value: "solo" },
      { label: "2–10 ansatte", value: "small" },
      { label: "11–50 ansatte", value: "medium" },
      { label: "50+ ansatte", value: "large" },
    ],
  },
  {
    blockType: "select",
    name: "malgruppetype",
    label: "Hvem selger du til?",
    required: false,
    width: 50,
    options: [
      { label: "Bedrifter (B2B)", value: "b2b" },
      { label: "Forbrukere (B2C)", value: "b2c" },
      { label: "Begge deler", value: "both" },
    ],
  },
  {
    blockType: "textarea",
    name: "malgruppe",
    label: "Beskriv kort hvem kundene dine er",
    required: false,
    width: 100,
  },
  {
    blockType: "textarea",
    name: "fakturainfo",
    label: "Fakturainformasjon? Skal faktura merkes noe spesielt?",
    required: false,
    width: 100,
  },
  {
    blockType: "checkbox",
    name: "bekreftelse",
    label:
      "Jeg bekrefter at jeg har rettigheter til å foreta faktura-kjøp på vegne av bedriften, og har lest, forstått og godtatt kjøpsbetingelsene.",
    required: true,
    width: 100,
  },
];

const payload = await getPayload({ config });

// 1) Skjema (upsert på tittel)
const existingForm = await payload.find({
  collection: "forms",
  where: { title: { equals: FORM_TITLE } },
  limit: 1,
  depth: 0,
});

const formData = {
  title: FORM_TITLE,
  fields: formFields,
  submitButtonLabel: "Jeg vil søke om å bli medlem",
  confirmationType: "message",
  confirmationMessage: richText(
    "Takk for søknaden! Vi ser over opplysningene og gir deg svar veldig kjapt."
  ),
};

let formId: string | number;
if (existingForm.docs.length > 0) {
  formId = existingForm.docs[0].id;
  await payload.update({
    collection: "forms",
    id: formId,
    // biome-ignore lint/suspicious/noExplicitAny: seed-data matcher form-builder-skjemaet
    data: formData as any,
  });
  payload.logger.info("Oppdaterte skjema: Medlemskapssøknad");
} else {
  const created = await payload.create({
    collection: "forms",
    // biome-ignore lint/suspicious/noExplicitAny: seed-data matcher form-builder-skjemaet
    data: formData as any,
  });
  formId = created.id;
  payload.logger.info("Opprettet skjema: Medlemskapssøknad");
}

// 2) /bli-medlem-side (upsert på slug)
const page = {
  title: "Bli medlem",
  slug: PAGE_SLUG,
  meta: {
    description:
      "Søk om å bli medlem i On Poynt – tilgang til fellesskap, ressurser og KI-verktøy.",
  },
  layout: [
    {
      blockType: "hero",
      title: "Søk om å bli medlem i On Poynt",
      subtitle:
        "Fyll inn litt informasjon om deg og bedriften, så får du svar veldig kjapt!",
    },
    {
      blockType: "formBlock",
      form: formId,
      description: "Alle felt merket med * må fylles ut.",
      variant: "card",
      alignment: "left",
      maxWidth: "lg",
    },
  ],
};

const existingPage = await payload.find({
  collection: "pages",
  where: { slug: { equals: page.slug } },
  limit: 1,
  depth: 0,
});

if (existingPage.docs.length > 0) {
  await payload.update({
    collection: "pages",
    id: existingPage.docs[0].id,
    // biome-ignore lint/suspicious/noExplicitAny: seed-data matcher blokk-skjemaet
    data: { ...page, _status: "published" } as any,
  });
  payload.logger.info("Oppdaterte side: /bli-medlem");
} else {
  await payload.create({
    collection: "pages",
    // biome-ignore lint/suspicious/noExplicitAny: seed-data matcher blokk-skjemaet
    data: { ...page, _status: "published" } as any,
  });
  payload.logger.info("Opprettet side: /bli-medlem");
}

payload.logger.info("Ferdig med å seede medlemskapssøknad + /bli-medlem.");
process.exit(0);
