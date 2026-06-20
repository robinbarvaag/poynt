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

// `panel` = farge + tekstfarge på det flytende panelet. Tall-/etikett-/grid-
// farger har god kontrast på hver paneltone (`grid` = svak dot-tekstur).
const themes = {
  primary: {
    panel: "bg-primary text-primary-foreground",
    number: "text-saffron",
    label: "text-primary-foreground/80",
    eyebrow: "text-primary-foreground/70",
    heading: "white",
    grid: "text-primary-foreground/20",
  },
  salmon: {
    panel: "bg-salmon text-foreground",
    number: "text-primary",
    label: "text-foreground/70",
    eyebrow: "text-foreground/60",
    heading: "foreground",
    grid: "text-foreground/10",
  },
  saffron: {
    panel: "bg-saffron text-foreground",
    number: "text-primary",
    label: "text-foreground/70",
    eyebrow: "text-foreground/60",
    heading: "foreground",
    grid: "text-foreground/10",
  },
} as const;

/**
 * Modig tall-/bevis-bånd: et avrundet, mettet farge-PANEL som flyter på sidens
 * jevne bakgrunn (ingen fullbredde-søm). Store tall teller opp i viewport.
 * Selv-styrt seksjon (som CTA) — plasseres direkte, ikke pakket i BlockSection.
 */
export function StatsBand({
  eyebrow,
  title,
  stats,
  variant = "primary",
}: StatsBandProps) {
  const theme = themes[variant];

  return (
    <Section spacing="lg">
      <Container>
        <Reveal>
          <div
            className={cn(
              "relative overflow-hidden rounded-3xl px-6 py-16 shadow-lg md:px-12 md:py-20",
              theme.panel
            )}
          >
            <GridPattern variant="dots" fade className={theme.grid} />
            <div className="relative z-10">
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
                    <Text customStyles={cn("mt-3", theme.label)}>
                      {stat.label}
                    </Text>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}
