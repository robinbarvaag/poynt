import type { ReactNode } from "react";
import {
  Container,
  type ContainerProps,
  Section,
  type SectionProps,
} from "./container";
import { Reveal } from "./motion";

interface BlockSectionProps {
  /** Bakgrunnsfarge — settes sentralt av rytme-regelen, ikke av blokken selv. */
  background?: SectionProps["variant"];
  /** Vertikal rytme. Default "lg". */
  spacing?: SectionProps["spacing"];
  /** Innholdsbredde. Default "default". */
  containerSize?: ContainerProps["size"];
  /** Subtil scroll-reveal av innholdet. Default true. */
  reveal?: boolean;
  className?: string;
  children: ReactNode;
}

/**
 * Standard-innpakning rundt hver innholdsblokk (se docs/COMPOSITION.md).
 * Samler full-bredde bakgrunn, fast spacing og scroll-reveal ett sted, slik at
 * rytmen går automatisk igjen på hver side. Blokkene selv blir «innholds-only»
 * og rendrer aldri egne <section>/py-verdier.
 */
export function BlockSection({
  background,
  spacing = "lg",
  containerSize = "default",
  reveal = true,
  className,
  children,
}: BlockSectionProps) {
  const inner = <Container size={containerSize}>{children}</Container>;
  return (
    <Section variant={background} spacing={spacing} className={className}>
      {reveal ? <Reveal>{inner}</Reveal> : inner}
    </Section>
  );
}
