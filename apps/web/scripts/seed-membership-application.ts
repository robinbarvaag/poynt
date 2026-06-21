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
import { getPayload } from "payload";
import { richText } from "./_lexical";

const FORM_TITLE = "Medlemskapssøknad";
const PAGE_SLUG = "bli-medlem";

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
  excerpt:
    "Søk om å bli medlem i On Poynt – tilgang til fellesskap, ressurser og KI-verktøy.",
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
