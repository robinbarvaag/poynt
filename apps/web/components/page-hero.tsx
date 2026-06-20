import {
  Container,
  Eyebrow,
  FloatingShapes,
  Heading,
  Text,
  cn,
} from "@poynt/ui";
import { Reveal } from "@poynt/ui/motion";
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
 * Bruker design-systemets primitiver, så det matcher blokk-språket. Myke,
 * blurra blobs i bakgrunnen (FloatingShapes) gir det litt liv uten å ta fokus.
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
        "relative overflow-hidden border-border/60 border-b bg-secondary",
        size === "large" ? "py-16 md:py-24" : "py-12 md:py-16"
      )}
    >
      <FloatingShapes variant="subtle" />
      <Container className="relative z-10">
        <Reveal>
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
        </Reveal>
      </Container>
    </section>
  );
}
