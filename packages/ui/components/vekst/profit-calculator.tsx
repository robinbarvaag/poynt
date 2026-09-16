"use client";

import { useId, useState } from "react";
import { Icon } from "../../icons";
import { cn } from "../../lib/utils";
import { Button } from "../button";
import { NumberField, numberInputClass } from "./field";
import {
  type ProfitVerdict,
  formatInput,
  formatKr,
  parseNumber,
  profitPercent,
  profitVerdict,
} from "./logic";
import { Stamp, type StampTone } from "./stamp";
import { ZoneGauge } from "./zone-gauge";

export interface ProfitExample {
  /** Knappeteksten, f.eks. «Prøv Gudruns komler». */
  label: string;
  price: number;
  cost: number;
  /** Navnet på kostnadsraden i eksempelet. */
  costLabel?: string;
  /** Historien bak eksempelet, vises når det er lastet inn. */
  note?: string;
}

export interface ProfitCalculatorProps {
  example?: ProfitExample;
}

interface CostRow {
  id: number;
  label: string;
  amount: string;
}

const START_PRICE = "1 000";
const START_COSTS: CostRow[] = [
  { id: 1, label: "Materialer og innkjøp", amount: "300" },
  { id: 2, label: "Frakt og emballasje", amount: "80" },
  { id: 3, label: "Din egen tid", amount: "250" },
];

const VERDICT: Record<
  ProfitVerdict,
  { stamp: string; tone: StampTone; text: string }
> = {
  tap: {
    stamp: "Taper penger",
    tone: "alarm",
    text: "Du taper penger på hvert salg. Prisen må opp, eller kostnadene ned.",
  },
  tynt: {
    stamp: "Tynt",
    tone: "ink",
    text: "Det går rundt, men det er lite å gå på. Boka regner 30–60 % som god lønnsomhet.",
  },
  bra: {
    stamp: "Lønnsomt",
    tone: "good",
    text: "Innenfor 30–60 %, det boka kaller god lønnsomhet.",
  },
  hoy: {
    stamp: "Sjekk kostnadene",
    tone: "ink",
    text: "Over 60 %. Flott hvis det stemmer. Har du husket å ta med din egen tid?",
  },
};

const formatPercent = (value: number) =>
  `${Math.round(value).toString().replace("-", "−")} %`;

/**
 * Lønnsomhetskalkulatoren fra boka: pris minus alle kostnader, delt på prisen.
 * Måleren svinger inn i bokas fargesoner, og et eksempel (Gudruns komler) kan
 * lastes inn med ett trykk.
 */
export function ProfitCalculator({ example }: ProfitCalculatorProps) {
  const id = useId();
  const [price, setPrice] = useState(START_PRICE);
  const [costs, setCosts] = useState<CostRow[]>(START_COSTS);
  const [nextId, setNextId] = useState(START_COSTS.length + 1);
  const [exampleActive, setExampleActive] = useState(false);

  const priceValue = parseNumber(price);
  const costTotal = costs.reduce(
    (sum, row) => sum + parseNumber(row.amount),
    0
  );
  const percent = profitPercent(priceValue, costTotal);
  const verdict = percent === null ? null : profitVerdict(percent);

  function edit(update: () => void) {
    update();
    setExampleActive(false);
  }

  function updateCost(rowId: number, patch: Partial<CostRow>) {
    edit(() =>
      setCosts((rows) =>
        rows.map((row) => (row.id === rowId ? { ...row, ...patch } : row))
      )
    );
  }

  function addCost() {
    edit(() => {
      setCosts((rows) => [...rows, { id: nextId, label: "", amount: "" }]);
      setNextId((n) => n + 1);
    });
  }

  function loadExample() {
    if (!example) return;
    setPrice(formatInput(String(example.price)));
    setCosts([
      {
        id: nextId,
        label: example.costLabel ?? "Kostnad per stykk",
        amount: formatInput(String(example.cost)),
      },
    ]);
    setNextId((n) => n + 1);
    setExampleActive(true);
  }

  function reset() {
    setPrice(START_PRICE);
    setCosts(START_COSTS);
    setExampleActive(false);
  }

  return (
    <div className="grid gap-8 rounded-3xl bg-card p-5 ring-1 ring-foreground/10 md:grid-cols-2 md:gap-10 md:p-8">
      <div className="flex flex-col gap-5">
        <NumberField
          id={`${id}-price`}
          label="Prisen kunden betaler"
          unit="kr"
          value={price}
          onValueChange={(value) => edit(() => setPrice(value))}
        />

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1.5 font-medium text-sm">
            Alle kostnader for å levere
          </legend>
          {costs.map((row, index) => (
            <div key={row.id} className="flex items-center gap-2">
              <input
                aria-label={`Kostnad ${index + 1}, navn`}
                placeholder="Hva koster det?"
                value={row.label}
                onChange={(event) =>
                  updateCost(row.id, { label: event.target.value })
                }
                className={cn(numberInputClass, "min-w-0 flex-[3]")}
              />
              <div className="relative min-w-0 flex-[2]">
                <input
                  aria-label={`Kostnad ${index + 1}, beløp i kroner`}
                  inputMode="decimal"
                  autoComplete="off"
                  value={row.amount}
                  onChange={(event) =>
                    updateCost(row.id, { amount: event.target.value })
                  }
                  onBlur={(event) => {
                    const formatted = formatInput(event.target.value);
                    if (formatted !== event.target.value) {
                      updateCost(row.id, { amount: formatted });
                    }
                  }}
                  className={cn(numberInputClass, "pr-9 text-right")}
                />
                <span className="pointer-events-none absolute inset-y-0 right-3 grid place-items-center text-muted-foreground text-sm">
                  kr
                </span>
              </div>
              <button
                type="button"
                onClick={() =>
                  edit(() =>
                    setCosts((rows) => rows.filter((r) => r.id !== row.id))
                  )
                }
                disabled={costs.length === 1}
                className="grid size-11 shrink-0 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30"
                aria-label={`Fjern kostnad ${index + 1}`}
              >
                <Icon name="trash" className="size-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addCost}
            className="inline-flex items-center gap-1.5 self-start rounded-full px-1 py-1 font-heading font-semibold text-sm transition-colors hover:text-primary"
          >
            <Icon name="plus" className="size-4" />
            Legg til kostnad
          </button>
        </fieldset>

        <div className="mt-auto flex flex-wrap gap-2">
          {example && (
            <Button
              type="button"
              onClick={loadExample}
              className="rounded-full bg-[var(--vk-surface)] text-[var(--vk-ink)] hover:bg-[var(--vk-surface)] hover:brightness-95"
            >
              <Icon name="book" className="mr-2 size-4" />
              {example.label}
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            onClick={reset}
            className="rounded-full"
          >
            Nullstill
          </Button>
        </div>
      </div>

      <div className="flex flex-col items-center gap-4 text-center">
        <div className="relative flex w-full flex-col items-center text-foreground">
          <ZoneGauge
            value={percent}
            min={-40}
            max={80}
            bands={[
              { from: -40, to: 0, zone: "rosa" },
              { from: 0, to: 30, zone: "gul" },
              { from: 30, to: 80, zone: "gronn" },
            ]}
            label={
              percent === null
                ? "Lønnsomhet: fyll inn en pris"
                : `Lønnsomhet: ${formatPercent(percent)}`
            }
          />
          <div className="absolute top-0 right-0 sm:right-4">
            {verdict && (
              <Stamp tone={VERDICT[verdict].tone}>
                {VERDICT[verdict].stamp}
              </Stamp>
            )}
          </div>
        </div>

        <div aria-live="polite" className="flex flex-col items-center gap-2">
          <span className="font-extrabold font-heading text-5xl tabular-nums leading-none tracking-tight">
            {percent === null ? "–" : formatPercent(percent)}
          </span>
          <span className="text-muted-foreground text-sm uppercase tracking-[0.2em]">
            lønnsomhet
          </span>
          <p className="max-w-sm text-balance text-sm leading-relaxed">
            {verdict
              ? VERDICT[verdict].text
              : "Fyll inn prisen kunden betaler."}
          </p>
        </div>

        {percent !== null && (
          <p className="rounded-xl bg-muted/60 px-3 py-2 font-mono text-muted-foreground text-xs tabular-nums">
            ({formatKr(priceValue)} − {formatKr(costTotal)}) ÷{" "}
            {formatKr(priceValue)} × 100 = {formatPercent(percent)}
          </p>
        )}

        {exampleActive && example?.note && (
          <p className="rounded-2xl bg-[var(--vk-surface)] p-4 text-left text-[var(--vk-ink)] text-sm leading-relaxed">
            {example.note}
          </p>
        )}
      </div>
    </div>
  );
}
