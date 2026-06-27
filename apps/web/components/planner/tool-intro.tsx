import { Heading, Text } from "@poynt/ui";
import { Icon, type IconName } from "@poynt/ui/icons";
import type { ReactNode } from "react";

export interface ToolIntroStep {
  icon: IconName;
  title: string;
  description: string;
}

interface ToolIntroProps {
  /** Verktøyets ikon, vist i en rolig chip øverst. */
  icon: IconName;
  title: string;
  /** Kort ledetekst som forklarer hva verktøyet gjør. */
  description: string;
  /** «Slik fungerer det»-punktene — hva verktøyet faktisk gir deg. */
  steps?: ToolIntroStep[];
  /** Overskrift over stegene. */
  stepsTitle?: string;
  /** Handlings-/readiness-området (CTA-kort e.l.). */
  children?: ReactNode;
  /** Liten fotnote, f.eks. «Ca. 3 minutter • Helt gratis». */
  footnote?: string;
}

/**
 * Felles intro-skall for verktøyene i medlemsområdet. Venstrejustert og i full
 * bredde (lever inne i `PageShell`), så Kanalveileder, Markedsplan, Årshjul,
 * Si nei og Podcast deler samme uttrykk — bare innholdet skiller dem. Headeren
 * forklarer verktøyet, stegene viser hva du får, og `children` bærer handlingen.
 */
export function ToolIntro({
  icon,
  title,
  description,
  steps,
  stepsTitle = "Dette får du",
  children,
  footnote,
}: ToolIntroProps) {
  return (
    <div className="flex flex-col gap-8">
      <header className="space-y-3">
        <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon name={icon} className="size-6" />
        </span>
        <Heading size="h1">{title}</Heading>
        <Text variant="muted" customStyles="max-w-2xl text-base">
          {description}
        </Text>
      </header>

      {steps && steps.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-medium text-muted-foreground text-sm uppercase tracking-[0.12em]">
            {stepsTitle}
          </h2>
          <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
            {steps.map((step) => (
              <div key={step.title} className="flex gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  <Icon name={step.icon} className="size-5" />
                </span>
                <div className="min-w-0">
                  <h3 className="font-semibold">{step.title}</h3>
                  <p className="text-muted-foreground text-sm">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {children}

      {footnote && <p className="text-muted-foreground text-sm">{footnote}</p>}
    </div>
  );
}
