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
            "Lenkene og angrerettsteksten som tas med i ordrebekreftelsen.",
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
                  "Loven krever at kunden får denne bekreftelsen på et varig medium (e-post). Samme forbehold vises ved betalingsknappene i kassen.",
              },
            },
          ],
        },
      ],
    },
  ],
};
