import type { GlobalConfig } from "payload";
import {
  CHANNEL_OPTIONS,
  DEFAULT_CHANNELS,
  SOURCE_OPTIONS,
  STOCK_SOURCE_OPTIONS,
} from "../lib/boksalg/constants";

/**
 * Tallene bak boksalg-dashbordet (/intern/boksalg). Alt som avgjør hva Susanne
 * sitter igjen med per solgt bok bor her — ingenting av det er hardkodet, fordi
 * avtalene kan endre seg og terskelen for å rette et tall skal være «logg inn
 * og skriv», ikke «be Robin deploye».
 *
 * Selve regnestykket står i lib/boksalg/economy.ts (med tester).
 */
export const BookEconomy: GlobalConfig = {
  slug: "book-economy",
  label: "Bokøkonomi",
  admin: {
    // Vises kun i den egenbygde «Boka»-nav-gruppen.
    group: false,
    description:
      "Pris, kutt og utgiftsgrunnlag for «Verdifull vekst». Styrer alle tall i boksalg-dashbordet.",
  },
  access: {
    read: ({ req: { user } }) => !!user,
    update: ({ req: { user } }) => !!user,
  },
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          label: "Boka",
          description: "Grunnopplysningene alt annet regnes ut fra.",
          fields: [
            {
              name: "title",
              type: "text",
              label: "Tittel",
              defaultValue: "Verdifull vekst – i din bedrift",
              required: true,
            },
            {
              name: "isbn",
              type: "text",
              label: "ISBN",
              defaultValue: "9788230375334",
              required: true,
              admin: {
                description:
                  "Brukes til å slå opp boka hos Norli og ARK. Ny utgave eller pocket har egen ISBN.",
              },
            },
            {
              name: "releaseDate",
              type: "date",
              label: "Utgivelsesdato",
              defaultValue: "2026-10-15T00:00:00.000Z",
              admin: {
                date: {
                  pickerAppearance: "dayOnly",
                  displayFormat: "d. MMMM yyyy",
                },
                description:
                  "Før denne datoen er det forhåndssalg, og tomme butikkhyller er forventet.",
              },
            },
            {
              name: "listPrice",
              type: "number",
              label: "Utsalgspris (kr)",
              defaultValue: 399,
              required: true,
              min: 0,
              admin: {
                description:
                  "Samme pris overalt. Bøker har 0 % mva, så dette er både brutto og netto.",
              },
            },
            {
              name: "printRun",
              type: "number",
              label: "Opplag (antall trykte)",
              min: 0,
              admin: {
                description:
                  "Valgfritt. Brukes til å vise hvor mye av opplaget som er solgt. Selve trykkefakturaen føres som en utgift under Bokutgifter — boka trykkes i opplag, så trykk er en engangskostnad og ikke et fradrag per solgte bok.",
              },
            },
            {
              name: "shopProduct",
              type: "relationship",
              relationTo: "products",
              label: "Boka i nettbutikken",
              admin: {
                description:
                  "Knytt til produktet på poynt.no. Da telles faktiske bestillinger med i dashbordet — de er eksakte, i motsetning til butikk-estimatene.",
              },
            },
          ],
        },
        {
          label: "Fordeling",
          description: "Hvem tar hvor mye av hvert salg.",
          fields: [
            {
              name: "editorPercent",
              type: "number",
              label: "Redaktørens andel (%)",
              defaultValue: 10,
              min: 0,
              max: 100,
              required: true,
            },
            {
              name: "editorBasis",
              type: "select",
              label: "Redaktøren regner sin andel av",
              defaultValue: "brutto",
              required: true,
              options: [
                {
                  label: "Utsalgsprisen – altså før bokhandelen tar sitt",
                  value: "brutto",
                },
                {
                  label: "Det som står igjen etter bokhandelen",
                  value: "netto",
                },
              ],
              admin: {
                description:
                  "På et salg i bokhandel er forskjellen ca. 20 kr per bok: 39,90 mot 19,95. I egen nettbutikk er de to like, siden ingen forhandler tar noe først.",
              },
            },
          ],
        },
        {
          label: "Kanaler",
          description:
            "Én rad per sted boka selges. Nøkkelen lagres på hvert salg — ikke bytt en som er i bruk.",
          fields: [
            {
              name: "channels",
              type: "array",
              label: "Salgskanaler",
              labels: { singular: "Kanal", plural: "Kanaler" },
              defaultValue: DEFAULT_CHANNELS,
              admin: {
                initCollapsed: true,
                components: {
                  RowLabel: "/admin/components/row-labels#ChannelRowLabel",
                },
              },
              fields: [
                {
                  type: "row",
                  fields: [
                    {
                      name: "key",
                      type: "select",
                      label: "Kanal",
                      required: true,
                      options: CHANNEL_OPTIONS,
                      admin: { width: "50%" },
                    },
                    {
                      name: "label",
                      type: "text",
                      label: "Navn i dashbordet",
                      required: true,
                      admin: { width: "50%" },
                    },
                  ],
                },
                {
                  name: "active",
                  type: "checkbox",
                  label: "Aktiv",
                  defaultValue: true,
                },
                {
                  name: "stockSource",
                  type: "select",
                  label: "Henter lagertall fra",
                  defaultValue: "none",
                  options: STOCK_SOURCE_OPTIONS,
                  admin: {
                    description:
                      "Kanaler uten kilde får salgstall fra det som føres manuelt under «Boksalg».",
                  },
                },
                {
                  type: "collapsible",
                  label: "Kutt og gebyrer",
                  admin: { initCollapsed: true },
                  fields: [
                    {
                      type: "row",
                      fields: [
                        {
                          name: "retailerPercent",
                          type: "number",
                          label: "Forhandlerens andel (%)",
                          defaultValue: 0,
                          min: 0,
                          max: 100,
                          admin: {
                            width: "50%",
                            description: "Norli og ARK: 50.",
                          },
                        },
                        {
                          name: "distributionPercent",
                          type: "number",
                          label: "Distribusjon (%)",
                          defaultValue: 0,
                          min: 0,
                          max: 100,
                          admin: {
                            width: "50%",
                            description: "Forlagsentralen o.l.",
                          },
                        },
                      ],
                    },
                    {
                      type: "row",
                      fields: [
                        {
                          name: "distributionPerCopy",
                          type: "number",
                          label: "Distribusjon per bok (kr)",
                          defaultValue: 0,
                          min: 0,
                          admin: {
                            width: "50%",
                            description: "Plukk og pakk.",
                          },
                        },
                        {
                          name: "transactionPercent",
                          type: "number",
                          label: "Kortgebyr (%)",
                          defaultValue: 0,
                          min: 0,
                          max: 100,
                          admin: { width: "50%", description: "Stripe: 1,4." },
                        },
                      ],
                    },
                    {
                      name: "transactionPerCopy",
                      type: "number",
                      label: "Kortgebyr per bok (kr)",
                      defaultValue: 0,
                      min: 0,
                      admin: { description: "Stripe: 2." },
                    },
                  ],
                },
                {
                  name: "maxReturnPercent",
                  type: "number",
                  label: "Returrett (%)",
                  defaultValue: 0,
                  min: 0,
                  max: 100,
                  admin: {
                    description:
                      "Hvor stor del av innkjøpet bokhandelen kan sende tilbake. Norli og ARK: 50. Dashbordet viser hvor mye av det du har tjent som kan forsvinne igjen. Faktiske returer føres som «Retur fra bokhandel» under Boksalg.",
                  },
                },
              ],
            },
          ],
        },
        {
          label: "Henting",
          description:
            "Hvilke bokhandlere som sjekkes automatisk hver morgen. Tallene lagres som lagerbilder, og endringer havner i endringsloggen.",
          fields: [
            {
              name: "sources",
              type: "array",
              label: "Kilder",
              labels: { singular: "Kilde", plural: "Kilder" },
              defaultValue: [
                { sourceKey: "norli", active: true },
                { sourceKey: "ark", active: true },
              ],
              fields: [
                {
                  type: "row",
                  fields: [
                    {
                      name: "sourceKey",
                      type: "select",
                      label: "Bokhandel",
                      required: true,
                      options: SOURCE_OPTIONS,
                      admin: { width: "50%" },
                    },
                    {
                      name: "active",
                      type: "checkbox",
                      label: "Hent automatisk",
                      defaultValue: true,
                      admin: { width: "50%" },
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};
