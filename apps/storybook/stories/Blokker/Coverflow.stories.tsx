import { Coverflow, type CoverflowItem, Section } from "@poynt/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";

const cover = (seed: string) => (
  <img
    src={`https://picsum.photos/seed/${seed}/500/500`}
    alt=""
    className="block aspect-square size-full object-cover"
  />
);

const caption = (meta: string, title: string) => (
  <div className="space-y-1">
    <div className="text-muted-foreground text-xs">{meta}</div>
    <div className="line-clamp-2 font-heading font-medium text-lg leading-snug">
      {title}
    </div>
  </div>
);

const EPISODER: CoverflowItem[] = [
  {
    id: 32,
    href: "#",
    cover: cover("pod32"),
    caption: caption("Ep. 32 · 38 min · 3. jun", "Bruk AI i markedsføring"),
  },
  {
    id: 31,
    href: "#",
    cover: cover("pod31"),
    caption: caption(
      "Ep. 31 · 29 min · 20. mai",
      "Hvorfor bli medlem i On Poynt?"
    ),
  },
  {
    id: 30,
    href: "#",
    cover: cover("pod30"),
    caption: caption(
      "Ep. 30 · 44 min · 6. mai",
      "Om salg og markedsføring — Heidi Jeanette Frafjord"
    ),
  },
  {
    id: 29,
    href: "#",
    cover: cover("pod29"),
    caption: caption("Ep. 29 · 33 min · 22. apr", "Nytt på Instagram i 2026"),
  },
  {
    id: 28,
    href: "#",
    cover: cover("pod28"),
    caption: caption("Ep. 28 · 41 min · 8. apr", "Slik lager du et årshjul"),
  },
];

const meta: Meta<typeof Coverflow> = {
  title: "Blokker/Coverflow",
  component: Coverflow,
  parameters: {
    layout: "fullscreen",
    viewport: { defaultViewport: "mobile1" },
    docs: {
      description: {
        component:
          "Karusell i Cover Flow-stil (gammel iTunes): ett cover i front, naboene dreid bakover, tittel under det aktive. Laget for mobil — «Fra podkasten» på forsiden bruker den under `sm`, og rutenettet over.",
      },
    },
  },
  decorators: [
    (Story) => (
      <Section>
        <div className="mx-auto max-w-sm">
          <Story />
        </div>
      </Section>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof Coverflow>;

/** Fem episoder — bunken bak er synlig på begge sider. */
export const Standard: Story = {
  args: { items: EPISODER, label: "Podkast-episoder" },
};

/**
 * Tre episoder, slik forsiden har det — én nabo på hver side, i ring, og
 * viewporten strukket til skjermkantene (`bleed`).
 */
export const TreEpisoder: Story = {
  name: "Tre episoder (forsiden)",
  args: { items: EPISODER.slice(0, 3), label: "Podkast-episoder", bleed: true },
};

/** Midt i bunken, så begge sider har covers bak. */
export const StarterIMidten: Story = {
  name: "Starter i midten",
  args: { items: EPISODER, startIndex: 2, label: "Podkast-episoder" },
};
