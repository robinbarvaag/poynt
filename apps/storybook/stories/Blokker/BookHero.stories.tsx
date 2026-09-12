import {
  BookCover,
  BookHero,
  Button,
  type ChapterPalette,
  ChapterRotator,
  chapterPaletteFrom,
} from "@poynt/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta: Meta<typeof BookHero> = {
  title: "Blokker/BookHero",
  component: BookHero,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Objekt-hero: løfte og handling til venstre, et fysisk objekt til høyre. " +
          "Objektet er et bokomslag i 3D (`BookCover`) eller et kort som blar gjennom " +
          "kapitler/temaer (`ChapterRotator`). Begge vipper mot pekeren. Laget for " +
          "lanseringa av «Verdifull vekst», men kortet er ikke bundet til bøker: med " +
          "lenker per kapittel er det en innholdsfortegnelse, med tall en sekvens.",
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof BookHero>;

/** Bokas egne farger (samme som apps/web/lib/book-brand.ts). */
const bookPalette: ChapterPalette = chapterPaletteFrom({
  surface: "#cdc1da",
  ink: "#33174a",
  accent: "#cbcd8e",
});

const vekst = [
  { title: "Visjon", text: "Hvor er du på vei?" },
  { title: "Endring", text: "Hva bør endres for å komme deg dit?" },
  {
    title: "Kunder og KI",
    text: "Hvor godt kjenner du kundene dine? Og hvordan kan du bruke kunstig intelligens i bedriften din?",
  },
  { title: "Salg", text: "Hvordan skaper du omsetning?" },
  { title: "Tall", text: "Teller du de riktige tingene?" },
];

export const Boklansering: Story = {
  name: "Boklansering (akrostikon)",
  args: {
    badge: "Kommer i høst",
    eyebrow: "Ny bok av Susanne Todnem",
    title: "Verdifull vekst – i små bedrifter",
    subtitle:
      "Endring, KI, salg og markedsføring gjort enkelt. Alt jeg skulle ønske at jeg selv visste da jeg startet bedrift for ti år siden.",
    bullets: [
      "Til deg som drømmer stort og driver lite",
      "Ti år som gründer – oppturer og nedturer",
      "VEKST-modellen: visjon, endring, kunder og KI, salg og tall",
      "Skrevet for små bedrifter, ikke for Silicon Valley",
    ],
    note: "Gratis. Du forplikter deg ikke til å kjøpe noe.",
    figure: <ChapterRotator chapters={vekst} palette={bookPalette} />,
    actions: (
      <Button size="lg" className="rounded-full" type="button">
        Sett meg på ventelista
      </Button>
    ),
  },
};

export const Ressursside: Story = {
  name: "Ressursside (innholdsfortegnelse)",
  args: {
    badge: "Oppdatert september 2026",
    eyebrow: "Fra Susanne",
    title: "Verktøykassa mi",
    subtitle:
      "Prompter, arbeidsflyter, bøker og filer jeg bruker selv. Alt på ett sted – kom tilbake når du trenger det.",
    figure: (
      <ChapterRotator
        eyebrow="På denne siden"
        markers="numbers"
        aspect="card"
        chapters={[
          {
            title: "KI-tips",
            text: "Små grep som gjør at KI-verktøyene faktisk hjelper deg.",
            href: "#ki-tips",
            linkLabel: "Se tipsene",
          },
          {
            title: "Prompter",
            text: "Ferdige prompter du kopierer med ett trykk.",
            href: "#prompter",
            linkLabel: "Hent prompter",
          },
          {
            title: "Arbeidsflyter",
            text: "Slik setter du opp en uke som gir plass til det viktige.",
            href: "#arbeidsflyter",
          },
          {
            title: "Bøker",
            text: "Bøkene jeg anbefaler oftest.",
            href: "#boker",
          },
          {
            title: "Filer",
            text: "Maler og sjekklister til nedlasting.",
            href: "#filer",
          },
        ]}
      />
    ),
    actions: (
      <>
        <Button size="lg" className="rounded-full" type="button">
          Hopp til prompter
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="rounded-full"
          type="button"
        >
          Last ned filene
        </Button>
      </>
    ),
    note: "Siden ligger ikke i menyen – lagre adressen.",
  },
};

export const MedOmslag: Story = {
  name: "Med omslag (3D)",
  args: {
    ...Boklansering.args,
    figure: (
      <BookCover>
        <img
          src="https://picsum.photos/seed/poynt-bok/600/900"
          alt=""
          className="h-full w-full object-cover"
        />
      </BookCover>
    ),
  },
};

export const KortTilVenstre: Story = {
  name: "Kort til venstre, Poynt-farger, prikker",
  args: {
    ...Ressursside.args,
    figureSide: "left",
    figure: (
      <ChapterRotator
        eyebrow="Modulene i kurset"
        markers="dots"
        aspect="square"
        chapters={[
          {
            title: "Finn retningen",
            text: "Hva skal bedriften bli kjent for?",
          },
          { title: "Kjenn kunden", text: "Hvem kjøper, og hvorfor?" },
          { title: "Bygg tilbudet", text: "Fra idé til noe folk betaler for." },
        ]}
      />
    ),
  },
};
