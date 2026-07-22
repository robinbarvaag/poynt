/**
 * Seeder «Kontakt»-skjemaet (form-builder) + /kontakt-siden (Page med formBlock).
 * Idempotent: oppdaterer hvis det finnes, ellers oppretter. Innsendinger havner
 * i admin under «Skjemaer → Innsendinger», og hook-en i payload.config sender
 * branded e-poster via Resend.
 *
 *   bun run --cwd apps/web payload run scripts/seed-kontakt.ts
 */
import config from "@payload-config";
import { getPayload } from "payload";
import { richText } from "./_lexical";

const FORM_TITLE = "Kontakt";

const formFields = [
  {
    blockType: "text",
    name: "navn",
    label: "Navn",
    required: true,
    width: 50,
  },
  {
    blockType: "email",
    name: "epost",
    label: "E-post",
    required: true,
    width: 50,
  },
  {
    blockType: "text",
    name: "telefon",
    label: "Telefon (valgfritt)",
    required: false,
    width: 50,
  },
  {
    blockType: "select",
    name: "emne",
    label: "Hva gjelder det?",
    required: true,
    width: 50,
    options: [
      { label: "Rådgivning", value: "Rådgivning" },
      { label: "Kurs og foredrag", value: "Kurs og foredrag" },
      { label: "Styrearbeid", value: "Styrearbeid" },
      { label: "Medlemskap (On Poynt)", value: "Medlemskap" },
      { label: "Annet", value: "Annet" },
    ],
  },
  {
    blockType: "textarea",
    name: "melding",
    label: "Melding",
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
  submitButtonLabel: "Send melding",
  confirmationType: "message",
  confirmationMessage: richText(
    "Takk for din henvendelse! Jeg har mottatt meldingen og svarer så snart jeg kan."
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
  payload.logger.info("Oppdaterte skjema: Kontakt");
} else {
  const created = await payload.create({
    collection: "forms",
    // biome-ignore lint/suspicious/noExplicitAny: seed-data matcher form-builder-skjemaet
    data: formData as any,
  });
  formId = created.id;
  payload.logger.info("Opprettet skjema: Kontakt");
}

// 2) /kontakt-side (upsert på slug)
const page = {
  title: "Kontakt",
  slug: "kontakt",
  excerpt:
    "Ta kontakt med Susanne Todnem i Poynt for rådgivning, foredrag, styrearbeid eller medlemskap.",
  layout: [
    {
      blockType: "hero",
      title: "La oss ta en prat",
      subtitle:
        "Lurer du på om jeg kan hjelpe deg eller bedriften din? Fyll ut skjemaet, så hører du fra meg – vanligvis innen et par dager.",
      tagsLabel: "Snakk med meg om:",
      tags: [
        { label: "Rådgivning" },
        { label: "Foredrag" },
        { label: "Styrearbeid" },
        { label: "Medlemskap" },
      ],
    },
    {
      blockType: "formBlock",
      form: formId,
      title: "Send en melding",
      description: "Alle felt med * må fylles ut.",
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
  payload.logger.info("Oppdaterte side: /kontakt");
} else {
  await payload.create({
    collection: "pages",
    // biome-ignore lint/suspicious/noExplicitAny: seed-data matcher blokk-skjemaet
    data: { ...page, _status: "published" } as any,
  });
  payload.logger.info("Opprettet side: /kontakt");
}

payload.logger.info("Ferdig med å seede kontaktskjema + /kontakt.");
process.exit(0);
