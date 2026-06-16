import type { ReactNode } from "react";
import { cn } from "../../lib/utils";
import { Button } from "../button";
import { Container, Section } from "../container";
import { Eyebrow } from "../eyebrow";
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
    eyebrow: "text-primary-foreground/70",
    heading: "white",
    description: "text-primary-foreground/80",
    button: "saffron",
  },
  saffron: {
    eyebrow: "text-foreground/60",
    heading: "foreground",
    description: "text-foreground/75",
    button: "ink",
  },
  salmon: {
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
    <Section variant={variant} spacing="lg">
      <Container size="sm">
        <Reveal>
          <div className="text-center">
            {eyebrow && <Eyebrow className={theme.eyebrow}>{eyebrow}</Eyebrow>}
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

            {form ?? (
              <div className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row">
                <input
                  type="email"
                  placeholder={placeholder}
                  className="flex-1 rounded-2xl border-0 bg-background px-5 py-3 text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
                <Button type="button" size="lg" variant={theme.button}>
                  {buttonText}
                </Button>
              </div>
            )}
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}
