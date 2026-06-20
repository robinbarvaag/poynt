import { Button, Hero, SiteHeader, type SiteHeaderNavItem } from "@poynt/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta: Meta<typeof Hero> = {
  title: "Design/Hero",
  component: Hero,
  parameters: { layout: "fullscreen" },
};
export default meta;

type Story = StoryObj<typeof Hero>;

const navItems: SiteHeaderNavItem[] = [
  { label: "Kurs", href: "/kurs" },
  { label: "Verktøy", href: "/verktoy" },
  {
    label: "Ressurser",
    href: "/blogg",
    subItems: [
      { label: "Blogg", href: "/blogg", description: "Tips om markedsføring" },
      { label: "Podkast", href: "/podkast", description: "Lytt til episodene" },
    ],
  },
  { label: "Om oss", href: "/om-oss" },
];

const headerActions = (
  <>
    <Button
      variant="ghost"
      size="sm"
      className="hidden rounded-full sm:flex"
      type="button"
    >
      Logg inn
    </Button>
    <Button
      size="sm"
      className="hidden h-9 rounded-full px-5 sm:flex"
      type="button"
    >
      Bli medlem
    </Button>
  </>
);

// Placeholder-foto (picsum) — i appen sendes et next/Image inn i samme slot.
const heroPhoto = (
  <img
    src="https://picsum.photos/seed/poynt-hero/900/1100"
    alt=""
    className="h-full w-full object-cover"
  />
);

/** Demonstrerer heroen med den ekte SiteHeader-en flytende over. */
function HeroWithHeader(args: React.ComponentProps<typeof Hero>) {
  return (
    <>
      <SiteHeader
        logo="On Poynt"
        navItems={navItems}
        actions={headerActions}
        pathname="/kurs"
      />
      <Hero {...args} />
    </>
  );
}

export const Standard: Story = {
  render: (args) => <HeroWithHeader {...args} />,
  args: {
    eyebrow: "For deg som vil videre",
    eyebrowIcon: "sparkles",
    title: (
      <>
        Få merkevaren din{" "}
        <span className="font-extrabold text-primary">on poynt</span>
      </>
    ),
    subtitle:
      "E-læring, smarte verktøy og et fellesskap som tar deg fra idé til synlig resultat.",
    primaryCta: { text: "Kom i gang", href: "#" },
    secondaryCta: { text: "Se kursene", href: "#" },
    media: heroPhoto,
    pills: [
      { label: "Kurs", icon: "graduation-cap" },
      { label: "Verktøy", icon: "rocket" },
      { label: "Fellesskap", icon: "users" },
    ],
    stats: [
      { value: 99, suffix: "+", label: "kurs" },
      { value: 10, suffix: "k+", label: "medlemmer" },
    ],
  },
};

export const FotoUtenFilter: Story = {
  name: "Foto av person (uten filter)",
  render: (args) => <HeroWithHeader {...args} />,
  args: {
    ...Standard.args,
    duotone: false,
  },
};

export const UtenBilde: Story = {
  name: "Uten bilde (sentrert)",
  render: (args) => <HeroWithHeader {...args} />,
  args: {
    eyebrow: "For deg som vil videre",
    eyebrowIcon: "sparkles",
    title: (
      <>
        Få merkevaren din{" "}
        <span className="font-extrabold text-primary">on poynt</span>
      </>
    ),
    subtitle:
      "E-læring, smarte verktøy og et fellesskap som tar deg fra idé til synlig resultat.",
    primaryCta: { text: "Kom i gang", href: "#" },
    secondaryCta: { text: "Se kursene", href: "#" },
  },
};
