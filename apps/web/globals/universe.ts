import type { GlobalConfig } from "payload";
import { revalidateCmsAfterChange } from "../lib/revalidate-cms";

/**
 * Rammen rundt «Verdifull vekst-universet» — selve innholdet ligger på den
 * vanlige sida med slug `verdifull-vekst-universet`, men toppen og broa
 * nederst hører til rommet, ikke til innholdet. De styres herfra.
 *
 * Tanken bak oppsettet: mens man er inne i universet peker navigasjonen
 * innover (kapittelmenyen på sida), og veien ut til resten av poynt.no ligger
 * diskret i toppen og ordentlig nederst — der man kommer etter å ha vært
 * gjennom det man kom for.
 */
export const Universe: GlobalConfig = {
  slug: "universe",
  label: "Verdifull vekst-universet",
  admin: {
    group: "Sideoppsett",
    description:
      "Toppen og bunnen av universet. Selve innholdet redigerer du på sida «Verdifull vekst-universet» under Sider.",
  },
  hooks: {
    afterChange: [revalidateCmsAfterChange],
  },
  fields: [
    {
      name: "header",
      type: "group",
      label: "Toppen",
      admin: {
        description:
          "Universet har ingen vanlig meny i toppen — det er meningen. Da blir folk værende i det de holder på med, i stedet for å bli dratt ut i nettstedet midtveis.",
      },
      fields: [
        {
          name: "label",
          type: "text",
          label: "Navn ved siden av logoen",
          defaultValue: "Verdifull vekst",
          admin: {
            description:
              "Sier hvor man er. Hold det kort — to–tre ord. Tomt felt gjemmer navnet, så bare logoen står igjen.",
          },
        },
        {
          name: "showExit",
          type: "checkbox",
          label: "Vis vei ut til nettstedet",
          defaultValue: true,
          admin: {
            description:
              "En liten lenke øverst til høyre. Skrur du den av, er bunnteksten eneste vei videre.",
          },
        },
        {
          name: "exitLabel",
          type: "text",
          label: "Tekst på veien ut",
          defaultValue: "Til poynt.no",
          admin: {
            condition: (data) => data?.header?.showExit !== false,
          },
        },
      ],
    },
    {
      name: "outro",
      type: "group",
      label: "Broa nederst",
      admin: {
        description:
          "Møtet med Poynt, rett over bunnteksten. Den står her og ikke i toppen fordi folk er mye mer nysgjerrige på hvem som står bak etter at de har fått det de kom for.",
      },
      fields: [
        {
          name: "enabled",
          type: "checkbox",
          label: "Vis broa",
          defaultValue: true,
        },
        {
          name: "eyebrow",
          type: "text",
          label: "Stikktittel",
          defaultValue: "Del av Poynt",
          admin: {
            description: "Den lille teksten over overskriften.",
            condition: (data) => data?.outro?.enabled !== false,
          },
        },
        {
          name: "title",
          type: "text",
          label: "Overskrift",
          defaultValue: "Universet er laget av Poynt",
          admin: {
            condition: (data) => data?.outro?.enabled !== false,
          },
        },
        {
          name: "intro",
          type: "textarea",
          label: "Ingress",
          defaultValue:
            "Vi hjelper små bedrifter med endring, salg og markedsføring — i praksis, ikke i teorien.",
          admin: {
            description: "Én–to setninger om hva dere gjør.",
            condition: (data) => data?.outro?.enabled !== false,
          },
        },
        {
          name: "primaryCta",
          type: "group",
          label: "Hovedknapp",
          admin: {
            condition: (data) => data?.outro?.enabled !== false,
          },
          fields: [
            {
              type: "row",
              fields: [
                {
                  name: "text",
                  type: "text",
                  label: "Knappetekst",
                  defaultValue: "Se hva vi driver med",
                  admin: { width: "50%" },
                },
                {
                  name: "url",
                  type: "text",
                  label: "Lenke",
                  defaultValue: "/",
                  admin: {
                    width: "50%",
                    description: "F.eks. «/» for forsiden eller «/tjenester».",
                  },
                },
              ],
            },
          ],
        },
        {
          name: "secondaryCta",
          type: "group",
          label: "Andreknapp",
          admin: {
            description: "La knappeteksten stå tom for å droppe knappen.",
            condition: (data) => data?.outro?.enabled !== false,
          },
          fields: [
            {
              type: "row",
              fields: [
                {
                  name: "text",
                  type: "text",
                  label: "Knappetekst",
                  defaultValue: "Ta kontakt",
                  admin: { width: "50%" },
                },
                {
                  name: "url",
                  type: "text",
                  label: "Lenke",
                  defaultValue: "/kontakt",
                  admin: { width: "50%" },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};
