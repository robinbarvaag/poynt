import type { CollectionConfig, Field } from "payload";
import {
  qualityDataFields,
  qualityReviewPanel,
} from "../fields/quality-review";
import { seoFaqField } from "../fields/seo-meta";
import { stockPickerAfterInput } from "../fields/stock-picker-after-input";
import { generateSlug } from "../lib/generate-slug";
import {
  revalidateCmsAfterChange,
  revalidateCmsAfterDelete,
} from "../lib/revalidate-cms";

const previewUrl = (slug: string | undefined) => {
  const base = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";
  return `${base}/api/preview?path=${encodeURIComponent(`/eventer/${slug}`)}`;
};

const isInternal = (data: Partial<{ registrationMode?: string }>) =>
  (data?.registrationMode ?? "internal") === "internal";

const dayAndTime = { date: { pickerAppearance: "dayAndTime" as const } };

const contentFields: Field[] = [
  {
    name: "title",
    type: "text",
    required: true,
    label: "Tittel",
  },
  {
    name: "excerpt",
    type: "textarea",
    required: true,
    label: "Kort beskrivelse",
    admin: {
      description:
        "Én–to setninger: hva er det, og hvorfor bør man komme? Vises i oversikten, i Google og når lenken deles.",
    },
  },
  {
    name: "heroImage",
    type: "upload",
    relationTo: "media",
    label: "Bilde",
    admin: {
      components: {
        afterInput: stockPickerAfterInput,
      },
    },
  },
  {
    type: "row",
    fields: [
      {
        name: "startsAt",
        type: "date",
        required: true,
        label: "Starter",
        admin: { ...dayAndTime, width: "50%" },
      },
      {
        name: "endsAt",
        type: "date",
        label: "Slutter",
        admin: {
          ...dayAndTime,
          width: "50%",
          description: "Valgfritt, men folk liker å vite når de er ferdige.",
        },
      },
    ],
  },
  {
    name: "doorsOpenAt",
    type: "date",
    label: "Dørene åpner",
    admin: {
      ...dayAndTime,
      description: "Valgfritt. Vises på billetten og i praktisk info.",
    },
  },
  {
    name: "location",
    type: "group",
    label: "Sted",
    fields: [
      {
        type: "row",
        fields: [
          {
            name: "name",
            type: "text",
            label: "Stedsnavn",
            admin: { width: "50%" },
          },
          {
            name: "mapUrl",
            type: "text",
            label: "Kartlenke",
            admin: {
              width: "50%",
              description: "F.eks. en lenke fra Google Maps.",
            },
          },
        ],
      },
      {
        name: "address",
        type: "textarea",
        label: "Adresse",
      },
      {
        name: "online",
        type: "checkbox",
        label: "Digitalt event",
        defaultValue: false,
      },
    ],
  },
  {
    name: "description",
    type: "richText",
    label: "Om eventet",
    admin: {
      description:
        "Hva skjer, hvem er det for, og hva sitter man igjen med? Skriv som en invitasjon, ikke en pressemelding.",
    },
  },
  {
    name: "program",
    type: "array",
    label: "Program",
    labels: { singular: "Programpunkt", plural: "Programpunkter" },
    admin: {
      initCollapsed: true,
      description: "Valgfritt. Vises som en tidslinje på eventsiden.",
      components: {
        RowLabel: "/admin/components/row-labels#ProgramRowLabel",
      },
    },
    fields: [
      {
        type: "row",
        fields: [
          {
            name: "time",
            type: "text",
            label: "Klokkeslett",
            admin: { width: "30%", placeholder: "18:00" },
          },
          {
            name: "title",
            type: "text",
            required: true,
            label: "Hva skjer",
            admin: { width: "70%" },
          },
        ],
      },
      {
        name: "description",
        type: "textarea",
        label: "Litt mer (valgfritt)",
      },
    ],
  },
  {
    name: "practicalInfo",
    type: "richText",
    label: "Praktisk info",
    admin: {
      description:
        "Parkering, mat og drikke, tilgjengelighet, hva man bør ta med. Vises på eventsiden og på billetten.",
    },
  },
  // FAQ hører til SEO, men SEO-fanen eies av pluginen — derfor her.
  seoFaqField(),
];

const registrationFields: Field[] = [
  {
    name: "registrationMode",
    type: "select",
    required: true,
    defaultValue: "internal",
    label: "Påmelding",
    options: [
      { label: "Påmelding her på nettsiden", value: "internal" },
      { label: "Lenke til et annet billettsystem", value: "external" },
      { label: "Ingen påmelding", value: "none" },
    ],
  },
  {
    type: "row",
    admin: {
      condition: (data) => data?.registrationMode === "external",
    },
    fields: [
      {
        name: "externalUrl",
        type: "text",
        label: "Lenke til påmelding",
        admin: { width: "60%" },
      },
      {
        name: "externalLabel",
        type: "text",
        label: "Knappetekst",
        defaultValue: "Kjøp billett",
        admin: { width: "40%" },
      },
    ],
  },
  {
    type: "row",
    admin: { condition: isInternal },
    fields: [
      {
        name: "capacity",
        type: "number",
        label: "Antall plasser",
        min: 0,
        admin: {
          width: "50%",
          description: "La stå tom hvis det ikke er noen grense.",
        },
      },
      {
        name: "waitlistEnabled",
        type: "checkbox",
        label: "Venteliste når det er fullt",
        defaultValue: true,
        admin: {
          width: "50%",
          description:
            "Melder noen seg av, får den første på ventelista plassen og billett på e-post automatisk.",
        },
      },
    ],
  },
  {
    name: "maxGuests",
    type: "number",
    label: "Kan ta med inntil (antall personer)",
    min: 0,
    max: 10,
    admin: {
      condition: isInternal,
      description:
        "Tom eller 0 = hver melder seg på selv. Følget får hver sin kode, og alt sendes til den som meldte på.",
    },
  },
  {
    type: "row",
    admin: { condition: isInternal },
    fields: [
      {
        name: "priceKr",
        type: "number",
        label: "Pris per person (kr)",
        min: 0,
        admin: {
          width: "50%",
          description: "Tom = gratis. Prisen er inkludert MVA.",
        },
      },
      {
        name: "vatRate",
        type: "select",
        label: "MVA-sats",
        defaultValue: "25",
        options: [
          { label: "25 % (kurs, foredrag, fest med servering)", value: "25" },
          { label: "0 % (unntatt, f.eks. rene kulturarrangement)", value: "0" },
        ],
        admin: {
          width: "50%",
          condition: (data) => Boolean(data?.priceKr),
          description:
            "Brukes på kvitteringen. Usikker? Avklar med regnskapsfører.",
        },
      },
    ],
  },
  {
    name: "paymentMethods",
    type: "select",
    hasMany: true,
    label: "Betaling med",
    defaultValue: ["vipps", "stripe"],
    options: [
      { label: "Vipps", value: "vipps" },
      { label: "Kort", value: "stripe" },
    ],
    admin: {
      condition: (data) => isInternal(data) && Boolean(data?.priceKr),
      description:
        "Plassen holdes av i 30 minutter mens personen betaler. Betalte billetter meldes av og refunderes fra «Påmeldte».",
    },
  },
  {
    type: "row",
    admin: { condition: isInternal },
    fields: [
      {
        name: "registrationOpensAt",
        type: "date",
        label: "Påmeldingen åpner",
        admin: {
          ...dayAndTime,
          width: "50%",
          description: "Tom = åpen med en gang eventet er publisert.",
        },
      },
      {
        name: "registrationClosesAt",
        type: "date",
        label: "Påmeldingsfrist",
        admin: {
          ...dayAndTime,
          width: "50%",
          description: "Tom = åpen helt til eventet starter.",
        },
      },
    ],
  },
  {
    name: "ticketsEnabled",
    type: "checkbox",
    label: "Send kode og QR-kode til de påmeldte",
    defaultValue: true,
    admin: {
      condition: isInternal,
      description:
        "Da kan dere skanne folk inn i døra og se hvor mange som faktisk kom.",
    },
  },
  {
    name: "newsletterOptIn",
    type: "checkbox",
    label: "Spør om de vil ha nyhetsbrevet",
    defaultValue: true,
    admin: {
      condition: isInternal,
      description:
        "Viser en avkrysningsboks (aldri forhåndsavhuket) i skjemaet. Påmeldinger via eventet merkes med eventets navn.",
    },
  },
  {
    name: "extraQuestions",
    type: "array",
    label: "Ekstra spørsmål",
    labels: { singular: "Spørsmål", plural: "Spørsmål" },
    admin: {
      condition: isInternal,
      initCollapsed: true,
      description:
        "Navn og e-post er alltid med. Spør bare om det dere faktisk bruker — svarene slettes automatisk to uker etter eventet. Allergier og andre helseopplysninger er sensitive: spør bare hvis dere trenger det (f.eks. når dere serverer mat), og la spørsmålet være frivillig.",
      components: {
        RowLabel: "/admin/components/row-labels#QuestionRowLabel",
      },
    },
    fields: [
      {
        type: "row",
        fields: [
          {
            name: "label",
            type: "text",
            required: true,
            label: "Spørsmål",
            admin: { width: "60%" },
          },
          {
            name: "type",
            type: "select",
            required: true,
            defaultValue: "text",
            label: "Type svar",
            options: [
              { label: "Kort tekst", value: "text" },
              { label: "Lang tekst", value: "textarea" },
              { label: "Ja/nei (avkrysning)", value: "checkbox" },
              { label: "Velg fra liste", value: "select" },
            ],
            admin: { width: "40%" },
          },
        ],
      },
      {
        name: "options",
        type: "text",
        hasMany: true,
        label: "Valg",
        admin: {
          condition: (_, sibling) => sibling?.type === "select",
          description: "Skriv ett valg og trykk Enter.",
        },
      },
      {
        name: "required",
        type: "checkbox",
        label: "Må besvares",
        defaultValue: false,
      },
      {
        name: "name",
        type: "text",
        label: "Teknisk navn",
        admin: {
          readOnly: true,
          description: "Lages automatisk fra spørsmålet.",
        },
      },
    ],
  },
  {
    name: "confirmationMessage",
    type: "textarea",
    label: "Ekstra hilsen i bekreftelsen",
    admin: {
      condition: isInternal,
      description:
        "Valgfritt. Kommer først i e-posten de påmeldte får, f.eks. «Så gøy at du kommer!».",
    },
  },
];

export const Events: CollectionConfig = {
  slug: "events",
  labels: {
    singular: "Event",
    plural: "Eventer",
  },
  admin: {
    components: {
      edit: {
        beforeDocumentControls: [
          "/admin/components/open-on-site-button#OpenOnSiteButton",
        ],
      },
    },
    useAsTitle: "title",
    defaultColumns: ["title", "startsAt", "registrationMode", "qualityScore"],
    group: "Innhold",
    livePreview: {
      url: ({ data }) => previewUrl(data?.slug),
    },
    preview: (doc) => (doc?.slug ? previewUrl(doc.slug as string) : null),
  },
  versions: {
    drafts: {
      autosave: true,
    },
  },
  defaultSort: "-startsAt",
  hooks: {
    beforeChange: [
      ({ data }) => {
        if (!data.slug && data.title) {
          data.slug = generateSlug(data.title);
        }
        // Svarene lagres under et stabilt teknisk navn. Det settes én gang,
        // så en omformulert spørsmålstekst ikke kobler fra gamle svar.
        if (Array.isArray(data.extraQuestions)) {
          const used = new Set<string>();
          for (const question of data.extraQuestions) {
            let name =
              question.name || generateSlug(question.label ?? "") || "sporsmal";
            while (used.has(name)) name = `${name}-2`;
            used.add(name);
            question.name = name;
          }
        }
        return data;
      },
    ],
    // Påmeldingene er personopplysninger som bare gjelder dette eventet —
    // de slettes sammen med det (ellers ville fremmednøkkelen også stoppet
    // slettingen).
    beforeDelete: [
      async ({ id, req }) => {
        await req.payload.delete({
          collection: "event-registrations",
          where: { event: { equals: id } },
          overrideAccess: true,
          req,
        });
      },
    ],
    afterChange: [revalidateCmsAfterChange],
    afterDelete: [revalidateCmsAfterDelete],
  },
  fields: [
    {
      // Samme mønster som Tjenester: tabs-feltet står først, så seoPlugin
      // (tabbedUI) legger «SEO»-fanen til på slutten.
      type: "tabs",
      tabs: [
        {
          label: "Innhold",
          description: "Selve eventsiden.",
          fields: contentFields,
        },
        {
          label: "Påmelding",
          description:
            "Hvordan folk melder seg på, hvor mange som får plass, og hva de får tilsendt.",
          fields: registrationFields,
        },
        {
          label: "Påmeldte",
          description:
            "Hvem som har meldt seg på, står på venteliste, har meldt seg av eller har kommet.",
          fields: [
            {
              name: "pameldte",
              type: "ui",
              admin: {
                components: {
                  Field:
                    "/admin/components/events/registrations-panel#RegistrationsPanel",
                },
              },
            },
          ],
        },
        {
          label: "Hjelp og kvalitet",
          description:
            "Tips og sjekklister som hjelper deg mens du skriver. Ingenting her vises på nettsiden.",
          fields: [
            {
              name: "retningslinjer",
              type: "ui",
              admin: {
                components: {
                  Field:
                    "/admin/components/content-guidelines#ContentGuidelines",
                },
              },
            },
            {
              name: "eventsjekk",
              type: "ui",
              admin: {
                components: {
                  Field: "/admin/components/text-check#TextCheck",
                },
              },
            },
            qualityReviewPanel(),
          ],
        },
      ],
    },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      index: true,
      label: "URL-slug",
      admin: {
        position: "sidebar",
        description: "Genereres automatisk fra tittelen",
      },
    },
    {
      name: "eventStatus",
      type: "select",
      required: true,
      defaultValue: "scheduled",
      label: "Status",
      options: [
        { label: "Blir av", value: "scheduled" },
        { label: "Utsatt", value: "postponed" },
        { label: "Avlyst", value: "cancelled" },
      ],
      admin: {
        position: "sidebar",
        description:
          "Avlyst eller utsatt stenger påmeldingen og vises tydelig på siden. Si også fra til de påmeldte.",
      },
    },
    ...qualityDataFields({ sidebarSection: true }),
  ],
};
