import { cn } from "../../lib/utils";
import { Container } from "../container";
import { Reveal, Stagger, StaggerItem } from "../motion";
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

/**
 * «Slik funker det» — den lille reisen nedover siden. Nummererte steg med en
 * sammenhengende loddrett linje. Innholds-only; staggrer inn.
 */
export function Steps({ eyebrow, title, intro, steps }: StepsProps) {
  return (
    <Container size="sm" padding="none">
      {(eyebrow || title || intro) && (
        <Reveal>
          <div className="mx-auto mb-12 max-w-2xl text-center">
            {eyebrow && (
              <Text
                variant="small"
                color="primary"
                customStyles="uppercase tracking-[0.18em]"
              >
                {eyebrow}
              </Text>
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

      <Stagger className="flex flex-col">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;
          return (
            <StaggerItem key={step.title}>
              <div className="flex gap-6">
                <div className="relative flex flex-col items-center">
                  <span className="z-10 inline-flex size-12 items-center justify-center rounded-full bg-primary font-heading font-bold text-lg text-primary-foreground">
                    {index + 1}
                  </span>
                  {!isLast && (
                    <span
                      aria-hidden="true"
                      className="absolute top-12 h-full w-px bg-border"
                    />
                  )}
                </div>
                <div className={cn("pt-1.5", isLast ? "pb-0" : "pb-12")}>
                  <Heading variant="h4" color="foreground">
                    {step.title}
                  </Heading>
                  <Text customStyles="mt-2 text-muted-foreground">
                    {step.text}
                  </Text>
                </div>
              </div>
            </StaggerItem>
          );
        })}
      </Stagger>
    </Container>
  );
}
