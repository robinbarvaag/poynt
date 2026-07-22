import { cn } from "../lib/utils";
import { Eyebrow } from "./eyebrow";
import { Reveal } from "./motion";
import { Heading, Text } from "./typography";

export interface SectionHeaderProps {
  eyebrow?: string;
  title?: string;
  intro?: string;
  /**
   * Venstrestilt er DEFAULT (retningslinje: sidene skal ha én felles
   * venstrekant). `center` er unntaket — kun hero og avsluttende CTA.
   */
  align?: "left" | "center";
  /** Fargetoner for plassering på mørk/farget flate. */
  tone?: "default" | "onDark";
  /** Slå av intern Reveal når forelderen allerede animerer inn. */
  reveal?: boolean;
  className?: string;
}

/**
 * Felles seksjonshode (eyebrow + tittel + ingress) for alle innholdsblokker.
 * Én kilde til sannhet for bredde (`max-w-2xl`), avstand (`mb-12`) og
 * justering, slik at alle seksjoner deler samme venstrekant og rytme.
 */
export function SectionHeader({
  eyebrow,
  title,
  intro,
  align = "left",
  tone = "default",
  reveal = true,
  className,
}: SectionHeaderProps) {
  if (!eyebrow && !title && !intro) {
    return null;
  }
  const onDark = tone === "onDark";
  const content = (
    <div
      className={cn(
        "mb-12 max-w-2xl",
        align === "center" && "mx-auto text-center",
        className
      )}
    >
      {eyebrow && (
        <Eyebrow
          className={onDark ? "text-primary-foreground/70" : "text-primary"}
        >
          {eyebrow}
        </Eyebrow>
      )}
      {title && (
        <Heading
          variant="h2"
          color={onDark ? "white" : "foreground"}
          customStyles="mt-3"
        >
          {title}
        </Heading>
      )}
      {intro && (
        <Text
          variant="lead"
          customStyles={cn("mt-4", onDark && "text-primary-foreground/80")}
        >
          {intro}
        </Text>
      )}
    </div>
  );
  return reveal ? <Reveal>{content}</Reveal> : content;
}
