import type * as React from "react";
import { Icon, type IconName } from "../../icons";
import { cn } from "../../lib/utils";
import { FloatingShapes, Grain, GridPattern } from "../decorative";
import { Heading, Text } from "../typography";

export interface FormSuccessProps {
  /** Overskrift – den store takken. */
  title?: string;
  /** Utdypende bekreftelsestekst under overskriften. */
  message?: React.ReactNode;
  /** Ikon i sirkelen. Bruk et som signaliserer fullført/positivt. */
  icon?: IconName;
  /** Valgfri handling videre (f.eks. «Tilbake til forsiden»). */
  action?: React.ReactNode;
  /**
   * Fargetone på ikon-sirkelen og washen. `primary` er standard;
   * `mint`/`saffron` følger fargereisen ellers i produktet.
   */
  tone?: "primary" | "mint" | "saffron";
  /**
   * Hvor mye liv i bakgrunnen:
   * `rich` = flytende palettformer + dot-grid + korn + wash (standard),
   * `soft` = bare en myk tonal wash, `none` = flat.
   */
  decoration?: "rich" | "soft" | "none";
  /** Slå av inngangs-animasjonen (pop/fade) – f.eks. ved redusert bevegelse. */
  animate?: boolean;
  className?: string;
}

const toneClasses: Record<
  NonNullable<FormSuccessProps["tone"]>,
  { ring: string; bubble: string; icon: string; glow: string; wash: string }
> = {
  primary: {
    ring: "ring-primary/25",
    bubble: "bg-primary/10",
    icon: "text-primary",
    glow: "bg-primary/20",
    wash: "from-primary/10",
  },
  mint: {
    ring: "ring-accent-3/50",
    bubble: "bg-accent-3/50",
    icon: "text-primary",
    glow: "bg-accent-3/40",
    wash: "from-accent-3/25",
  },
  saffron: {
    ring: "ring-accent-1/50",
    bubble: "bg-accent-1/25",
    icon: "text-foreground",
    glow: "bg-accent-1/30",
    wash: "from-accent-1/20",
  },
};

/**
 * Kvitterings-/suksesstilstand for skjemaer: en stor takk med animert hake over
 * et levende, dekorativt teppe (palettformer + dot-grid + korn). Markup-løs
 * forelder – wrap den i et `Container`/kort der den brukes. Bakgrunnen styres
 * med `decoration`, bevegelsen med `animate`.
 */
export function FormSuccess({
  title = "Takk for din melding!",
  message,
  icon = "check-circle",
  action,
  tone = "primary",
  decoration = "rich",
  animate = true,
  className,
}: FormSuccessProps) {
  const t = toneClasses[tone];

  return (
    <div
      className={cn(
        "relative isolate overflow-hidden rounded-3xl border border-foreground/5 px-6 py-14 text-center",
        decoration !== "none" && cn("bg-linear-to-b to-transparent", t.wash),
        animate && "duration-700 animate-in fade-in slide-in-from-bottom-4",
        className
      )}
    >
      {decoration !== "none" && (
        <>
          {/* Fokusert glød bak haken. */}
          <div
            aria-hidden
            className={cn(
              "-z-10 -translate-x-1/2 pointer-events-none absolute top-6 left-1/2 size-44 rounded-full blur-3xl",
              t.glow
            )}
          />
          {decoration === "rich" && (
            <>
              <FloatingShapes variant="subtle" />
              <GridPattern
                variant="dots"
                size={20}
                fade
                className="text-foreground/[0.06]"
              />
              <Grain intensity="subtle" />
            </>
          )}
        </>
      )}

      <div className="relative z-10 flex flex-col items-center gap-5">
        <div
          className={cn(
            "relative flex size-20 items-center justify-center rounded-full ring-1 backdrop-blur-sm",
            t.bubble,
            t.ring,
            animate && "animate-success-pop"
          )}
        >
          <Icon name={icon} className={cn("size-10", t.icon)} strokeWidth={2} />
        </div>

        <div
          className={cn(
            "space-y-2",
            animate &&
              "delay-300 duration-500 animate-in fade-in slide-in-from-bottom-2"
          )}
        >
          <Heading variant="h3">{title}</Heading>
          {message && (
            <Text variant="muted" customStyles="mx-auto max-w-md">
              {message}
            </Text>
          )}
        </div>

        {action && <div className="mt-1">{action}</div>}
      </div>
    </div>
  );
}
