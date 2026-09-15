import type { Block } from "payload";
import { SALES_RITUAL, ritualChecklistCms } from "../lib/vekst/book-content";
import { vekstAppearance, vekstHeaderFields } from "./vekst-fields";

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * Omsetnings-onsdag: en fast salgsøkt i uka med kalenderblad som rives av,
 * sjekkliste som huskes i nettleseren, og «Legg i kalenderen» (.ics).
 */
export const SalesRitual: Block = {
  slug: "salesRitual",
  interfaceName: "SalesRitualBlock",
  labels: {
    singular: "Fast salgsøkt (Verdifull vekst)",
    plural: "Faste salgsøkter (Verdifull vekst)",
  },
  fields: [
    ...vekstHeaderFields,
    {
      name: "ritualName",
      type: "text",
      required: true,
      label: "Navn på økta",
      defaultValue: SALES_RITUAL.ritualName,
      admin: {
        description: "Blir også navnet på avtalen i kalenderen.",
      },
    },
    {
      type: "row",
      fields: [
        {
          name: "weekday",
          type: "select",
          required: true,
          label: "Ukedag",
          defaultValue: SALES_RITUAL.weekday,
          options: [
            { label: "Mandag", value: "MO" },
            { label: "Tirsdag", value: "TU" },
            { label: "Onsdag", value: "WE" },
            { label: "Torsdag", value: "TH" },
            { label: "Fredag", value: "FR" },
            { label: "Lørdag", value: "SA" },
            { label: "Søndag", value: "SU" },
          ],
          admin: { width: "34%" },
        },
        {
          name: "startTime",
          type: "text",
          required: true,
          label: "Starter",
          defaultValue: SALES_RITUAL.startTime,
          validate: (value: unknown) =>
            (typeof value === "string" && TIME.test(value)) ||
            "Skriv tiden som TT:MM, f.eks. 09:00",
          admin: { width: "33%", placeholder: "09:00" },
        },
        {
          name: "durationMinutes",
          type: "number",
          required: true,
          label: "Varighet (minutter)",
          defaultValue: SALES_RITUAL.durationMinutes,
          min: 15,
          max: 720,
          admin: { width: "33%" },
        },
      ],
    },
    {
      name: "quote",
      type: "textarea",
      label: "Sitat over sjekklista",
      defaultValue: SALES_RITUAL.quote,
    },
    {
      name: "checklist",
      type: "array",
      label: "Sjekkliste",
      labels: { singular: "Punkt", plural: "Punkter" },
      minRows: 1,
      defaultValue: ritualChecklistCms,
      fields: [{ name: "item", type: "text", required: true, label: "Punkt" }],
    },
    {
      name: "calendarDescription",
      type: "textarea",
      label: "Beskrivelse i kalenderavtalen",
      defaultValue: SALES_RITUAL.calendarDescription,
    },
    vekstAppearance(),
  ],
};
