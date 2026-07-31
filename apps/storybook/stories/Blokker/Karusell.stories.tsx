import { Carousel, type CarouselItem, Section } from "@poynt/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";

const photo = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=70`;

/** Samme kilde, men i et gitt format — for eksempler som viser bildeformat. */
const sizedPhoto = (id: string, w: number, h: number) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&h=${h}&q=70`;

const BILDER: CarouselItem[] = [
  {
    id: "1",
    src: photo("photo-1522071820081-009f0129c71c"),
    alt: "Team i møte rundt et bord",
    eyebrow: "Kundehistorie",
    title: "Fra kaos til kalender",
    text: "Slik fikk Nordvest Elektro kontroll på innholdet sitt.",
  },
  {
    id: "2",
    src: photo("photo-1517245386807-bb43f82c33c4"),
    alt: "Notatbok og kaffe på et skrivebord",
    eyebrow: "Guide",
    title: "Årshjulet som faktisk holder",
    text: "Tolv måneder planlagt på en ettermiddag.",
  },
  {
    id: "3",
    src: photo("photo-1600880292203-757bb62b4baf"),
    alt: "To personer som samarbeider foran en skjerm",
    eyebrow: "Kurs",
    title: "Kom i gang med AI",
    text: "Uten fagord, uten hype — bare det du trenger.",
  },
  {
    id: "4",
    src: photo("photo-1543269865-cbf427effbad"),
    alt: "Gruppe rundt et bord med bærbare maskiner",
    eyebrow: "Fellesskap",
    title: "Avdelingsmøte hver uke",
    text: "Del, spør og få tilbakemelding fra andre.",
  },
  {
    id: "5",
    src: photo("photo-1531482615713-2afd69097998"),
    alt: "Person som jobber ved en laptop",
    eyebrow: "Verktøy",
    title: "Kanalveilederen",
    text: "Finn ut hvor du faktisk bør være til stede.",
  },
];

const LOGOER: CarouselItem[] = [
  "Nordvest Elektro",
  "Fjordbygg",
  "Havlys",
  "Trygg Regnskap",
  "Kysten Kafé",
  "Solvang Tannklinikk",
  "Bratt & Bratt",
].map((name, index) => ({
  id: `logo-${index}`,
  kind: "logo" as const,
  title: name,
}));

const TEKSTKORT: CarouselItem[] = [
  {
    id: "t1",
    kind: "content",
    eyebrow: "Steg 01",
    title: "Kartlegg",
    text: "Vi begynner med hva bedriften din faktisk driver med — ikke med en mal.",
  },
  {
    id: "t2",
    kind: "content",
    eyebrow: "Steg 02",
    title: "Prioriter",
    text: "Du kan ikke være overalt. Vi finner de to kanalene som er verdt tiden din.",
  },
  {
    id: "t3",
    kind: "content",
    eyebrow: "Steg 03",
    title: "Planlegg",
    text: "Et årshjul du rekker å følge, med innhold som henger sammen.",
  },
  {
    id: "t4",
    kind: "content",
    eyebrow: "Steg 04",
    title: "Publiser",
    text: "Og så gjentar vi det — hver måned, uten at det blir et prosjekt.",
  },
];

const meta: Meta<typeof Carousel> = {
  title: "Blokker/Karusell",
  component: Carousel,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Karusell bygget på Embla. Én komponent for fire slags innhold — bilde, " +
          "video, logo og tekstkort — med valgbar bevegelses-effekt som følger " +
          "fingeren i stedet for å spille av en fast animasjon. Effektene skrus " +
          "automatisk av når nettleseren melder «prefers-reduced-motion».",
      },
    },
  },
  argTypes: {
    presentation: {
      control: "inline-radio",
      options: ["media", "overlay", "card"],
    },
    effect: {
      control: "inline-radio",
      options: ["none", "parallax", "scale", "opacity", "depth"],
    },
    slidesPerView: { control: { type: "range", min: 1, max: 5, step: 1 } },
    aspect: {
      control: "inline-radio",
      options: ["wide", "video", "square", "portrait", "auto"],
    },
  },
  render: (args) => (
    <Section spacing="lg">
      <Carousel {...args} />
    </Section>
  ),
};
export default meta;

type Story = StoryObj<typeof Carousel>;

export const Standard: Story = {
  name: "Bare bilder",
  parameters: {
    docs: {
      description: {
        story:
          "Standardvisningen: ren flate, ingen tekst. Elementene kan gjerne " +
          "ha tittel i dataene — den vises bare ikke her.",
      },
    },
  },
  args: {
    eyebrow: "Utvalgt",
    title: "Det siste fra Poynt",
    intro: "Guider, kurs og historier fra folk som har gjort jobben.",
    items: BILDER,
    presentation: "media",
    effect: "none",
    slidesPerView: 3,
  },
};

export const TittelOppaaBildet: Story = {
  name: "Tittel oppå bildet",
  parameters: {
    docs: {
      description: {
        story:
          "Etikett og tittel oppå media. Tittelen klippes til to linjer og " +
          "ingressen vises ikke — teksten ligger i en boks med fast høyde, " +
          "og alt som ikke får plass ville blitt klippet vekk øverst.",
      },
    },
  },
  args: {
    ...Standard.args,
    presentation: "overlay",
  },
};

export const KortMedTekst: Story = {
  name: "Kort med tekst under",
  parameters: {
    docs: {
      description: {
        story:
          "Bilde øverst, tekst under. Riktig valg når slide-en faktisk skal " +
          "presentere noe — teksten flyter naturlig, så ingenting klippes.",
      },
    },
  },
  args: {
    ...Standard.args,
    presentation: "card",
  },
};

export const Parallax: Story = {
  name: "Parallax",
  args: {
    ...Standard.args,
    eyebrow: "Parallax",
    title: "Bildet henger litt igjen",
    intro:
      "Bildet inne i ramma glir saktere enn ramma selv. Dra sakte for å se det.",
    effect: "parallax",
    slidesPerView: 2,
    aspect: "video",
  },
};

export const Skalering: Story = {
  name: "Skalering",
  args: {
    ...Standard.args,
    eyebrow: "Skalering",
    title: "Den aktive står størst",
    intro: "Naboene krymper litt, så blikket blir liggende i midten.",
    effect: "scale",
    slidesPerView: 3,
    align: "center",
  },
};

export const Gjennomsiktighet: Story = {
  name: "Gjennomsiktighet",
  args: {
    ...Standard.args,
    eyebrow: "Gjennomsiktighet",
    title: "Naboene tones ned",
    intro: "Roligst av effektene — fungerer også når slidene har mye tekst.",
    effect: "opacity",
    slidesPerView: 3,
  },
};

export const Dybde: Story = {
  name: "Dybde (scale + opacity)",
  args: {
    ...Standard.args,
    eyebrow: "Dybde",
    title: "Skalering og gjennomsiktighet sammen",
    intro: "Én stor i fokus, resten trekker seg tilbake.",
    effect: "depth",
    slidesPerView: 1,
    aspect: "wide",
    align: "center",
  },
};

export const EnOmGangen: Story = {
  name: "Én om gangen",
  parameters: {
    docs: {
      description: {
        story:
          "Én slide om gangen er aldri full bredde: den sentreres og holdes " +
          "smalere enn ramma, så naboene stikker fram i begge kanter. Uten " +
          "det leses karusellen som et stillbilde — og nabo-effektene " +
          "(skalering/gjennomsiktighet/dybde) er usynlige, siden de bare " +
          "påvirker slidene rundt den aktive.",
      },
    },
  },
  args: {
    eyebrow: "Kundehistorier",
    title: "Én stor flate",
    items: BILDER,
    effect: "parallax",
    slidesPerView: 1,
    aspect: "wide",
  },
};

export const ToElementer: Story = {
  name: "Bare to elementer",
  parameters: {
    docs: {
      description: {
        story:
          "Med for få elementer kan ikke Embla gå i ring: den måtte lånt de " +
          "samme bildene inn på begge sider, og leseren ville sett samme " +
          "bilde to ganger side om side. Karusellen slår derfor av `loop` av " +
          "seg selv og stopper i endene i stedet. Naboen tones ned så det er " +
          "tydelig hvilken som er den aktive.",
      },
    },
  },
  args: {
    eyebrow: "To bilder",
    title: "Stopper i endene",
    items: BILDER.slice(0, 2),
    slidesPerView: 1,
    loop: true,
  },
};

export const FolgerBildet: Story = {
  name: "Følger bildet (eget format)",
  parameters: {
    docs: {
      description: {
        story:
          '`aspect: "auto"` lar hvert bilde beholde sitt eget format i ' +
          "stedet for å beskjæres til en felles ramme. Riktig valg for " +
          "skjermbilder og stående bilder, der en 16:9-ramme klipper vekk " +
          "toppen og bunnen. Krever at bildets mål er kjent (`aspectRatio`) " +
          "— appen sender dem med fra Payload.",
      },
    },
  },
  args: {
    eyebrow: "Skjermbilder",
    title: "Beholder sitt eget format",
    // Bildene hentes i SAMME format som `aspectRatio` sier, ellers ville
    // eksempelet vist en beskjæring det påstår ikke skjer.
    items: [
      {
        id: "p1",
        src: sizedPhoto("photo-1512941937669-90a1b58e7e9c", 900, 1200),
        alt: "Stående bilde",
        aspectRatio: 3 / 4,
      },
      {
        id: "p2",
        src: sizedPhoto("photo-1522071820081-009f0129c71c", 1200, 675),
        alt: "Liggende bilde",
        aspectRatio: 16 / 9,
      },
      {
        id: "p3",
        src: sizedPhoto("photo-1531482615713-2afd69097998", 900, 900),
        alt: "Kvadratisk bilde",
        aspectRatio: 1,
      },
    ],
    slidesPerView: 1,
    aspect: "auto",
  },
};

export const UtenOverskrift: Story = {
  name: "Uten overskrift (piler til høyre)",
  parameters: {
    docs: {
      description: {
        story:
          "Uten eyebrow/tittel/ingress returnerer SectionHeader null. Da må " +
          "pilene høyrestilles eksplisitt — ellers ble de stående alene til " +
          "venstre over karusellen.",
      },
    },
  },
  args: {
    items: BILDER,
    slidesPerView: 3,
  },
};

export const EnOmGangenDybde: Story = {
  name: "Én om gangen + dybde",
  parameters: {
    docs: {
      description: {
        story:
          "Samme oppsett med `depth`. Nå har effekten noe å virke på: naboene " +
          "i kantene krymper og tones ned mens den aktive står full styrke.",
      },
    },
  },
  args: {
    eyebrow: "Kundehistorier",
    title: "Naboene trekker seg tilbake",
    items: BILDER,
    effect: "depth",
    slidesPerView: 1,
    aspect: "wide",
  },
};

export const Logostripe: Story = {
  name: "Logostripe (kontinuerlig)",
  parameters: {
    docs: {
      description: {
        story:
          "`autoScroll` gir en jevn strøm som stopper når musa er over. " +
          "Uten opplastet logo vises navnet som en typografisk wordmark, " +
          "akkurat som i LogoCloud.",
      },
    },
  },
  args: {
    eyebrow: "Brukt av folk fra",
    items: LOGOER,
    autoScroll: true,
  },
};

export const Tekstkort: Story = {
  name: "Tekstkort",
  args: {
    eyebrow: "Slik jobber vi",
    title: "Fire steg, ingen mystikk",
    items: TEKSTKORT,
    effect: "scale",
    slidesPerView: 3,
    aspect: "auto",
  },
};

export const Video: Story = {
  name: "Video",
  parameters: {
    docs: {
      description: {
        story:
          "Videoslides spilles stille i loop — de er flater, ikke avspillere. " +
          "Trenger du lyd og kontroller er `VideoPlayer` riktig komponent.",
      },
    },
  },
  args: {
    eyebrow: "I bevegelse",
    title: "Video som flate",
    items: [
      {
        id: "v1",
        kind: "video",
        src: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
        alt: "Blomst som åpner seg",
        title: "Stille loop",
      },
      {
        id: "v2",
        src: photo("photo-1522071820081-009f0129c71c"),
        alt: "Team i møte",
        title: "Blandet med bilde",
      },
    ] satisfies CarouselItem[],
    slidesPerView: 2,
    effect: "depth",
  },
};

export const AutomatiskBytte: Story = {
  name: "Automatisk bytte",
  args: {
    ...Standard.args,
    title: "Bytter av seg selv",
    intro: "Stopper med en gang noen tar i den, eller holder musa over.",
    autoplay: 4,
    effect: "opacity",
  },
};
