import { cn } from "../../lib/utils";
import { Container } from "../container";
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

// Tall + marker-strek i høy-kontrast farger (lesbare på lys flate).
const accents = [
  { text: "text-primary", bar: "bg-primary" },
  { text: "text-salmon", bar: "bg-salmon" },
  { text: "text-foreground", bar: "bg-foreground" },
] as const;

/**
 * «Slik funker det» — reisen nedover siden, som en redaksjonell zig-zag.
 * Gigantiske tall som grafisk anker (ingen ikoner), vekslende side for
 * bevegelse, og en marker-strek som aksent. Hvert steg glir inn ved scroll.
 * Innholds-only.
 */
export function Steps({ eyebrow, title, intro, steps }: StepsProps) {
  return (
    <Container padding="none">
      {(eyebrow || title || intro) && (
        <Reveal>
          <div className="mb-16 max-w-2xl">
            {eyebrow && (
              <span className="font-heading font-semibold text-primary text-sm uppercase tracking-[0.2em]">
                {eyebrow}
              </span>
            )}
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

      <div className="flex flex-col gap-16 md:gap-24">
        {steps.map((step, index) => {
          const accent = accents[index % accents.length];
          const flip = index % 2 === 1;
          return (
            <Reveal key={step.title}>
              <div className="grid items-center gap-6 md:grid-cols-12 md:gap-10">
                {/* Gigantisk tall */}
                <div
                  className={cn(
                    "md:row-start-1",
                    flip
                      ? "md:col-start-9 md:col-span-4 md:text-right"
                      : "md:col-start-1 md:col-span-4"
                  )}
                >
                  <span
                    className={cn(
                      "font-heading font-bold text-7xl leading-none tracking-tighter md:text-[9rem]",
                      accent.text
                    )}
                  >
                    0{index + 1}
                  </span>
                </div>

                {/* Innhold */}
                <div
                  className={cn(
                    "md:row-start-1",
                    flip
                      ? "md:col-start-1 md:col-span-7"
                      : "md:col-start-6 md:col-span-7"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={cn("h-1 w-10 rounded-full", accent.bar)}
                      aria-hidden="true"
                    />
                    <span className="font-heading font-semibold text-muted-foreground text-sm uppercase tracking-[0.2em]">
                      Steg 0{index + 1}
                    </span>
                  </div>
                  <h3 className="mt-4 font-heading font-bold text-3xl text-foreground leading-tight md:text-4xl">
                    {step.title}
                  </h3>
                  <p className="mt-3 max-w-md text-muted-foreground leading-relaxed">
                    {step.text}
                  </p>
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>
    </Container>
  );
}
