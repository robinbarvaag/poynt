"use client";

import { Icon } from "../../icons";
import { UILink } from "../../lib/link";
import { cn } from "../../lib/utils";
import {
  type ChapterPalette,
  POYNT_CHAPTER_PALETTE,
} from "../marketing/chapter-rotator";
import { SectionHeader } from "../section-header";
import {
  HourlyRateCalculator,
  type HourlyRateCalculatorProps,
} from "./hourly-rate-calculator";
import { vekstVars } from "./palette";
import {
  ProfitCalculator,
  type ProfitCalculatorProps,
} from "./profit-calculator";
import { SalesForecast, type SalesForecastProps } from "./sales-forecast";

export type CalculatorKind = "profit" | "hourly" | "forecast";

export interface VekstLink {
  label: string;
  href: string;
}

export interface GrowthCalculatorProps {
  eyebrow?: string;
  title?: string;
  intro?: string;
  calculator: CalculatorKind;
  profit?: ProfitCalculatorProps;
  hourly?: HourlyRateCalculatorProps;
  forecast?: SalesForecastProps;
  /** Liten tekst under kalkulatoren, f.eks. «Tallene er veiledende». */
  footnote?: string;
  link?: VekstLink;
  palette?: ChapterPalette;
  className?: string;
}

/** Lenke videre («Les mer i kapittel S»), delt av vekst-blokkene. */
export function VekstFooterLink({ link }: { link: VekstLink }) {
  return (
    <UILink
      href={link.href}
      className="inline-flex items-center gap-1.5 font-heading font-semibold text-foreground underline-offset-4 hover:underline"
    >
      {link.label}
      <Icon name="arrow-right" className="size-4" />
    </UILink>
  );
}

/**
 * Kalkulatorene fra «Verdifull vekst» i én blokk: lønnsomhet, timepris eller
 * spåkula for salg. Regner lokalt i nettleseren; ingenting sendes.
 */
export function GrowthCalculator({
  eyebrow,
  title,
  intro,
  calculator,
  profit,
  hourly,
  forecast,
  footnote,
  link,
  palette = POYNT_CHAPTER_PALETTE,
  className,
}: GrowthCalculatorProps) {
  return (
    <div style={vekstVars(palette)} className={className}>
      <SectionHeader eyebrow={eyebrow} title={title} intro={intro} />
      {calculator === "profit" && <ProfitCalculator {...profit} />}
      {calculator === "hourly" && <HourlyRateCalculator {...hourly} />}
      {calculator === "forecast" && <SalesForecast {...forecast} />}
      {(footnote || link) && (
        <div
          className={cn(
            "mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm",
            footnote ? "justify-between" : "justify-end"
          )}
        >
          {footnote && <p className="text-muted-foreground">{footnote}</p>}
          {link && <VekstFooterLink link={link} />}
        </div>
      )}
    </div>
  );
}
