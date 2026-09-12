import type { GlobalConfig } from "payload";
import { revalidateCmsAfterChange } from "../lib/revalidate-cms";

/**
 * Selgeropplysninger og juridiske tekster for nettbutikken. Brukes av
 * ordrebekreftelsen (e-post), som dermed oppfyller kravene til et
 * salgsdokument i bokføringsforskriften § 5-1-1: selgers navn, org.nr. (med
 * «MVA» når registrert), adresse, dato, varelinjer og MVA spesifisert.
 *
 * Angrerettloven § 22 bokstav n krever i tillegg at kunden får bekreftet, på
 * varig medium, at angreretten bortfaller for digitalt innhold som leveres
 * umiddelbart — den teksten bor også her.
 */
export const ShopSettings: GlobalConfig = {
  slug: "shop-settings",
  label: "Nettbutikk",
  admin: {
    group: "Nettbutikk",
    description:
      "Selgeropplysninger, MVA og juridiske tekster som brukes i ordrebekreftelsen.",
  },
  hooks: {
    afterChange: [revalidateCmsAfterChange],
  },
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          label: "Selger",
          description:
            "Opplysningene som må stå på en kvittering. Vises nederst i ordrebekreftelsen.",
          fields: [
            {
              name: "sellerName",
              type: "text",
              label: "Firmanavn",
              required: true,
              defaultValue: "Poynt AS",
            },
            {
              name: "orgNumber",
              type: "text",
              label: "Organisasjonsnummer",
              admin: {
                description: "Ni siffer, f.eks. «123 456 789»",
              },
            },
            {
              name: "vatRegistered",
              type: "checkbox",
              label: "Registrert i Merverdiavgiftsregisteret",
              defaultValue: true,
              admin: {
                description:
                  "Når avkrysset legges «MVA» til etter org.nr., og MVA spesifiseres på kvitteringen. Alle priser i nettbutikken er inkludert MVA.",
              },
            },
            {
              name: "address",
              type: "textarea",
              label: "Forretningsadresse",
              admin: {
                description: "Gate, postnummer og sted. Linjeskift beholdes.",
              },
            },
            {
              type: "row",
              fields: [
                {
                  name: "supportEmail",
                  type: "email",
                  label: "Kundeservice – e-post",
                  admin: { width: "50%" },
                },
                {
                  name: "supportPhone",
                  type: "text",
                  label: "Kundeservice – telefon",
                  admin: { width: "50%" },
                },
              ],
            },
          ],
        },
        {
          label: "Vilkår og angrerett",
          description:
            "Samtykketekstene kunden ser i kassen, og angrerettsteksten som tas med i ordrebekreftelsen.",
          fields: [
            {
              type: "row",
              fields: [
                {
                  name: "termsPage",
                  type: "relationship",
                  relationTo: "pages",
                  label: "Kjøpsbetingelser (side)",
                  admin: { width: "50%" },
                },
                {
                  name: "privacyPage",
                  type: "relationship",
                  relationTo: "pages",
                  label: "Personvernerklæring (side)",
                  admin: { width: "50%" },
                },
              ],
            },
            {
              name: "withdrawalNotice",
              type: "textarea",
              label: "Angrerett – tekst i ordrebekreftelsen",
              defaultValue:
                "Digitalt innhold leveres umiddelbart etter kjøp. Ved å fullføre kjøpet ba du om at leveringen startet med en gang, og du godtok at angreretten dermed bortfaller (angrerettloven § 22 bokstav n). Er noe galt med leveransen, hjelper vi deg selvsagt – ta kontakt.",
              admin: {
                description:
                  "Loven krever at kunden får denne bekreftelsen på et varig medium (e-post). Samme forbehold må kunden aktivt godta i kassen (feltene under).",
              },
            },
            {
              name: "consentCheckboxLabel",
              type: "textarea",
              label: "Samtykke – tekst ved avkryssingsboksen",
              required: true,
              defaultValue:
                "Jeg ber om at det digitale innholdet leveres umiddelbart, og forstår at angreretten dermed bortfaller. Jeg godtar kjøpsbetingelsene.",
              admin: {
                description:
                  "Vises ved boksen kunden må huke av før betaling (handlekurv og bekreftelsesvinduet). Lenker til kjøpsbetingelser og personvern legges til automatisk. Teksten kunden godtok lagres på ordren.",
              },
            },
            {
              type: "row",
              fields: [
                {
                  name: "consentDialogTitle",
                  type: "text",
                  label: "Bekreftelsesvindu – tittel",
                  required: true,
                  defaultValue: "Før du betaler",
                  admin: { width: "50%" },
                },
                {
                  name: "consentErrorMessage",
                  type: "text",
                  label: "Feilmelding når boksen ikke er huket av",
                  required: true,
                  defaultValue:
                    "Du må godta vilkårene før du kan gå videre til betaling.",
                  admin: { width: "50%" },
                },
              ],
            },
            {
              name: "consentDialogText",
              type: "textarea",
              label: "Bekreftelsesvindu – tekst",
              required: true,
              defaultValue:
                "Digitalt innhold leveres med en gang betalingen er gjennomført. For at vi skal kunne levere umiddelbart, må du bekrefte at du ber om det og godtar at angreretten bortfaller (angrerettloven § 22 bokstav n).",
              admin: {
                description:
                  "Vinduet dukker opp ved «Kjøp nå med Vipps» på produktsiden og i kurv-skuffen, der det ikke er plass til avkryssingsboksen.",
              },
            },
          ],
        },
      ],
    },
  ],
};
