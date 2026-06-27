import type { ReactNode } from "react";
import { cn } from "../lib/utils";

export interface PageShellProps {
  /**
   * Bredden på innholdskolonnen. «full» (default) bruker hele flaten — samme som
   * dashbordet. «narrow» sentrerer en smal kolonne for skjema/innstillinger.
   */
  width?: "full" | "narrow";
  className?: string;
  children: ReactNode;
}

const WIDTH: Record<NonNullable<PageShellProps["width"]>, string> = {
  full: "",
  narrow: "mx-auto max-w-3xl",
};

/**
 * Felles innholds-skall for medlemsområdets sider, så alle plasserer innholdet
 * likt: én vertikal rytme (gap) og ett sted å styre bredden. Sidene slutter å
 * rulle sine egne `mx-auto max-w-*`. Den ytre paddingen kommer fra `(app)`-
 * layoutens `<main>`, så skallet styrer bare bredde + avstand mellom seksjoner.
 */
export function PageShell({
  width = "full",
  className,
  children,
}: PageShellProps) {
  return (
    <div className={cn("flex flex-col gap-8", WIDTH[width], className)}>
      {children}
    </div>
  );
}
