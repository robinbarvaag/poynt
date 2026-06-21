import type { ReactNode } from "react";
import { cn } from "../../lib/utils";
import { Button } from "../button";
import { Container, Section } from "../container";
import { Eyebrow } from "../eyebrow";
import { Input } from "../form/input";
import { Reveal } from "../motion";
import { Heading, Text } from "../typography";

export interface NewsletterProps {
  eyebrow?: string;
  title: string;
  description?: string;
  placeholder?: string;
  buttonText?: string;
  /** Bånd-farge. Default "primary". */
  variant?: "primary" | "saffron" | "salmon";
  /**
   * Ekte skjema fra appen. Sendes inn for å erstatte standard-visningen
   * (som bare er presentasjon, uten innsending).
   */
  form?: ReactNode;
}

const themes = {
  primary: {
    panel: "bg-primary text-primary-foreground",
    eyebrow: "text-primary-foreground/70",
    heading: "white",
    description: "text-primary-foreground/80",
    button: "saffron",
  },
  saffron: {
    panel: "bg-saffron text-foreground",
    eyebrow: "text-foreground/60",
    heading: "foreground",
    description: "text-foreground/75",
    button: "ink",
  },
  salmon: {
    panel: "bg-salmon text-foreground",
    eyebrow: "text-foreground/60",
    heading: "foreground",
    description: "text-foreground/75",
    button: "ink",
  },
} as const;

/**
 * Nyhetsbrev-bånd. Selv-styrt seksjon (som CTA). Standard-visningen er rein
 * presentasjon; appen sender inn et ekte skjema via `form`-slotten.
 */
export function Newsletter({
  eyebrow,
  title,
  description,
  placeholder = "Din e-postadresse",
  buttonText = "Meld meg på",
  variant = "primary",
  form,
}: NewsletterProps) {
  const theme = themes[variant];

  return (
    <Section spacing="lg">
      <Container>
        <Reveal>
          <div
            className={cn(
              "rounded-3xl px-6 py-16 shadow-lg md:px-12 md:py-20",
              theme.panel
            )}
          >
            <div className="mx-auto max-w-xl text-center">
              {eyebrow && (
                <Eyebrow className={theme.eyebrow}>{eyebrow}</Eyebrow>
              )}
              <Heading
                variant="h2"
                color={theme.heading}
                align="center"
                customStyles="mt-3"
              >
                {title}
              </Heading>
              {description && (
                <Text
                  variant="lead"
                  align="center"
                  customStyles={cn("mx-auto mt-4 max-w-xl", theme.description)}
                >
                  {description}
                </Text>
              )}

              <div className="mx-auto mt-8 max-w-md">
                {form ?? (
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Input
                      type="email"
                      sizeVariant="lg"
                      placeholder={placeholder}
                      className="flex-1 rounded-2xl border-0 bg-background text-foreground shadow-none"
                    />
                    <Button type="button" size="lg" variant={theme.button}>
                      {buttonText}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}
