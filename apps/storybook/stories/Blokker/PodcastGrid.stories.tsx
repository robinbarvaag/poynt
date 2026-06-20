import { PodcastGrid, type PodcastGridItem } from "@poynt/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";

const cover = (seed: string) => (
  <img
    src={`https://picsum.photos/seed/${seed}/500/500`}
    alt=""
    className="size-full object-cover"
  />
);

const episodes: PodcastGridItem[] = [
  {
    id: 32,
    href: "#",
    episodeNumber: 32,
    duration: "38 min",
    date: "3. jun 2026",
    title: "Bruk AI i markedsføring",
    description:
      "Hvilke AI-verktøy kan du bruke i din bedrift? Er AI farlig? Susanne Todnem svarer på det du lurer på.",
    cover: cover("pod32"),
    badge: "Siste episode",
  },
  {
    id: 31,
    href: "#",
    episodeNumber: 31,
    duration: "29 min",
    date: "20. mai 2026",
    title: "Hvorfor bli medlem i On Poynt?",
    description:
      "Er du nysgjerrig på medlemskapet On Poynt? Vi forteller hva du får som medlem.",
    cover: cover("pod31"),
  },
  {
    id: 30,
    href: "#",
    episodeNumber: 30,
    duration: "44 min",
    date: "6. mai 2026",
    title: "Om salg og markedsføring — Heidi Jeanette Frafjord",
    description:
      "Salgsdirektøren i HEIMR deler sine beste salgstips, og snakker om smarketing.",
    cover: cover("pod30"),
  },
  {
    id: 29,
    href: "#",
    episodeNumber: 29,
    duration: "33 min",
    date: "22. apr 2026",
    title: "Nytt på Instagram i 2026",
    description:
      "I episoden snakker vi om nye funksjoner og deler noen av våre Instagram-tips.",
    cover: cover("pod29"),
  },
  {
    id: 28,
    href: "#",
    episodeNumber: 28,
    duration: "41 min",
    date: "8. apr 2026",
    title: "Slik lager du innhold som engasjerer",
    description: "Konkrete grep for å lage innhold folk faktisk stopper på.",
    cover: cover("pod28"),
  },
];

const meta = {
  title: "Blokker/PodcastGrid",
  component: PodcastGrid,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof PodcastGrid>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Standard: Story = {
  render: () => (
    <div className="mx-auto max-w-6xl p-8">
      <PodcastGrid episodes={episodes} />
    </div>
  ),
};

export const UtenFremhevet: Story = {
  name: "Uten fremhevet",
  render: () => (
    <div className="mx-auto max-w-6xl p-8">
      <PodcastGrid episodes={episodes} featureFirst={false} />
    </div>
  ),
};
