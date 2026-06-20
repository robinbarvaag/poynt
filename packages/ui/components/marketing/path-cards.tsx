import { cn } from "../../lib/utils";
import { Container, gridVariants } from "../container";
import { Eyebrow } from "../eyebrow";
import { Reveal, Stagger, StaggerItem } from "../motion";
import { Heading, Text } from "../typography";
import { PathCard, type PathCardProps, type PathSurface } from "./path-card";

export interface PathCardItem extends PathCardProps {
  id: string | number;
}

export interface PathCardsProps {
  eyebrow?: string;
  title?: string;
  intro?: string;
  /** Antall kolonner på desktop. Default 2 («to dører»). */
  columns?: 2 | 3;
  paths: PathCardItem[];
}

// Standard tint-rotasjon når et kort ikke selv setter `surface` — gir de to
// dørene tydelig forskjellig farge uten at appen må tenke på det.
const fallbackSurfaces: PathSurface[] = ["saffron", "mint", "salmon"];

/**
 * «To dører»-seksjon: store, klikkbare `PathCard` side om side der den
 * besøkende velger sin vei. Default 2 kolonner. Samme seksjons-mønster som de
 * andre marketing-komponentene (eyebrow + tittel + intro, så innholdet).
 * Presentasjons-only.
 */
export function PathCards({
  eyebrow,
  title,
  intro,
  columns = 2,
  paths,
}: PathCardsProps) {
  if (!paths.length) {
    return null;
  }

  return (
    <Container padding="none">
      {(eyebrow || title || intro) && (
        <Reveal>
          <div className="mb-12 max-w-2xl">
            {eyebrow && <Eyebrow className="text-primary">{eyebrow}</Eyebrow>}
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

      <Stagger className={cn(gridVariants({ cols: columns, gap: "md" }))}>
        {paths.map(({ id, surface, ...path }, index) => (
          <StaggerItem key={id} className="h-full">
            <PathCard
              {...path}
              surface={
                surface ?? fallbackSurfaces[index % fallbackSurfaces.length]
              }
            />
          </StaggerItem>
        ))}
      </Stagger>
    </Container>
  );
}
