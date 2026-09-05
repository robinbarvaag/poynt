import { cn } from "../../lib/utils";
import { Container } from "../container";
import { Eyebrow } from "../eyebrow";
import { Reveal } from "../motion";
import { Heading, Text } from "../typography";

export interface Step {
  title: string;
  text: string;
}

export interface StepsProps {
  eyebrow?: string;
  title?: string;
  intro?: string;
  steps: Step[];
}

// Tall + marker-strek i høy-kontrast farger, og en rolig fade-flate i samme
// farge som binder tall og innhold sammen i ett steg. `grad` er kun fra/til —
// retningen settes av zig-zag (flip) under.
const accents = [
  {
    text: "text-primary",
    bar: "bg-primary",
    grad: "from-primary/[0.12] to-primary/[0.02]",
  },
  {
    text: "text-accent-2",
    bar: "bg-accent-2",
    grad: "from-accent-2/[0.16] to-accent-2/[0.03]",
  },
  {
    text: "text-foreground",
    bar: "bg-foreground",
    grad: "from-foreground/[0.07] to-foreground/[0.01]",
  },
] as const;

/**
 * «Slik funker det» — reisen nedover siden som en redaksjonell zig-zag.
 * Gigantiske tall som grafisk anker (ingen ikoner), vekslende side for
 * bevegelse, og en rolig fade-flate per steg som tydelig binder tall og
 * innhold sammen. Hvert steg glir inn ved scroll. Innholds-only.
 */
export function Steps({ eyebrow, title, intro, steps }: StepsProps) {
  return (
    <Container padding="none">
      {(eyebrow || title || intro) && (
        <Reveal>
          <div className="mb-16 max-w-2xl">
            {eyebrow && <Eyebrow className="text-primary">{eyebrow}</Eyebrow>}
            {title && (
              <Heading variant="h2" color="foreground" customStyles="mt-3">
                {title}
              </Heading>
            )}
            {intro && (
              <Text variant="lead" customStyles="mt-4">
                {intro}
              </Text>
            )}
          </div>
        </Reveal>
      )}

      <div className="flex flex-col gap-6 md:gap-8">
        {steps.map((step, index) => {
          const accent = accents[index % accents.length];
          const flip = index % 2 === 1;
          return (
            <Reveal key={step.title}>
              <div
                className={cn(
                  "grid items-center gap-6 rounded-4xl p-8 md:grid-cols-12 md:gap-10 md:p-12",
                  flip ? "bg-linear-to-l" : "bg-linear-to-r",
                  accent.grad
                )}
              >
                {/* Gigantisk tall */}
                <div
                  className={cn(
                    "md:row-start-1 md:col-span-4",
                    flip ? "md:col-start-9 md:text-right" : "md:col-start-1"
                  )}
                >
                  <span
                    className={cn(
                      "font-heading font-bold text-7xl leading-none tracking-tighter md:text-[9rem]",
                      accent.text
                    )}
                  >
                    {index + 1}
                  </span>
                </div>

                {/* Innhold */}
                <div
                  className={cn(
                    "md:row-start-1 md:col-span-8",
                    flip ? "md:col-start-1" : "md:col-start-5"
                  )}
                >
                  <Eyebrow marker markerClassName={accent.bar}>
                    Steg {index + 1}
                  </Eyebrow>
                  <Heading
                    variant="h3"
                    size="display-md"
                    color="foreground"
                    weight="bold"
                    customStyles="mt-4 leading-tight"
                  >
                    {step.title}
                  </Heading>
                  <Text customStyles="mt-3 max-w-md text-muted-foreground leading-relaxed">
                    {step.text}
                  </Text>
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>
    </Container>
  );
}
