import type { Block } from "payload";
import {
  FORECAST_MONTHLY_NEED,
  HOURLY_MULTIPLIER,
  PROFIT_EXAMPLE,
} from "../lib/vekst/book-content";
import {
  vekstAppearance,
  vekstHeaderFields,
  vekstLinkFields,
} from "./vekst-fields";

/**
 * Kalkulatorene fra «Verdifull vekst»: lønnsomhet, timepris og spåkula for
 * salg. Leseren regner på egne tall i nettleseren; ingenting lagres hos oss.
 */
export const GrowthCalculator: Block = {
  slug: "growthCalculator",
  interfaceName: "GrowthCalculatorBlock",
  admin: {
    custom: {
      description:
        "Interaktiv kalkulator fra boka «Verdifull vekst»: lønnsomhet (med Gudruns komler), timepris eller spåkula for salg. Velg med «calculator». Leseren regner på egne tall i nettleseren.",
    },
  },
  labels: {
    singular: "Kalkulator (Verdifull vekst)",
    plural: "Kalkulatorer (Verdifull vekst)",
  },
  fields: [
    {
      name: "calculator",
      type: "select",
      required: true,
      label: "Hvilken kalkulator?",
      defaultValue: "profit",
      options: [
        { label: "Lønnsomhet", value: "profit" },
        { label: "Timepris", value: "hourly" },
        { label: "Spåkula for salg", value: "forecast" },
      ],
    },
    ...vekstHeaderFields,
    {
      name: "profitExample",
      type: "group",
      label: "Eksempel leseren kan prøve",
      admin: {
        condition: (_, siblingData) => siblingData?.calculator === "profit",
        description:
          "Lastes inn med én knapp. La knappeteksten stå tom for å skjule eksempelet.",
      },
      fields: [
        {
          type: "row",
          fields: [
            {
              name: "label",
              type: "text",
              label: "Knappetekst",
              defaultValue: PROFIT_EXAMPLE.label,
              admin: { width: "50%" },
            },
            {
              name: "price",
              type: "number",
              label: "Pris (kr)",
              defaultValue: PROFIT_EXAMPLE.price,
              admin: { width: "25%" },
            },
            {
              name: "cost",
              type: "number",
              label: "Kostnad (kr)",
              defaultValue: PROFIT_EXAMPLE.cost,
              admin: { width: "25%" },
            },
          ],
        },
        {
          name: "costLabel",
          type: "text",
          label: "Hva kostnaden er",
          defaultValue: PROFIT_EXAMPLE.costLabel,
        },
        {
          name: "note",
          type: "textarea",
          label: "Historien bak eksempelet",
          defaultValue: PROFIT_EXAMPLE.note,
        },
      ],
    },
    {
      name: "multiplier",
      type: "number",
      label: "Påslag på lønn",
      defaultValue: HOURLY_MULTIPLIER,
      min: 1,
      max: 3,
      admin: {
        condition: (_, siblingData) => siblingData?.calculator === "hourly",
        step: 0.1,
        description: "Tommelfingerregelen i boka er lønn × 1,5 for AS.",
      },
    },
    {
      name: "monthlyNeed",
      type: "number",
      label: "Må inn per måned (eksempel)",
      defaultValue: FORECAST_MONTHLY_NEED,
      min: 0,
      admin: {
        condition: (_, siblingData) => siblingData?.calculator === "forecast",
        description:
          "Hagesenteret i boka må ha inn 127 000 kr i måneden. Leseren bytter selv til sine egne tall.",
      },
    },
    {
      name: "footnote",
      type: "text",
      label: "Liten tekst under kalkulatoren",
      admin: { description: "F.eks. «Tallene er veiledende»." },
    },
    vekstLinkFields(),
    vekstAppearance(),
  ],
};
