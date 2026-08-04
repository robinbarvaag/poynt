import { type MediaResource, PayloadImage } from "@/components/payload-image";
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
  /** Valgfritt bilde fra admin — vises som et rolig panel til høyre på store skjermer. */
  image?: MediaResource | null;
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
  image,
  children,
  size = "default",
}: PageHeroProps) {
  const hasImage = Boolean(image?.url);

  return (
    <section
      className={cn(
        "relative overflow-hidden border-border/60 border-b bg-secondary",
        size === "large" ? "py-16 md:py-24" : "py-12 md:py-16"
      )}
    >
      <FloatingShapes variant="subtle" />
      <Container className="relative z-10">
        <div
          className={cn(
            hasImage && "grid items-center gap-10 lg:grid-cols-[3fr_2fr]"
          )}
        >
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
          {hasImage && image && (
            <Reveal>
              <div className="relative hidden aspect-4/3 overflow-hidden rounded-3xl border border-border/60 lg:block">
                <PayloadImage
                  media={image}
                  fill
                  sizes="(min-width: 1024px) 40vw, 0px"
                  className="object-cover"
                />
              </div>
            </Reveal>
          )}
        </div>
      </Container>
    </section>
  );
}
