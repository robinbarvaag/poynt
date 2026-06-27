import { Button, SiteHeader, type SiteHeaderNavItem } from "@poynt/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";

const navItems: SiteHeaderNavItem[] = [
  { label: "Produkter", href: "/produkter" },
  { label: "Tjenester", href: "/tjenester" },
  {
    label: "Ressurser",
    href: "/blogg",
    subItems: [
      { label: "Blogg", href: "/blogg", description: "Tips om markedsføring" },
      { label: "Podkast", href: "/podkast", description: "Lytt til episodene" },
      { label: "Artikler", href: "/artikler", description: "Lengre dypdykk" },
    ],
  },
  { label: "Om oss", href: "/om-oss" },
];

function CartIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="8" cy="21" r="1" />
      <circle cx="19" cy="21" r="1" />
      <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
    </svg>
  );
}

const actions = (
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
      variant="ghost"
      size="sm"
      className="h-9 gap-1.5 rounded-full px-2.5"
      aria-label="Handlekurv"
      type="button"
    >
      <CartIcon />
      <span className="font-semibold text-sm tabular-nums">2</span>
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

const mobileFooter = (
  <>
    <Button variant="outline" className="w-full rounded-full" type="button">
      Logg inn
    </Button>
    <Button className="w-full rounded-full" type="button">
      Bli medlem
    </Button>
  </>
);

function PageBackdrop() {
  return (
    <div className="min-h-[200vh] bg-linear-to-b from-mint/40 via-background to-saffron/20 px-6 pt-28">
      <div className="mx-auto max-w-2xl space-y-4">
        <h1 className="font-bold font-heading text-4xl">
          Scroll for glass-effekt
        </h1>
        <p className="text-muted-foreground">
          Headeren er en flytende pill med subtil glass-morphisme. Når du
          scroller forbi 16px blir flaten tettere og får en myk skygge. Krymp
          vinduet for å se mobil-draweren (hamburger).
        </p>
      </div>
    </div>
  );
}

const meta = {
  title: "Design/SiteHeader",
  component: SiteHeader,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof SiteHeader>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Standard: Story = {
  render: () => (
    <>
      <SiteHeader
        logo="Poynt"
        navItems={navItems}
        actions={actions}
        mobileFooter={mobileFooter}
        pathname="/tjenester"
      />
      <PageBackdrop />
    </>
  ),
};

export const UtenNav: Story = {
  name: "Minimal (uten nav)",
  render: () => (
    <>
      <SiteHeader logo="Poynt" actions={actions} />
      <PageBackdrop />
    </>
  ),
};
