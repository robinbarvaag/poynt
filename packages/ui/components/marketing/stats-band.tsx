import type { ReactNode } from "react";
import { cn } from "../../lib/utils";
import { Button } from "../button";
import { Container, Panel } from "../container";
import { GridPattern } from "../decorative";
import { Eyebrow } from "../eyebrow";
import { CountUp, Reveal } from "../motion";
import { SectionHeader } from "../section-header";
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
  /** Brødtekst — sentrert under tittelen i `band`, venstrestilt i `split`. */
  description?: string;
  /** Valgfri CTA — sentrert under tallene i `band`, under teksten i `split`. */
  cta?: { text: string; href: string };
  stats: Stat[];
  /**
   * `band` = mettet fargepanel med sentrerte tall (bevis-bånd).
   * `split` = venstrestilt tekstkolonne + tall som motvekt, på sidens vanlige
   * bakgrunn (ingen fargeflate) — jf. asymmetri-prinsippet i COMPOSITION.md.
   */
  layout?: "band" | "split";
  /** Bånd-farge (kun `band`). Default "primary". */
  variant?: "primary" | "salmon" | "saffron";
  /**
   * Lenke-slot for CTA-en (f.eks. Next `Link`). Får `href` + children og skal
   * rendre en <a>. Uten slot rendres en vanlig <a>.
   */
  renderLink?: (href: string, children: ReactNode) => ReactNode;
}

// `panel` = farge + tekstfarge på det flytende panelet. Tall-/etikett-/grid-
// farger har god kontrast på hver paneltone (`grid` = svak dot-tekstur,
// `button` = knappevariant med kontrast mot panelet — jf. Newsletter).
const themes = {
  primary: {
    surface: "primary",
    number: "text-accent-1",
    label: "text-primary-foreground/80",
    eyebrow: "text-primary-foreground/70",
    heading: "white",
    description: "text-primary-foreground/80",
    grid: "text-primary-foreground/20",
    button: "saffron",
  },
  salmon: {
    surface: "salmon",
    number: "text-primary",
    label: "text-foreground/70",
    eyebrow: "text-foreground/60",
    heading: "foreground",
    description: "text-foreground/75",
    grid: "text-foreground/10",
    button: "ink",
  },
  saffron: {
    surface: "saffron",
    number: "text-primary",
    label: "text-foreground/70",
    eyebrow: "text-foreground/60",
    heading: "foreground",
    description: "text-foreground/75",
    grid: "text-foreground/10",
    button: "ink",
  },
} as const;

/**
 * Tall-/bevis-seksjon i to utgaver: `band` (mettet fargepanel, sentrert, med
 * valgfri brødtekst og CTA) og `split` (venstrestilt tekst + tall som
 * motvekt, ingen fargeflate). Store tall teller opp i viewport. Innholds-only
 * — BlockSection/siden eier seksjon og spacing; komponenten rendrer kun sin
 * `Container`.
 */
export function StatsBand({
  eyebrow,
  title,
  description,
  cta,
  stats,
  layout = "band",
  variant = "primary",
  renderLink,
}: StatsBandProps) {
  const link = (href: string, children: ReactNode) =>
    renderLink ? renderLink(href, children) : <a href={href}>{children}</a>;

  if (layout === "split") {
    return (
      <Container padding="none">
        <Reveal>
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-16">
            {/* Tekstkolonnen deler venstrekant med resten av siden. */}
            <div className="lg:col-span-6">
              <SectionHeader
                eyebrow={eyebrow}
                title={title}
                intro={description}
                reveal={false}
                className="mb-0"
              />
              {cta && (
                <div className="mt-8">
                  {link(cta.href, <Button size="lg">{cta.text}</Button>)}
                </div>
              )}
            </div>

            {/* Tallene som motvekt — venstrestilt, primærfarge som anker.
                Mindre enn i `band`: kolonnene er halv bredde delt på tre, så
                7xl-tall brekker («19+ år» over to linjer). Hold suffikser
                korte (+/%) — enheter («år») hører hjemme i etiketten. */}
            <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-3 lg:col-span-6">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <CountUp
                    to={stat.value}
                    prefix={stat.prefix}
                    suffix={stat.suffix}
                    className="block whitespace-nowrap font-bold font-heading text-5xl text-primary leading-none tracking-tight md:text-6xl"
                  />
                  <Text variant="muted" customStyles="mt-3">
                    {stat.label}
                  </Text>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </Container>
    );
  }

  const theme = themes[variant];

  return (
    <Container padding="none">
      <Reveal>
        <Panel surface={theme.surface}>
          <GridPattern variant="dots" fade className={theme.grid} />
          <div className="relative z-10">
            {(eyebrow || title || description) && (
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
                {description && (
                  <Text
                    customStyles={cn(
                      "mx-auto mt-4 max-w-2xl text-balance",
                      theme.description
                    )}
                  >
                    {description}
                  </Text>
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

            {cta && (
              <div className="mt-12 text-center">
                {link(
                  cta.href,
                  <Button size="lg" variant={theme.button}>
                    {cta.text}
                  </Button>
                )}
              </div>
            )}
          </div>
        </Panel>
      </Reveal>
    </Container>
  );
}
