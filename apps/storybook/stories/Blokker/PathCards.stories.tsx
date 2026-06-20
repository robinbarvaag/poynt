import { type PathCardItem, PathCards } from "@poynt/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";

const paths: PathCardItem[] = [
  {
    id: "grunder",
    href: "/for-grundere",
    eyebrow: "For deg som",
    title: "Jeg er gründer",
    description:
      "Verktøy, fellesskap og kurs som hjelper deg å bygge og vokse — i ditt eget tempo.",
    items: [
      "On Poynt-medlemskap med AI-verktøy",
      "Kurs og maler for selvstendige",
      "Et fellesskap av andre gründere",
    ],
    ctaLabel: "Se hva som er inkludert",
    surface: "saffron",
  },
  {
    id: "bedrift",
    href: "/for-bedrifter",
    eyebrow: "For deg som",
    title: "Vi er en bedrift",
    description:
      "Hent inn kompetanse til styret, rådgivning eller foredrag — skreddersydd for dere.",
    items: [
      "Styreverv og styrearbeid",
      "Strategisk rådgivning",
      "Foredrag og workshops",
    ],
    ctaLabel: "Ta kontakt",
    surface: "mint",
  },
];

const meta = {
  title: "Blokker/PathCards",
  component: PathCards,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof PathCards>;

export default meta;

type Story = StoryObj<typeof meta>;

export const ToDorer: Story = {
  name: "To dører",
  render: () => (
    <div className="mx-auto max-w-5xl p-8">
      <PathCards paths={paths} />
    </div>
  ),
};

export const MedOverskrift: Story = {
  name: "Med overskrift",
  render: () => (
    <div className="mx-auto max-w-5xl p-8">
      <PathCards
        eyebrow="Hvor vil du begynne?"
        title="Velg din vei"
        intro="Enten du bygger noe selv eller leter etter kompetanse til bedriften — det er en vei for deg."
        paths={paths}
      />
    </div>
  ),
};

export const TreVeier: Story = {
  name: "Tre veier",
  render: () => (
    <div className="mx-auto max-w-6xl p-8">
      <PathCards
        columns={3}
        paths={[
          ...paths,
          {
            id: "samarbeid",
            href: "/podkast",
            eyebrow: "Bare nysgjerrig?",
            title: "Følg med",
            description:
              "Lytt til podkasten og les artiklene — gratis innsikt, uten forpliktelser.",
            items: ["Ukentlig podkast", "Artikler og dypdykk"],
            ctaLabel: "Utforsk ressurser",
          },
        ]}
      />
    </div>
  ),
};
