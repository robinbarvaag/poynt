import type { ReactNode } from "react";
import { cn } from "../../lib/utils";
import { Button } from "../button";
import { Container, Panel } from "../container";
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

// Tekst på fargede bånd bruker hele flatens tekstfarge — aldri alfa/opacity.
// Gjennomskinnelig tekst på saffron/salmon faller under WCAG-kontrastkravet;
// hierarkiet kommer fra størrelse, vekt og versaler i stedet.
const themes = {
  primary: {
    surface: "primary",
    eyebrow: "text-primary-foreground",
    heading: "white",
    description: "text-primary-foreground",
    button: "saffron",
  },
  saffron: {
    surface: "saffron",
    eyebrow: "text-foreground",
    heading: "foreground",
    description: "text-foreground",
    button: "ink",
  },
  salmon: {
    surface: "salmon",
    eyebrow: "text-foreground",
    heading: "foreground",
    description: "text-foreground",
    button: "ink",
  },
} as const;

/**
 * Nyhetsbrev-bånd. Innholds-only — BlockSection eier seksjon/spacing;
 * komponenten rendrer kun Container + Panel. Standard-visningen er rein
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
    <Container padding="none">
      <Reveal>
        <Panel surface={theme.surface}>
          <div className="mx-auto max-w-xl text-center">
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
        </Panel>
      </Reveal>
    </Container>
  );
}
