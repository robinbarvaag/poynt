import { GrowthCalculator, type ProfitExample } from "@poynt/ui";
import {
  type VekstHeaderProps,
  headerProps,
  text,
  vekstLink,
} from "./vekst-palette";

interface GrowthCalculatorBlockProps extends VekstHeaderProps {
  calculator?: "profit" | "hourly" | "forecast" | null;
  profitExample?: {
    label?: string | null;
    price?: number | null;
    cost?: number | null;
    costLabel?: string | null;
    note?: string | null;
  } | null;
  multiplier?: number | null;
  monthlyNeed?: number | null;
  footnote?: string | null;
  linkLabel?: string | null;
  linkUrl?: string | null;
}

/** Mapper Payload-blokken `growthCalculator` til GrowthCalculator i @poynt/ui. */
export function GrowthCalculatorBlock(props: GrowthCalculatorBlockProps) {
  const ex = props.profitExample;
  const label = text(ex?.label);
  const example: ProfitExample | undefined =
    label && typeof ex?.price === "number" && typeof ex?.cost === "number"
      ? {
          label,
          price: ex.price,
          cost: ex.cost,
          costLabel: text(ex.costLabel),
          note: text(ex.note),
        }
      : undefined;

  return (
    <GrowthCalculator
      {...headerProps(props)}
      calculator={props.calculator ?? "profit"}
      profit={{ example }}
      hourly={{ multiplier: props.multiplier ?? undefined }}
      forecast={{ monthlyNeed: props.monthlyNeed ?? undefined }}
      footnote={text(props.footnote)}
      link={vekstLink(props.linkLabel, props.linkUrl)}
    />
  );
}
