import { Button, Eyebrow, Heading, Text, cn } from "@poynt/ui";
import { Icon, type IconName } from "@poynt/ui/icons";
import Link from "next/link";

type HeroAccent = "mint" | "saffron" | "salmon" | "primary";

interface HeroAction {
  label: string;
  href: string;
  icon?: IconName;
}

export interface NextStepHeroProps {
  eyebrow?: string;
  title: string;
  body?: string;
  /** Fargen plukkes fra den aktive fasen, så heroen og veien henger sammen. */
  accent?: HeroAccent;
  primary?: HeroAction;
  secondary?: HeroAction;
}

// Bare en rolig fargetone — ingen medaljong/ikon, så toppen ikke konkurrerer
// med veien under. Fargen knytter heroen til den aktive fasen.
const ACCENT: Record<HeroAccent, string> = {
  mint: "bg-mint/12",
  saffron: "bg-saffron/12",
  salmon: "bg-salmon/12",
  primary: "bg-primary/8",
};

/**
 * Tilstandsstyrt topp på dashbordet. I stedet for et generisk «velkommen» sier
 * den hvor du er og hva det ENE neste steget er — med en tydelig handling.
 * Fargen arves fra den aktive fasen, så toppen og veien snakker samme språk.
 */
export function NextStepHero({
  eyebrow = "Din markedsføring",
  title,
  body,
  accent = "primary",
  primary,
  secondary,
}: NextStepHeroProps) {
  return (
    <section
      className={cn(
        // Samme flate-språk som Card (rounded-3xl, tynn ring, mykt skygge), bare
        // tonet i fasefargen — så heroen ikke ser ut som en annen type boks.
        "rounded-3xl p-6 shadow-sm ring-1 ring-foreground/10 sm:p-8",
        ACCENT[accent]
      )}
    >
      <div className="max-w-2xl space-y-3">
        <Eyebrow marker>{eyebrow}</Eyebrow>
        <Heading size="h2" weight="semibold">
          {title}
        </Heading>
        {body && (
          <Text variant="lead" customStyles="text-base">
            {body}
          </Text>
        )}

        {(primary || secondary) && (
          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            {primary && (
              <Button asChild size="lg" className="gap-2">
                <Link href={primary.href}>
                  {primary.icon && (
                    <Icon name={primary.icon} className="size-4" />
                  )}
                  {primary.label}
                </Link>
              </Button>
            )}
            {secondary && (
              <Button asChild variant="outline" size="lg" className="gap-2">
                <Link href={secondary.href}>
                  {secondary.icon && (
                    <Icon name={secondary.icon} className="size-4" />
                  )}
                  {secondary.label}
                </Link>
              </Button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
