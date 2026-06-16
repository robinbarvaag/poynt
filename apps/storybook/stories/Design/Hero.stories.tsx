import {
  Badge,
  Button,
  Heading,
  Icon,
  type IconName,
  Text,
  cn,
} from "@poynt/ui";
import {
  CountUp,
  DriftingBlob,
  Parallax,
  Reveal,
  Stagger,
  StaggerItem,
} from "@poynt/ui/motion";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta: Meta = {
  title: "Design/Hero",
  parameters: { layout: "fullscreen" },
};
export default meta;

type Story = StoryObj;

function Stat({
  value,
  suffix,
  label,
}: {
  value: number;
  suffix: string;
  label: string;
}) {
  return (
    <div className="flex flex-col">
      <span className="font-heading font-bold text-3xl text-primary">
        <CountUp to={value} suffix={suffix} />
      </span>
      <span className="text-muted-foreground text-sm">{label}</span>
    </div>
  );
}

function FloatingPill({
  className,
  icon,
  label,
}: {
  className: string;
  icon: IconName;
  label: string;
}) {
  return (
    <div
      className={cn(
        "absolute flex items-center gap-2 rounded-full bg-card px-4 py-2 shadow-lg",
        className
      )}
    >
      <Icon name={icon} className="size-4 text-primary" />
      <span className="font-medium text-card-foreground text-sm">{label}</span>
    </div>
  );
}

function Hero() {
  return (
    <section className="relative w-full overflow-hidden bg-secondary">
      {/* Transparent header (statisk her — blur-på-scroll kommer i appen) */}
      <header className="relative z-20 mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <span className="font-extrabold font-heading text-primary text-xl">
          On Poynt
        </span>
        <nav className="hidden items-center gap-8 md:flex">
          {["Kurs", "Verktøy", "Fellesskap", "Om oss"].map((n) => (
            <a
              key={n}
              href={`#${n.toLowerCase()}`}
              className="font-medium text-foreground/80 text-sm transition-colors hover:text-primary"
            >
              {n}
            </a>
          ))}
        </nav>
        <Button className="rounded-full px-6">Bli medlem</Button>
      </header>

      {/* Drivende, pustende dekor */}
      <DriftingBlob className="-left-24 top-4 size-96 bg-primary/20" />
      <Parallax amount={40} className="absolute top-24 -right-16 z-0">
        <div className="size-72 rounded-[60%_40%_55%_45%/50%_60%_40%_50%] bg-accent/30 blur-2xl" />
      </Parallax>

      <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-12 px-6 pt-12 pb-24 lg:grid-cols-2 lg:pt-20">
        {/* Venstre — budskap */}
        <Stagger className="flex flex-col items-start gap-6">
          <StaggerItem>
            <Badge variant="accent" size="lg" className="gap-1.5 rounded-full">
              <Icon name="sparkles" className="size-4" />
              For deg som vil videre
            </Badge>
          </StaggerItem>
          <StaggerItem>
            <Heading variant="h1" color="foreground" customStyles="max-w-xl">
              Få merkevaren din{" "}
              <span className="font-extrabold text-primary">on poynt</span>
            </Heading>
          </StaggerItem>
          <StaggerItem>
            <Text variant="lead" customStyles="max-w-md text-foreground/70">
              E-læring, smarte verktøy og et fellesskap som tar deg fra idé til
              synlig resultat.
            </Text>
          </StaggerItem>
          <StaggerItem>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="lg" className="rounded-full px-8">
                Kom i gang
                <Icon name="arrow-right" className="ml-2 size-4" />
              </Button>
              <Button size="lg" variant="ghost" className="rounded-full px-6">
                Se kursene
              </Button>
            </div>
          </StaggerItem>
          <StaggerItem>
            <div className="mt-4 flex gap-10">
              <Stat value={99} suffix="+" label="kurs" />
              <Stat value={10} suffix="k+" label="medlemmer" />
            </div>
          </StaggerItem>
        </Stagger>

        {/* Høyre — organisk form med flytende pills */}
        <Reveal
          delay={0.2}
          className="relative mx-auto hidden w-full max-w-md lg:block"
        >
          <div className="aspect-4/5 w-full rounded-[60%_40%_42%_58%/55%_45%_55%_45%] bg-linear-to-br from-primary to-accent shadow-xl" />
          <FloatingPill
            className="-left-4 top-12"
            icon="graduation-cap"
            label="Kurs"
          />
          <FloatingPill
            className="top-1/3 right-0"
            icon="rocket"
            label="Verktøy"
          />
          <FloatingPill
            className="bottom-10 left-6"
            icon="users"
            label="Fellesskap"
          />
        </Reveal>
      </div>
    </section>
  );
}

export const Standard: Story = {
  render: () => <Hero />,
};
