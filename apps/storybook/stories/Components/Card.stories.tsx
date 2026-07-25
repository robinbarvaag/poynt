import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardSeparator,
  CardTitle,
  Grid,
  cn,
} from "@poynt/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  title: "Komponenter/Card",
  component: Card,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Card>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Card className="w-[360px]">
      <CardHeader>
        <CardTitle>Medlemskap</CardTitle>
        <CardDescription>Velg planen som passer deg</CardDescription>
      </CardHeader>
      <CardContent>
        <p>
          Få full tilgang til alle kurs, verktøy og fellesskapet vårt. Du kan
          når som helst oppgradere eller avslutte medlemskapet.
        </p>
      </CardContent>
      <CardFooter>
        <Button>Bli medlem</Button>
      </CardFooter>
    </Card>
  ),
};

const surfaceCards = [
  {
    surface: "default",
    accent: "text-primary",
    n: "01",
    title: "Nøytralt kort",
    body: "Den lyse flaten — samme oppsett som de fargede, men rolig nok til app-UI.",
    footer: { type: "link", label: "Les mer" },
  },
  {
    surface: "saffron",
    accent: "text-primary",
    n: "02",
    title: "Lær raskere",
    body: "Strukturerte kurs som tar deg fra nybegynner til trygg — i ditt tempo.",
    footer: { type: "link", label: "Se kursene" },
  },
  {
    surface: "salmon",
    accent: "text-primary",
    n: "03",
    title: "Verktøy som jobber",
    body: "La AI-verktøyene gjøre grovjobben, fra idé til ferdig resultat.",
    footer: { type: "stat", value: "12+", label: "verktøy klare" },
  },
  {
    surface: "primary",
    accent: "text-accent-1",
    n: "04",
    title: "Et fellesskap",
    body: "Del, få tilbakemelding og voks sammen med andre på samme reise.",
    footer: { type: "link", label: "Bli medlem" },
  },
  {
    surface: "ink",
    accent: "text-accent-1",
    n: "05",
    title: "Maler i bøtter",
    body: "Kom i gang med fart fra dag én — ferdige oppsett du gjør til ditt.",
    footer: { type: "stat", value: "80+", label: "maler" },
  },
] as const;

export const Surfaces: Story = {
  name: "Flater (surface) — PayPal-stil",
  parameters: { layout: "padded" },
  render: () => (
    <Grid cols={3} className="max-w-[1100px]">
      {surfaceCards.map((card) => (
        <Card
          key={card.surface}
          surface={card.surface}
          className="min-h-[300px]"
        >
          <CardContent>
            <span
              className={cn(
                "font-heading font-bold text-5xl leading-none tracking-tight",
                card.accent
              )}
            >
              {card.n}
            </span>
            <CardTitle className="mt-6 text-2xl">
              {card.title}
              <span className={card.accent}>*</span>
            </CardTitle>
          </CardContent>

          <CardSeparator />

          <CardContent className="opacity-80">{card.body}</CardContent>

          <CardContent className="mt-auto">
            {card.footer.type === "link" ? (
              <a
                href={`#${card.surface}`}
                className={cn(
                  "group/link inline-flex w-fit flex-col gap-2 font-bold text-sm",
                  card.accent
                )}
              >
                {card.footer.label}
                <span
                  aria-hidden="true"
                  className="h-0.75 w-9 rounded-full bg-current transition-all duration-300 ease-out group-hover/link:w-full"
                />
              </a>
            ) : (
              <div>
                <div
                  className={cn(
                    "font-heading font-bold text-4xl leading-none",
                    card.accent
                  )}
                >
                  {card.footer.value}
                </div>
                <div className="mt-1 text-sm opacity-75">
                  {card.footer.label}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </Grid>
  ),
};
