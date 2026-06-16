import type { ReactNode } from "react";
import { Icon } from "../../icons";
import { cn } from "../../lib/utils";
import { Button } from "../button";
import { Container } from "../container";
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
}

/**
 * Redaksjonell tekst + media-split med bevisst asymmetri (5/6-kolonner,
 * forskjøvet fra midten — jf. docs/COMPOSITION.md §3). Innholds-only.
 */
export function ContentMedia({
  eyebrow,
  title,
  body,
  bullets,
  cta,
  media,
  mediaSide = "right",
}: ContentMediaProps) {
  const mediaLeft = mediaSide === "left";

  return (
    <Container padding="none">
      <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-12 md:gap-16">
        {/* Tekst */}
        <Reveal
          className={cn(
            "md:col-span-5",
            mediaLeft ? "md:col-start-8" : "md:col-start-1"
          )}
        >
          {eyebrow && (
            <Text
              variant="small"
              color="primary"
              customStyles="uppercase tracking-[0.18em]"
            >
              {eyebrow}
            </Text>
          )}
          <Heading variant="h2" color="foreground" customStyles="mt-3">
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
                <li key={bullet} className="flex items-start gap-3">
                  <Icon
                    name="check-circle"
                    className="mt-0.5 size-5 shrink-0 text-primary"
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

        {/* Media */}
        <Reveal
          className={cn(
            "md:col-span-6",
            mediaLeft ? "md:col-start-1 md:row-start-1" : "md:col-start-7"
          )}
        >
          <div className="relative aspect-4/3 overflow-hidden rounded-[2rem] bg-muted shadow-sm ring-1 ring-foreground/5">
            {media}
          </div>
        </Reveal>
      </div>
    </Container>
  );
}
