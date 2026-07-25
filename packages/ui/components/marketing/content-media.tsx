import type { ReactNode } from "react";
import { cn } from "../../lib/utils";
import { Button } from "../button";
import { Container } from "../container";
import { Eyebrow } from "../eyebrow";
import { Reveal } from "../motion";
import { Heading, Text } from "../typography";

export interface ContentMediaProps {
  eyebrow?: string;
  title: string;
  body?: string;
  bullets?: string[];
  cta?: { text: string; href: string };
  /** Bilde/illustrasjon — slot, så appen kan sende et next/Image. */
  media?: ReactNode;
  /** Hvilken side mediet ligger på. Default "right". */
  mediaSide?: "left" | "right";
  /** Aksentfarge for marker-strek og fargeblokken bak mediet. Default "saffron". */
  accent?: "saffron" | "salmon" | "primary" | "mint";
}

const accents = {
  saffron: { bar: "bg-accent-1", block: "bg-accent-1", marker: "bg-accent-1" },
  salmon: { bar: "bg-accent-2", block: "bg-accent-2", marker: "bg-accent-2" },
  primary: { bar: "bg-primary", block: "bg-primary/15", marker: "bg-primary" },
  mint: { bar: "bg-accent-3", block: "bg-accent-3", marker: "bg-primary" },
} as const;

/**
 * Redaksjonell tekst + media-split med bevisst asymmetri (5/6-kolonner,
 * forskjøvet fra midten). Mediet har en forskjøvet fargeblokk bak seg
 * (editorial collage), og teksten har samme marker-aksent som Steps.
 * Innholds-only.
 */
export function ContentMedia({
  eyebrow,
  title,
  body,
  bullets,
  cta,
  media,
  mediaSide = "right",
  accent = "saffron",
}: ContentMediaProps) {
  const mediaLeft = mediaSide === "left";
  const a = accents[accent];

  return (
    <Container padding="none">
      <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-12 md:gap-16">
        {/* Tekst */}
        <Reveal
          className={cn(
            "md:col-span-5",
            mediaLeft ? "md:col-start-8" : "md:col-start-1"
          )}
        >
          {eyebrow && (
            <Eyebrow marker markerClassName={a.marker}>
              {eyebrow}
            </Eyebrow>
          )}
          <Heading variant="h2" color="foreground" customStyles="mt-4">
            {title}
          </Heading>
          {body && (
            <Text variant="lead" customStyles="mt-4">
              {body}
            </Text>
          )}
          {bullets && bullets.length > 0 && (
            <ul className="mt-6 flex flex-col gap-3">
              {bullets.map((bullet) => (
                <li key={bullet} className="flex items-start gap-4">
                  <span
                    aria-hidden="true"
                    className={cn("mt-2.5 h-px w-6 shrink-0", a.marker)}
                  />
                  <Text customStyles="text-muted-foreground">{bullet}</Text>
                </li>
              ))}
            </ul>
          )}
          {cta && (
            <Button asChild size="lg" className="mt-8 rounded-full px-8">
              <a href={cta.href}>{cta.text}</a>
            </Button>
          )}
        </Reveal>

        {/* Media med forskjøvet fargeblokk bak */}
        <Reveal
          className={cn(
            "md:col-span-6",
            mediaLeft ? "md:col-start-1 md:row-start-1" : "md:col-start-7"
          )}
        >
          <div className="relative isolate">
            <div
              aria-hidden="true"
              className={cn(
                "absolute inset-0 translate-y-5 rounded-4xl",
                a.block,
                mediaLeft ? "-translate-x-5" : "translate-x-5"
              )}
            />
            <div className="relative z-10 aspect-4/3 overflow-hidden rounded-4xl bg-muted ring-1 ring-foreground/5">
              {media}
            </div>
          </div>
        </Reveal>
      </div>
    </Container>
  );
}
