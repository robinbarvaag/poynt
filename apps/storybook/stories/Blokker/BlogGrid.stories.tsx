import { BlogGrid, type BlogGridItem } from "@poynt/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";

const img = (seed: string) => (
  <img
    src={`https://picsum.photos/seed/${seed}/800/450`}
    alt=""
    className="size-full object-cover"
  />
);

const avatar = (seed: string) => (
  <img
    src={`https://picsum.photos/seed/${seed}/48/48`}
    alt=""
    className="size-6 rounded-full object-cover"
  />
);

const posts: BlogGridItem[] = [
  {
    id: 1,
    href: "#",
    category: "Markedsføring",
    title: "Enkle tips for salg og markedsføring",
    excerpt:
      "Heidi Jeanette Frafjord om salg og markedsføring — og hvordan du kommer i gang uten å bli overveldet.",
    date: "3. juni 2026",
    authorName: "Heidi",
    authorAvatar: avatar("a1"),
    image: img("b1"),
  },
  {
    id: 2,
    href: "#",
    category: "Kommunikasjon",
    title: "Effektive strategier for små bedrifter",
    excerpt: "Å drive en liten bedrift kan være både spennende og krevende.",
    date: "28. mai 2026",
    authorName: "Robin",
    authorAvatar: avatar("a2"),
    image: img("b2"),
  },
  {
    id: 3,
    href: "#",
    category: "Markedsføring",
    title: "Slik bygger du en effektiv profil på Pinterest",
    excerpt:
      "Pinterest er mer en søkemotor enn et sosialt medium. Derfor lønner det seg å tenke nøkkelord.",
    date: "20. mai 2026",
    authorName: "Heidi",
    authorAvatar: avatar("a1"),
    image: img("b3"),
  },
  {
    id: 4,
    href: "#",
    category: "Tips",
    title: "Ti ting du kan gjøre hvis juli er en litt rolig måned",
    excerpt:
      "Rydd i innboksen din. Jeg kjører tom-innboks-konseptet, og det frigjør utrolig mye energi.",
    date: "12. mai 2026",
    authorName: "Robin",
    authorAvatar: avatar("a2"),
    // Uten bilde → rent typografisk fargeblokk-kort
  },
  {
    id: 5,
    href: "#",
    category: "Sosiale medier",
    title: "Slik skaper du liv i en karusell på Instagram",
    excerpt:
      "Opprett et design i Canva i 4:5-format. Legg til tekst og bilder.",
    date: "5. mai 2026",
    authorName: "Heidi",
    authorAvatar: avatar("a1"),
    image: img("b5"),
  },
  {
    id: 6,
    href: "#",
    category: "Markedsføring",
    title: "Tolv enkle tips for å vokse på Instagram i 2026",
    excerpt:
      "Del verdifullt innhold — for eksempel en guide eller tips folk vil lagre og dele videre.",
    date: "1. mai 2026",
    authorName: "Robin",
    authorAvatar: avatar("a2"),
    image: img("b6"),
  },
];

const meta = {
  title: "Blokker/BlogGrid",
  component: BlogGrid,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof BlogGrid>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Standard: Story = {
  render: () => (
    <div className="mx-auto max-w-6xl p-8">
      <BlogGrid posts={posts} />
    </div>
  ),
};

export const UtenFremhevet: Story = {
  name: "Uten fremhevet",
  render: () => (
    <div className="mx-auto max-w-6xl p-8">
      <BlogGrid posts={posts} featureFirst={false} />
    </div>
  ),
};
