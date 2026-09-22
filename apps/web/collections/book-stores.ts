import type { CollectionConfig } from "payload";
import { FOLLOW_UP_OPTIONS, SOURCE_OPTIONS } from "../lib/boksalg/constants";

/**
 * Én rad per fysisk butikk hos en bokhandlerkjede — kontaktinfo, lagerstatus
 * for boka, og Susannes egen oppfølging.
 *
 * Kjedefeltene (navn, adresse, e-post, telefon, åpningstider, koordinater,
 * lagertall) skrives av den automatiske hentingen og overskrives hver gang.
 * Oppfølgingsfeltene (status, dato, notat) er Susannes og røres ALDRI av
 * hentingen — det er hele poenget med samlingen: «hvem har jeg ringt, og hva
 * sa de» må overleve at lagertallet oppdateres hver morgen.
 *
 * Statusen «Gått tom» / «Ikke hatt boka» utledes av `maxQty`: en butikk som
 * har hatt boka i én tidligere måling har maxQty > 0. Merk at en butikk kan
 * ha solgt ut før første måling — da ser den ut som «ikke hatt».
 */
export const BookStores: CollectionConfig = {
  slug: "book-stores",
  labels: {
    singular: "Butikk",
    plural: "Butikker",
  },
  admin: {
    useAsTitle: "name",
    defaultColumns: [
      "name",
      "region",
      "currentQty",
      "soldEstimate",
      "followUpStatus",
      "followUpAt",
    ],
    // Vises kun i den egenbygde «Boka»-nav-gruppen.
    group: false,
    description:
      "Alle butikkene hos Norli (og etter hvert ARK) med kontaktinfo og lagerstatus. Bruk oppfølgingsfeltene til å holde orden på hvem du har snakket med.",
    listSearchableFields: ["name", "city", "region", "email"],
  },
  access: {
    read: ({ req: { user } }) => !!user,
    // Rader opprettes bare av hentingen — men Susanne må kunne redigere
    // oppfølgingen sin, så update er åpent.
    create: () => false,
    update: ({ req: { user } }) => !!user,
    delete: ({ req: { user } }) => !!user,
  },
  defaultSort: "-currentQty",
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          label: "Oppfølging",
          description: "Dine notater. Røres ikke av den automatiske hentingen.",
          fields: [
            {
              type: "row",
              fields: [
                {
                  name: "followUpStatus",
                  type: "select",
                  label: "Status",
                  defaultValue: "ingen",
                  options: [...FOLLOW_UP_OPTIONS],
                  admin: { width: "50%" },
                },
                {
                  name: "followUpAt",
                  type: "date",
                  label: "Sist kontaktet",
                  admin: {
                    width: "50%",
                    date: {
                      pickerAppearance: "dayOnly",
                      displayFormat: "d. MMM yyyy",
                    },
                  },
                },
              ],
            },
            {
              name: "notes",
              type: "textarea",
              label: "Notat",
              admin: {
                description:
                  "Hvem du snakket med, hva de sa, når du skal ringe igjen.",
              },
            },
          ],
        },
        {
          label: "Butikken",
          description:
            "Hentes automatisk fra kjeden. Endringer her overskrives ved neste henting.",
          fields: [
            {
              type: "row",
              fields: [
                {
                  name: "name",
                  type: "text",
                  label: "Butikk",
                  required: true,
                  admin: { width: "50%", readOnly: true },
                },
                {
                  name: "sourceKey",
                  type: "select",
                  label: "Kjede",
                  required: true,
                  options: SOURCE_OPTIONS,
                  index: true,
                  admin: { width: "50%", readOnly: true },
                },
              ],
            },
            {
              type: "row",
              fields: [
                {
                  name: "city",
                  type: "text",
                  label: "By",
                  admin: { width: "50%", readOnly: true },
                },
                {
                  name: "region",
                  type: "text",
                  label: "Fylke",
                  index: true,
                  admin: { width: "50%", readOnly: true },
                },
              ],
            },
            {
              type: "row",
              fields: [
                {
                  // Bevisst text, ikke email: adressene kommer fra kjeden og
                  // skal vises som de er. Én rar adresse skal ikke velte hele
                  // hentingen — og «kopier e-postadresser» kopierer uansett
                  // det som står her.
                  name: "email",
                  type: "text",
                  label: "E-post",
                  admin: { width: "50%", readOnly: true },
                },
                {
                  name: "phone",
                  type: "text",
                  label: "Telefon",
                  admin: { width: "50%", readOnly: true },
                },
              ],
            },
            {
              type: "row",
              fields: [
                {
                  name: "address",
                  type: "text",
                  label: "Adresse",
                  admin: { width: "70%", readOnly: true },
                },
                {
                  name: "postcode",
                  type: "text",
                  label: "Postnummer",
                  admin: { width: "30%", readOnly: true },
                },
              ],
            },
            {
              name: "schedule",
              type: "textarea",
              label: "Åpningstider",
              admin: { readOnly: true },
            },
            {
              type: "row",
              fields: [
                {
                  name: "latitude",
                  type: "number",
                  label: "Breddegrad",
                  admin: { width: "50%", readOnly: true },
                },
                {
                  name: "longitude",
                  type: "number",
                  label: "Lengdegrad",
                  admin: { width: "50%", readOnly: true },
                },
              ],
            },
          ],
        },
        {
          label: "Lager",
          description: "Regnes ut av hentingen, måling for måling.",
          fields: [
            {
              type: "row",
              fields: [
                {
                  name: "currentQty",
                  type: "number",
                  label: "Eksemplarer nå",
                  defaultValue: 0,
                  admin: { width: "33%", readOnly: true },
                },
                {
                  name: "maxQty",
                  type: "number",
                  label: "Flest på én gang",
                  defaultValue: 0,
                  admin: {
                    width: "33%",
                    readOnly: true,
                    description: "0 her betyr at butikken aldri har hatt boka.",
                  },
                },
                {
                  name: "soldEstimate",
                  type: "number",
                  label: "Solgt (estimat)",
                  defaultValue: 0,
                  admin: { width: "34%", readOnly: true },
                },
              ],
            },
            {
              type: "row",
              fields: [
                {
                  name: "restockedEstimate",
                  type: "number",
                  label: "Påfylt",
                  defaultValue: 0,
                  admin: { width: "33%", readOnly: true },
                },
                {
                  name: "firstStockedAt",
                  type: "date",
                  label: "Fikk boka",
                  admin: {
                    width: "33%",
                    readOnly: true,
                    date: { pickerAppearance: "dayAndTime" },
                  },
                },
                {
                  name: "lastSeenAt",
                  type: "date",
                  label: "Sist hentet",
                  admin: {
                    width: "34%",
                    readOnly: true,
                    date: { pickerAppearance: "dayAndTime" },
                  },
                },
              ],
            },
          ],
        },
      ],
    },
    {
      name: "storeId",
      type: "text",
      label: "Butikk-ID hos kjeden",
      required: true,
      index: true,
      admin: { position: "sidebar", readOnly: true },
    },
  ],
};
