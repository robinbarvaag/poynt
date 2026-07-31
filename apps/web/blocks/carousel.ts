import type { Block } from "payload";

/** Sant når slide-en er av en av de oppgitte typene. */
const isKind =
  (...kinds: string[]) =>
  (_data: unknown, siblingData: Record<string, unknown>) =>
    kinds.includes((siblingData?.kind as string) ?? "image");

export const Carousel: Block = {
  slug: "carousel",
  interfaceName: "CarouselBlock",
  labels: { singular: "Karusell", plural: "Karuseller" },
  fields: [
    {
      name: "eyebrow",
      type: "text",
      label: "Etikett (liten tekst over tittel)",
    },
    { name: "title", type: "text", label: "Tittel" },
    { name: "intro", type: "textarea", label: "Ingress" },
    {
      name: "slides",
      type: "array",
      label: "Elementer",
      labels: { singular: "Element", plural: "Elementer" },
      minRows: 1,
      admin: {
        description:
          "Hvert element kan være et bilde, en video, en logo eller et tekstkort. Bruk samme type gjennom hele karusellen — blander du typer blir den rotete.",
      },
      fields: [
        {
          name: "kind",
          type: "select",
          label: "Type",
          defaultValue: "image",
          required: true,
          options: [
            { label: "Bilde", value: "image" },
            { label: "Video", value: "video" },
            { label: "Logo", value: "logo" },
            { label: "Tekstkort", value: "content" },
          ],
        },
        {
          name: "image",
          type: "upload",
          relationTo: "media",
          label: "Bilde",
          admin: { condition: isKind("image", "logo") },
        },
        {
          name: "videoFile",
          type: "upload",
          relationTo: "media",
          label: "Videofil",
          admin: {
            description:
              "MP4 eller WebM. Videoen spilles stille i loop — trenger du lyd og kontroller, bruk en videoblokk i stedet.",
            condition: isKind("video"),
          },
        },
        {
          name: "poster",
          type: "upload",
          relationTo: "media",
          label: "Plakatbilde",
          admin: {
            description: "Vises mens videoen laster.",
            condition: isKind("video"),
          },
        },
        {
          name: "eyebrow",
          type: "text",
          label: "Etikett",
          admin: { condition: isKind("image", "video", "content") },
        },
        {
          name: "title",
          type: "text",
          label: "Tittel",
          admin: {
            description:
              "På logo brukes dette som navn — og som tekst hvis du ikke laster opp et bilde.",
          },
        },
        {
          name: "text",
          type: "textarea",
          label: "Tekst",
          admin: { condition: isKind("image", "video", "content") },
        },
        {
          name: "href",
          type: "text",
          label: "Lenke (valgfri)",
          admin: { description: "Gjør hele elementet klikkbart." },
        },
      ],
    },
    {
      // Presentasjonsvalg samlet nederst (kun visning — samme feltnavn/skjema).
      type: "collapsible",
      label: "Utseende",
      admin: { initCollapsed: true },
      fields: [
        {
          name: "presentation",
          type: "select",
          label: "Visning",
          defaultValue: "media",
          options: [
            { label: "Bare bilde/video", value: "media" },
            { label: "Tittel oppå bildet", value: "overlay" },
            { label: "Kort med tekst under bildet", value: "card" },
          ],
          admin: {
            description:
              "«Bare bilde/video» viser ingen tekst — bildene er hele poenget. «Tittel oppå bildet» tar med etikett og tittel (maks to linjer, ingen ingress). Skal elementene presentere noe med både tittel og ingress, velg kortet. Gjelder ikke logo og tekstkort.",
          },
        },
        {
          name: "effect",
          type: "select",
          label: "Bevegelse",
          defaultValue: "none",
          options: [
            { label: "Ingen (rein sveip)", value: "none" },
            { label: "Parallax (bildet henger igjen)", value: "parallax" },
            { label: "Skalering (naboene krymper)", value: "scale" },
            { label: "Gjennomsiktighet (naboene tones ned)", value: "opacity" },
            { label: "Dybde (skalering + gjennomsiktighet)", value: "depth" },
          ],
          admin: {
            description:
              "Bevegelsen følger fingeren når du drar. «Parallax» krever bilde eller video. Alle effektene skrus automatisk av for folk som har bedt om mindre bevegelse i systeminnstillingene.",
          },
        },
        {
          name: "slidesPerView",
          type: "select",
          label: "Antall synlige",
          defaultValue: "3",
          options: [
            { label: "1", value: "1" },
            { label: "2", value: "2" },
            { label: "3", value: "3" },
            { label: "4", value: "4" },
            { label: "5", value: "5" },
          ],
          admin: {
            description:
              "Gjelder på store skjermer. På mobil vises alltid én om gangen. Velger du 1, sentreres elementet og naboene stikker fram i kantene — det viser leseren at det er mer å bla i.",
          },
        },
        {
          name: "aspect",
          type: "select",
          label: "Bildeformat",
          defaultValue: "video",
          options: [
            { label: "Bredformat (16:9)", value: "video" },
            { label: "Panorama (21:9)", value: "wide" },
            { label: "Kvadratisk (1:1)", value: "square" },
            { label: "Stående (3:4)", value: "portrait" },
            { label: "Følger bildet", value: "auto" },
          ],
          admin: {
            description:
              "Alle elementene beskjæres til samme format. «Følger bildet» lar hvert bilde beholde sitt eget format — bruk den når bildene er skjermbilder eller står på høykant, så slipper du at toppen og bunnen klippes vekk.",
          },
        },
        {
          name: "autoScroll",
          type: "checkbox",
          label: "Kontinuerlig scrolling (logo-stripe)",
          defaultValue: false,
          admin: {
            description:
              "Elementene glir jevnt forbi og stopper når musa er over. Passer logoer. Skrur av piler, prikker og automatisk bytte.",
          },
        },
        {
          name: "autoplaySeconds",
          type: "number",
          label: "Bytt automatisk etter (sekunder)",
          defaultValue: 0,
          min: 0,
          max: 30,
          admin: {
            description: "0 = av. Stopper når noen tar i karusellen.",
            condition: (_data, siblingData) => !siblingData?.autoScroll,
          },
        },
        {
          name: "loop",
          type: "checkbox",
          label: "Gå i ring",
          defaultValue: true,
          admin: {
            description:
              "Etter siste element begynner den på nytt. Krever et par elementer mer enn du viser samtidig — ellers stopper karusellen i endene i stedet for å vise de samme bildene om igjen.",
            condition: (_data, sibling) => !sibling?.autoScroll,
          },
        },
        {
          name: "showArrows",
          type: "checkbox",
          label: "Vis piler",
          defaultValue: true,
          admin: { condition: (_data, sibling) => !sibling?.autoScroll },
        },
        {
          name: "showDots",
          type: "checkbox",
          label: "Vis prikker",
          defaultValue: true,
          admin: { condition: (_data, sibling) => !sibling?.autoScroll },
        },
      ],
    },
  ],
};
