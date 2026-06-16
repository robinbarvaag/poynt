import { Container, Eyebrow, Heading, Text, cn } from "@poynt/ui";
import type { ReactNode } from "react";

interface PageHeroProps {
  eyebrow?: string;
  title: string;
  description?: string;
  /** Akseptert for bakoverkompatibilitet (vises ikke i dette hodet). */
  image?: { url: string; alt?: string } | null;
  children?: ReactNode;
  size?: "default" | "large";
}

/**
 * Felles sidehode for liste-/oversiktssider (blogg, produkter, podkast …).
 * Bruker design-systemets primitiver, så det matcher blokk-språket.
 */
export function PageHero({
  eyebrow,
  title,
  description,
  children,
  size = "default",
}: PageHeroProps) {
  return (
    <section
      className={cn(
        "border-border/60 border-b",
        size === "large" ? "py-14 md:py-20" : "py-10 md:py-14"
      )}
    >
      <Container>
        <div className="max-w-3xl">
          {eyebrow && <Eyebrow className="text-primary">{eyebrow}</Eyebrow>}
          <Heading
            variant={size === "large" ? "h1" : "h2"}
            color="foreground"
            customStyles={eyebrow ? "mt-3" : undefined}
          >
            {title}
          </Heading>
          {description && (
            <Text variant="lead" customStyles="mt-4 max-w-2xl">
              {description}
            </Text>
          )}
          {children && <div className="mt-8">{children}</div>}
        </div>
      </Container>
    </section>
  );
}
