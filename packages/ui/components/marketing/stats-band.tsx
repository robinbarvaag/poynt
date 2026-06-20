import { cn } from "../../lib/utils";
import { Container, Section } from "../container";
import { GridPattern } from "../decorative";
import { Eyebrow } from "../eyebrow";
import { CountUp, Reveal } from "../motion";
import { Heading, Text } from "../typography";

export interface Stat {
  value: number;
  prefix?: string;
  suffix?: string;
  label: string;
}

export interface StatsBandProps {
  eyebrow?: string;
  title?: string;
  stats: Stat[];
  /** Bånd-farge. Default "primary". */
  variant?: "primary" | "salmon" | "saffron";
}

// Tall-farge + etikett-farge som har god kontrast på hvert bånd. `grid` er
// fargen på den svake dot-teksturen som ligger over flaten (Caide-INSPO).
const themes = {
  primary: {
    number: "text-saffron",
    label: "text-primary-foreground/80",
    eyebrow: "text-primary-foreground/70",
    heading: "white",
    grid: "text-primary-foreground/20",
  },
  salmon: {
    number: "text-primary",
    label: "text-foreground/70",
    eyebrow: "text-foreground/60",
    heading: "foreground",
    grid: "text-foreground/10",
  },
  saffron: {
    number: "text-primary",
    label: "text-foreground/70",
    eyebrow: "text-foreground/60",
    heading: "foreground",
    grid: "text-foreground/10",
  },
} as const;

/**
 * Modig tall-/bevis-bånd: en mettet fargeflate med store tall som teller opp
 * når de kommer i viewport. Selv-styrt seksjon (som CTA) — plasseres direkte,
 * ikke pakket i BlockSection.
 */
export function StatsBand({
  eyebrow,
  title,
  stats,
  variant = "primary",
}: StatsBandProps) {
  const theme = themes[variant];

  return (
    <Section
      variant={variant}
      spacing="lg"
      className="relative overflow-hidden"
    >
      <GridPattern variant="dots" fade className={theme.grid} />
      <Container className="relative z-10">
        <Reveal>
          {(eyebrow || title) && (
            <div className="mb-12 text-center">
              {eyebrow && (
                <Eyebrow className={theme.eyebrow}>{eyebrow}</Eyebrow>
              )}
              {title && (
                <Heading
                  variant="h2"
                  color={theme.heading}
                  align="center"
                  customStyles="mt-3"
                >
                  {title}
                </Heading>
              )}
            </div>
          )}

          <div className="flex flex-wrap justify-center gap-x-16 gap-y-10">
            {stats.map((stat) => (
              <div key={stat.label} className="min-w-32 text-center">
                <CountUp
                  to={stat.value}
                  prefix={stat.prefix}
                  suffix={stat.suffix}
                  className={cn(
                    "block font-bold font-heading text-6xl leading-none tracking-tight md:text-7xl",
                    theme.number
                  )}
                />
                <Text customStyles={cn("mt-3", theme.label)}>{stat.label}</Text>
              </div>
            ))}
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}
