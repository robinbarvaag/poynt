import { ResourceGrid, type ResourceItem, Section } from "@poynt/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta: Meta<typeof ResourceGrid> = {
  title: "Blokker/ResourceList",
  component: ResourceGrid,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Ressursliste for lenker, filer, bøker, podkaster, musikk, video og verktøy. " +
          "Typen styrer ikon og etikett, bildet fyller alltid flaten. Kategorien gir filter-brikker. " +
          "Tre visninger: store kort, små kort (for mange ressurser) og liste. " +
          "Kolonnene følger blokkens bredde (container query), og lange lister foldes sammen bak «Vis alle».",
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof ResourceGrid>;

const img = (seed: string, w: number, h: number) => (
  <img
    src={`https://picsum.photos/seed/${seed}/${w}/${h}`}
    alt=""
    className="h-full w-full object-cover"
  />
);

const items: ResourceItem[] = [
  {
    title: "Deep Work",
    kind: "book",
    description:
      "Boka som fikk meg til å slutte å sjekke e-post før lunsj. Om konsentrasjon som konkurransefortrinn.",
    href: "https://example.com/deep-work",
    image: img("bok-1", 400, 600),
    category: "Bøker",
    note: "Cal Newport",
  },
  {
    title: "Ukesplan-mal",
    kind: "file",
    description: "Den samme mala jeg fyller ut hver søndag kveld. Én side.",
    href: "#",
    download: true,
    category: "Filer",
    note: "PDF · 1 side",
  },
  {
    title: "Lo-fi for fokus",
    kind: "music",
    description: "Spillelista som går når jeg skriver.",
    href: "https://open.spotify.com",
    image: img("musikk-1", 600, 600),
    category: "Musikk",
    note: "3 t 12 min",
  },
  {
    title: "Huberman Lab",
    kind: "podcast",
    description: "Om søvn, fokus og rutiner – fra et forskerperspektiv.",
    href: "https://hubermanlab.com",
    image: img("pod-1", 600, 600),
    category: "Podkast",
  },
  {
    title: "Notion",
    kind: "tool",
    description: "Alt jeg planlegger ligger her. Gratis for én person.",
    href: "https://notion.so",
    image: img("notion", 800, 450),
    category: "Verktøy",
  },
  {
    title: "Slik bruker jeg KI i hverdagen",
    kind: "video",
    description: "12 minutter fra webinaret i vår.",
    href: "https://youtube.com",
    image: img("video-1", 800, 450),
    category: "Video",
    note: "12 min",
  },
];

export const KortMedFilter: Story = {
  name: "Kort med filter",
  render: (args) => (
    <Section spacing="lg">
      <div className="mx-auto max-w-6xl px-4">
        <ResourceGrid {...args} />
      </div>
    </Section>
  ),
  args: {
    eyebrow: "Anbefalt",
    title: "Bøker, podkaster og verktøy",
    intro: "Ting jeg bruker selv og anbefaler oftest. Filtrer på kategori.",
    items,
    columns: 3,
  },
};

const many: ResourceItem[] = Array.from({ length: 4 }, (_, round) =>
  items.map((item) => ({ ...item, title: `${item.title} ${round + 1}` }))
).flat();

export const SmaKortMange: Story = {
  name: "Små kort (mange, sammenfoldet)",
  render: (args) => (
    <Section spacing="lg">
      <div className="mx-auto max-w-6xl px-4">
        <ResourceGrid {...args} />
      </div>
    </Section>
  ),
  args: {
    eyebrow: "Anbefalinger",
    title: "Alt jeg anbefaler",
    items: many,
    layout: "compact",
    columns: 4,
  },
};

export const KompaktListe: Story = {
  name: "Kompakt liste (filer)",
  render: (args) => (
    <Section spacing="lg">
      <div className="mx-auto max-w-3xl px-4">
        <ResourceGrid {...args} />
      </div>
    </Section>
  ),
  args: {
    eyebrow: "Last ned",
    title: "Filer og maler",
    items: items.filter((i) => ["file", "book", "tool"].includes(i.kind)),
    layout: "list",
    filter: false,
  },
};

const long =
  "Noe av det som ikke fikk plass i boken. Nyttige tips til deg som vil komme i gang med innhold uten å bruke hele uka på det – og en sjekkliste du kan skrive ut og henge på veggen. Den siste siden er en oversikt over verktøyene jeg bruker selv.";

export const ListeMedLangTekst: Story = {
  name: "Liste med lang tekst (vis mer)",
  render: (args) => (
    <Section spacing="lg">
      <div className="mx-auto max-w-3xl px-4">
        <ResourceGrid {...args} />
      </div>
    </Section>
  ),
  args: {
    eyebrow: "Filer",
    title: "Nyttige filer til deg",
    items: [
      {
        title: "Tekst som ikke ble med i boken",
        kind: "file",
        description: long,
        href: "#",
        download: true,
        note: "PDF",
      },
      {
        title: "Månedlig sjekkliste for Instagram",
        kind: "file",
        description: "Sjekk disse tingene hver måned. Print den ut.",
        href: "#",
        download: true,
        note: "PDF",
      },
    ],
    layout: "list",
    filter: false,
  },
};
