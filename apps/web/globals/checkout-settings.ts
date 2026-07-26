import type { GlobalConfig } from "payload";
import { revalidateCmsAfterChange } from "../lib/revalidate-cms";

/**
 * Alt redigerbart rundt kjøpsopplevelsen etter kassen: kvitteringssiden
 * (vellykket og avbrutt betaling) og ordrebekreftelses-eposten.
 * Leses av /kvittering og webhookene (Stripe + Vipps).
 */
export const CheckoutSettings: GlobalConfig = {
  slug: "checkout-settings",
  label: "Kasse og kvittering",
  admin: {
    // Ligger i den egenbygde «Drift»-nav-gruppen (setup-nav-group.tsx),
    // ikke i Payloads standard-nav.
    group: false,
  },
  hooks: {
    afterChange: [revalidateCmsAfterChange],
  },
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          label: "Kvittering – vellykket",
          description: "Vises på /kvittering etter gjennomført betaling.",
          fields: [
            {
              name: "successEyebrow",
              type: "text",
              label: "Liten overskrift",
              defaultValue: "Bekreftet",
            },
            {
              name: "successTitle",
              type: "text",
              label: "Tittel",
              defaultValue: "Takk for kjøpet!",
            },
            {
              name: "successText",
              type: "textarea",
              label: "Tekst",
              defaultValue:
                "Ordren din er bekreftet, og en ordrebekreftelse er på vei til innboksen din. Kjøpte du en PDF, ligger den vedlagt e-posten – klar til å lastes ned.",
            },
            {
              name: "successPrimaryCtaLabel",
              type: "text",
              label: "Hovedknapp – tekst",
              defaultValue: "Se flere produkter",
            },
            {
              name: "successPrimaryCtaUrl",
              type: "text",
              label: "Hovedknapp – lenke",
              defaultValue: "/produkter",
            },
            {
              name: "successSecondaryCtaLabel",
              type: "text",
              label: "Sekundærknapp – tekst",
              defaultValue: "Til forsiden",
            },
            {
              name: "successSecondaryCtaUrl",
              type: "text",
              label: "Sekundærknapp – lenke",
              defaultValue: "/",
            },
          ],
        },
        {
          label: "Kvittering – avbrutt",
          description:
            "Vises på /kvittering når en Vipps-betaling ble avbrutt eller feilet.",
          fields: [
            {
              name: "cancelledEyebrow",
              type: "text",
              label: "Liten overskrift",
              defaultValue: "Ikke fullført",
            },
            {
              name: "cancelledTitle",
              type: "text",
              label: "Tittel",
              defaultValue: "Betalingen ble avbrutt",
            },
            {
              name: "cancelledText",
              type: "textarea",
              label: "Tekst",
              defaultValue:
                "Ingen penger er trukket, og handlekurven din er urørt. Du kan prøve igjen når du vil – eller ta kontakt hvis noe ikke fungerte som det skulle.",
            },
            {
              name: "cancelledPrimaryCtaLabel",
              type: "text",
              label: "Hovedknapp – tekst",
              defaultValue: "Tilbake til handlekurven",
            },
            {
              name: "cancelledPrimaryCtaUrl",
              type: "text",
              label: "Hovedknapp – lenke",
              defaultValue: "/handlekurv",
            },
            {
              name: "cancelledSecondaryCtaLabel",
              type: "text",
              label: "Sekundærknapp – tekst",
              defaultValue: "Kontakt oss",
            },
            {
              name: "cancelledSecondaryCtaUrl",
              type: "text",
              label: "Sekundærknapp – lenke",
              defaultValue: "/kontakt",
            },
          ],
        },
        {
          label: "Ordrebekreftelse (e-post)",
          description:
            "Tekstene i e-posten som sendes etter kjøp. Ordrenummer og produktliste legges til automatisk.",
          fields: [
            {
              name: "emailSubject",
              type: "text",
              label: "Emnefelt",
              defaultValue: "Ordrebekreftelse",
              admin: {
                description: "Ordrenummeret legges på automatisk: «… #42»",
              },
            },
            {
              name: "emailHeading",
              type: "text",
              label: "Overskrift",
              defaultValue: "Takk for bestillingen!",
            },
            {
              name: "emailIntro",
              type: "textarea",
              label: "Innledning",
              defaultValue:
                "Vi har mottatt bestillingen din. Her er en oppsummering av kjøpet.",
            },
            {
              name: "emailPdfNote",
              type: "textarea",
              label: "PDF-melding",
              defaultValue:
                "PDF-ene du har kjøpt ligger vedlagt denne e-posten – last dem ned og kos deg!",
              admin: {
                description:
                  "Vises bare når ordren inneholder PDF-produkter med vedlegg.",
              },
            },
            {
              name: "emailFooter",
              type: "textarea",
              label: "Avslutning",
              defaultValue:
                "Har du spørsmål om bestillingen, er det bare å svare på denne e-posten.",
            },
          ],
        },
      ],
    },
  ],
};
