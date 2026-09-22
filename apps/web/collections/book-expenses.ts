import type { CollectionConfig } from "payload";
import { EXPENSE_CATEGORIES } from "../lib/boksalg/constants";

/**
 * Alt boka har kostet å lage. Summen her er nevneren i break-even-regnestykket
 * på /intern/boksalg: hvor mange bøker må selges før utgivelsen går i null.
 *
 * Én rad per faktura, ikke per kategori — da kan Susanne se hvilke to design-
 * fakturaer som utgjør de 121 250 kronene, og legge ved kvitteringen.
 */
export const BookExpenses: CollectionConfig = {
  slug: "book-expenses",
  labels: {
    singular: "Bokutgift",
    plural: "Bokutgifter",
  },
  admin: {
    useAsTitle: "description",
    defaultColumns: ["date", "category", "description", "amount", "supplier"],
    // Vises kun i den egenbygde «Boka»-nav-gruppen.
    group: false,
    description:
      "Utgiftene til «Verdifull vekst». Summen avgjør hvor mange bøker som må selges før boka går i null.",
    listSearchableFields: ["description", "supplier"],
  },
  access: {
    read: ({ req: { user } }) => !!user,
    create: ({ req: { user } }) => !!user,
    update: ({ req: { user } }) => !!user,
    delete: ({ req: { user } }) => !!user,
  },
  defaultSort: "-date",
  fields: [
    {
      name: "description",
      type: "text",
      label: "Hva gjelder det",
      required: true,
      admin: {
        description: "F.eks. «Omslagsdesign, andre faktura».",
      },
    },
    {
      type: "row",
      fields: [
        {
          name: "amount",
          type: "number",
          label: "Beløp (kr)",
          required: true,
          min: 0,
          admin: { width: "50%" },
        },
        {
          name: "date",
          type: "date",
          label: "Dato",
          required: true,
          defaultValue: () => new Date().toISOString(),
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
      type: "row",
      fields: [
        {
          name: "category",
          type: "select",
          label: "Kategori",
          required: true,
          options: [...EXPENSE_CATEGORIES],
          admin: { width: "50%" },
        },
        {
          name: "supplier",
          type: "text",
          label: "Leverandør",
          admin: { width: "50%" },
        },
      ],
    },
    {
      name: "attachment",
      type: "upload",
      relationTo: "media",
      label: "Kvittering eller faktura",
      admin: {
        description: "Valgfritt, men greit å ha samlet ett sted.",
      },
    },
    {
      name: "notes",
      type: "textarea",
      label: "Notat",
    },
  ],
};
