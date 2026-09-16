import type { Universe } from "@/payload-types";
import { Button, Container, SectionHeader } from "@poynt/ui";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

interface UniverseOutroProps {
  outro?: Universe["outro"];
}

/**
 * Broa ut av universet, rett over bunnteksten.
 *
 * Grunnen til at den står her og ikke i toppmenyen: her nede har leseren
 * allerede vært gjennom det hun kom for. DA er hun nysgjerrig på hvem som står
 * bak — og det er et mye bedre møte med Poynt enn et menypunkt hun rakk å
 * klikke på før hun var i gang.
 *
 * Alt innholdet styres fra globalen «Verdifull vekst-universet» i admin.
 */
export function UniverseOutro({ outro }: UniverseOutroProps) {
  if (!outro || outro.enabled === false) return null;

  const primary = outro.primaryCta;
  const secondary = outro.secondaryCta;
  const hasPrimary = !!(primary?.text && primary.url);
  const hasSecondary = !!(secondary?.text && secondary.url);

  // Tomt hode og ingen knapper: da er det ingenting å vise, og et tomt bånd
  // over bunnteksten ser ut som en feil.
  if (!(outro.title || outro.intro || hasPrimary || hasSecondary)) return null;

  return (
    <section className="border-foreground/8 border-t bg-foreground/2 py-16 lg:py-20">
      <Container>
        <SectionHeader
          eyebrow={outro.eyebrow ?? undefined}
          title={outro.title ?? undefined}
          intro={outro.intro ?? undefined}
        />
        {(hasPrimary || hasSecondary) && (
          <div className="flex flex-wrap gap-3">
            {hasPrimary && (
              <Button asChild>
                <Link href={primary?.url as string}>
                  {primary?.text}
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            )}
            {hasSecondary && (
              <Button asChild variant="outline">
                <Link href={secondary?.url as string}>{secondary?.text}</Link>
              </Button>
            )}
          </div>
        )}
      </Container>
    </section>
  );
}
