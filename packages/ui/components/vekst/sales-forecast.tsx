"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useId } from "react";
import { Icon } from "../../icons";
import { cn } from "../../lib/utils";
import { Button } from "../button";
import { NumberField, numberInputClass } from "./field";
import {
  type MonthStatus,
  formatInput,
  formatKr,
  formatNumber,
  monthStatus,
  parseNumber,
} from "./logic";
import { useStoredState } from "./use-stored-state";

export interface SalesForecastProps {
  /** Hva som må inn per måned for å gå i null (eksempelverdi). */
  monthlyNeed?: number;
  /** Eksempel på inntekter du vet kommer, januar og utover. */
  exampleSure?: number[];
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mai",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

/** Grønt = vet at kommer, gult = antar kommer. */
type Certainty = "sure" | "likely";

interface Category {
  id: string;
  label: string;
  certainty: Certainty;
  /** Ett felt per måned, slik det er skrevet. */
  values: string[];
}

interface ForecastState {
  need: string;
  categories: Category[];
}

const CERTAINTY: Record<
  Certainty,
  { short: string; swatch: string; fill: string }
> = {
  sure: {
    short: "Vet at kommer",
    swatch: "bg-[var(--vk-gronn)]",
    fill: "var(--vk-gronn)",
  },
  likely: {
    short: "Antar kommer",
    swatch: "bg-[var(--vk-gul)]",
    fill: "var(--vk-gul)",
  },
};

/** Hagesenteret i boka: januar–april. */
const BOOK_EXAMPLE_SURE = [40_000, 3_000, 98_000, 152_000];
const BOOK_EXAMPLE_NEED = 127_000;

const emptyValues = () => MONTHS.map(() => "");

function newId() {
  return `k${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

function exampleState(need: number, sure: number[]): ForecastState {
  return {
    need: formatNumber(need),
    categories: [
      {
        id: "sure",
        label: "Vet at kommer",
        certainty: "sure",
        values: MONTHS.map((_, i) => (sure[i] ? formatNumber(sure[i]) : "")),
      },
      {
        id: "likely",
        label: "Antar kommer",
        certainty: "likely",
        values: emptyValues(),
      },
    ],
  };
}

const isValues = (values: unknown): values is string[] =>
  Array.isArray(values) &&
  values.length === MONTHS.length &&
  values.every((v) => typeof v === "string");

function parseState(raw: unknown): ForecastState | null {
  if (!raw || typeof raw !== "object") return null;
  const state = raw as Record<string, unknown>;
  if (typeof state.need !== "string") return null;

  if (Array.isArray(state.categories)) {
    const categories = state.categories.filter(
      (c): c is Category =>
        !!c &&
        typeof c.id === "string" &&
        typeof c.label === "string" &&
        (c.certainty === "sure" || c.certainty === "likely") &&
        isValues(c.values)
    );
    return categories.length > 0 ? { need: state.need, categories } : null;
  }

  // Eldre format (før egne kategorier): én rad sikkert og én rad antatt.
  if (Array.isArray(state.months) && state.months.length === MONTHS.length) {
    const months = state.months as { sure?: unknown; likely?: unknown }[];
    const pick = (key: "sure" | "likely") =>
      months.map((m) => (typeof m?.[key] === "string" ? m[key] : ""));
    return {
      need: state.need,
      categories: [
        {
          id: "sure",
          label: "Vet at kommer",
          certainty: "sure",
          values: pick("sure"),
        },
        {
          id: "likely",
          label: "Antar kommer",
          certainty: "likely",
          values: pick("likely"),
        },
      ],
    };
  }
  return null;
}

const STATUS_TEXT: Record<MonthStatus, string> = {
  tomt: "ikke fylt inn",
  dekket: "dekket",
  kanskje: "dekket hvis det antatte kommer",
  under: "under nullpunktet",
};

// Tegneflaten til stolpediagrammet.
const W = 720;
const H = 250;
const PAD_LEFT = 64;
const PAD_RIGHT = 12;
const PAD_TOP = 24;
const PAD_BOTTOM = 30;
const SLOT = (W - PAD_LEFT - PAD_RIGHT) / MONTHS.length;
const BAR = 30;

const cellInputClass = cn(numberInputClass, "h-10 px-3 text-right");

/**
 * Spåkula for salg: inntekter du vet kommer (grønt) og antar kommer (gult),
 * måned for måned, mot det du må ha inn for å gå i null. Leseren kan dele
 * inntektene i egne kategorier (f.eks. «Kurs» eller «Faste avtaler») og
 * merke hver av dem som sikker eller antatt. Kula gløder sterkere jo flere
 * måneder som er dekket.
 */
export function SalesForecast({
  monthlyNeed = BOOK_EXAMPLE_NEED,
  exampleSure = BOOK_EXAMPLE_SURE,
}: SalesForecastProps) {
  const id = useId();
  const reduceMotion = useReducedMotion();
  const example = exampleState(monthlyNeed, exampleSure);
  const [state, setState] = useStoredState<ForecastState>(
    "vekst-spakula",
    example,
    parseState
  );

  const need = parseNumber(state.need);
  const months = MONTHS.map((_, i) => {
    let sure = 0;
    let likely = 0;
    for (const category of state.categories) {
      const value = parseNumber(category.values[i] ?? "");
      if (category.certainty === "sure") sure += value;
      else likely += value;
    }
    return { sure, likely };
  });
  const statuses = months.map((m) => monthStatus(m, need));
  const filled = statuses.filter((s) => s !== "tomt").length;
  const under = statuses.filter((s) => s === "under").length;
  const maybe = statuses.filter((s) => s === "kanskje").length;
  const covered = filled === 0 ? 0 : (filled - under - maybe * 0.5) / filled;

  const maxValue =
    Math.max(need, ...months.map((m) => m.sure + m.likely), 1) * 1.15;
  const y = (value: number) =>
    PAD_TOP + (1 - value / maxValue) * (H - PAD_TOP - PAD_BOTTOM);
  const base = y(0);

  function updateCategory(categoryId: string, patch: Partial<Category>) {
    setState((s) => ({
      ...s,
      categories: s.categories.map((c) =>
        c.id === categoryId ? { ...c, ...patch } : c
      ),
    }));
  }

  function updateValue(categoryId: string, month: number, value: string) {
    setState((s) => ({
      ...s,
      categories: s.categories.map((c) =>
        c.id === categoryId
          ? { ...c, values: c.values.map((v, i) => (i === month ? value : v)) }
          : c
      ),
    }));
  }

  function addCategory() {
    setState((s) => ({
      ...s,
      categories: [
        ...s.categories,
        {
          id: newId(),
          label: "",
          certainty: "likely",
          values: emptyValues(),
        },
      ],
    }));
  }

  function removeCategory(categoryId: string) {
    setState((s) => ({
      ...s,
      categories: s.categories.filter((c) => c.id !== categoryId),
    }));
  }

  let summary = "Fyll inn månedene, så ser du inn i kula.";
  if (filled > 0) {
    summary =
      under === 0
        ? `Alle ${filled} utfylte måneder holder${maybe > 0 ? `, men ${maybe} bare hvis det antatte kommer` : ""}.`
        : `${under} av ${filled} utfylte måneder er under nullpunktet. Der trenger du ekstra salgsinnsats.`;
  }

  const transition = reduceMotion
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 160, damping: 22 };

  return (
    <div className="flex flex-col gap-6 rounded-3xl bg-card p-5 ring-1 ring-foreground/10 md:p-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <div
          aria-hidden="true"
          className="size-24 shrink-0 self-center rounded-full transition-shadow duration-700"
          style={{
            background:
              "radial-gradient(circle at 34% 28%, #ffffff 0%, var(--vk-accent) 30%, var(--vk-surface) 72%)",
            boxShadow: `0 0 ${12 + covered * 44}px ${covered * 14}px color-mix(in oklab, var(--vk-accent) ${25 + covered * 55}%, transparent)`,
          }}
        />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p
            aria-live="polite"
            className="font-heading font-semibold text-lg leading-snug"
          >
            {summary}
          </p>
          <p className="text-muted-foreground text-sm">
            Grønt er det du vet kommer, gult det du antar kommer.
          </p>
        </div>
        <NumberField
          id={`${id}-need`}
          label="Må inn per måned"
          unit="kr"
          value={state.need}
          onValueChange={(value) => setState((s) => ({ ...s, need: value }))}
          className="sm:w-48"
        />
      </div>

      <div className="-mx-5 overflow-x-auto px-5 md:mx-0 md:px-0">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label={`Inntekter per måned mot ${formatKr(need)} i nullpunkt`}
          className="h-auto w-full min-w-[40rem] text-foreground"
        >
          <line
            x1={PAD_LEFT}
            x2={W - PAD_RIGHT}
            y1={base}
            y2={base}
            stroke="currentColor"
            strokeOpacity={0.3}
          />
          <text
            x={PAD_LEFT - 10}
            y={base + 4}
            textAnchor="end"
            fontSize={12}
            fill="currentColor"
            fillOpacity={0.6}
          >
            0
          </text>

          {months.map((month, i) => {
            const x = PAD_LEFT + i * SLOT + (SLOT - BAR) / 2;
            const sureTop = y(month.sure);
            const totalTop = y(month.sure + month.likely);
            const status = statuses[i];
            return (
              <g key={MONTHS[i]}>
                <title>{`${MONTHS[i]}: ${formatKr(month.sure)} sikkert, ${formatKr(month.likely)} antatt, ${STATUS_TEXT[status]}`}</title>
                <motion.rect
                  x={x}
                  width={BAR}
                  rx={4}
                  fill={CERTAINTY.likely.fill}
                  initial={false}
                  animate={{ y: totalTop, height: base - totalTop }}
                  transition={transition}
                />
                <motion.rect
                  x={x}
                  width={BAR}
                  rx={4}
                  fill={CERTAINTY.sure.fill}
                  initial={false}
                  animate={{ y: sureTop, height: base - sureTop }}
                  transition={transition}
                />
                {status === "under" && (
                  <circle
                    cx={x + BAR / 2}
                    cy={totalTop - 10}
                    r={4}
                    fill="#b3264f"
                  />
                )}
                <text
                  x={x + BAR / 2}
                  y={H - 8}
                  textAnchor="middle"
                  fontSize={12}
                  fill={status === "under" ? "#b3264f" : "currentColor"}
                  fillOpacity={status === "tomt" ? 0.45 : 0.85}
                  fontWeight={status === "under" ? 700 : 400}
                >
                  {MONTHS[i]}
                </text>
              </g>
            );
          })}

          {need > 0 && (
            <g>
              <line
                x1={PAD_LEFT}
                x2={W - PAD_RIGHT}
                y1={y(need)}
                y2={y(need)}
                stroke="currentColor"
                strokeWidth={2}
                strokeDasharray="6 6"
              />
              <text
                x={PAD_LEFT - 10}
                y={y(need) + 4}
                textAnchor="end"
                fontSize={12}
                fill="currentColor"
              >
                {formatNumber(need / 1000)}k
              </text>
              <text
                x={W - PAD_RIGHT}
                y={y(need) - 8}
                textAnchor="end"
                fontSize={12}
                fontWeight={600}
                fill="currentColor"
              >
                Nullpunkt
              </text>
            </g>
          )}
        </svg>
      </div>

      <details className="group rounded-2xl ring-1 ring-foreground/10">
        <summary className="flex cursor-pointer select-none list-none items-center gap-2 rounded-2xl px-4 py-3 font-heading font-semibold text-sm transition-colors hover:bg-muted/50 [&::-webkit-details-marker]:hidden">
          <Icon
            name="chevron-right"
            className="size-4 transition-transform group-open:rotate-90"
          />
          <span className="group-open:hidden">Fyll inn dine egne tall</span>
          <span className="hidden group-open:inline">Skjul tabellen</span>
        </summary>
        <div className="flex flex-col gap-4 px-4 pb-4">
          <p className="text-muted-foreground text-sm">
            Del gjerne inntektene i kategorier, f.eks. «Faste avtaler» eller
            «Kurs», og velg om hver av dem er noe du vet eller antar kommer.
          </p>
          <div className="-mx-4 overflow-x-auto px-4">
            <table className="w-full border-separate border-spacing-x-2 border-spacing-y-1.5 text-sm">
              <thead>
                <tr className="align-bottom">
                  <th
                    scope="col"
                    className="w-14 pb-1 text-left font-medium text-muted-foreground"
                  >
                    Måned
                  </th>
                  {state.categories.map((category, index) => {
                    const certainty = CERTAINTY[category.certainty];
                    const name = category.label || `Kategori ${index + 1}`;
                    return (
                      <th
                        key={category.id}
                        scope="col"
                        className="min-w-40 pb-1 text-left font-normal"
                      >
                        <div className="flex flex-col gap-1.5">
                          <input
                            aria-label={`Navn på kategori ${index + 1}`}
                            placeholder={`Kategori ${index + 1}`}
                            value={category.label}
                            onChange={(event) =>
                              updateCategory(category.id, {
                                label: event.target.value,
                              })
                            }
                            className={cn(
                              numberInputClass,
                              "h-10 px-3 font-medium text-sm"
                            )}
                          />
                          <div className="flex items-center justify-between gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                updateCategory(category.id, {
                                  certainty:
                                    category.certainty === "sure"
                                      ? "likely"
                                      : "sure",
                                })
                              }
                              aria-label={`${name}: ${certainty.short.toLowerCase()}. Trykk for å bytte.`}
                              className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-muted-foreground text-xs transition-colors hover:bg-muted hover:text-foreground"
                            >
                              <span
                                aria-hidden="true"
                                className={cn(
                                  "size-3 rounded-sm",
                                  certainty.swatch
                                )}
                              />
                              {certainty.short}
                            </button>
                            <button
                              type="button"
                              onClick={() => removeCategory(category.id)}
                              disabled={state.categories.length === 1}
                              aria-label={`Fjern ${name}`}
                              className="grid size-7 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30"
                            >
                              <Icon name="trash" className="size-3.5" />
                            </button>
                          </div>
                        </div>
                      </th>
                    );
                  })}
                  <th
                    scope="col"
                    className="min-w-28 pb-1 text-right font-medium text-muted-foreground"
                  >
                    Sum
                  </th>
                </tr>
              </thead>
              <tbody>
                {MONTHS.map((month, i) => {
                  const total = months[i].sure + months[i].likely;
                  const status = statuses[i];
                  return (
                    <tr key={month}>
                      <th
                        scope="row"
                        className="text-left font-medium text-muted-foreground"
                      >
                        {month}
                      </th>
                      {state.categories.map((category, index) => (
                        <td key={category.id}>
                          <input
                            aria-label={`${category.label || `Kategori ${index + 1}`}, ${month}`}
                            inputMode="decimal"
                            autoComplete="off"
                            value={category.values[i]}
                            onChange={(event) =>
                              updateValue(category.id, i, event.target.value)
                            }
                            onBlur={(event) => {
                              const formatted = formatInput(event.target.value);
                              if (formatted !== event.target.value) {
                                updateValue(category.id, i, formatted);
                              }
                            }}
                            className={cellInputClass}
                          />
                        </td>
                      ))}
                      <td
                        className={cn(
                          "whitespace-nowrap text-right tabular-nums",
                          status === "tomt" && "text-muted-foreground",
                          status === "under" && "font-semibold text-[#b3264f]"
                        )}
                      >
                        <span className="sr-only">{STATUS_TEXT[status]}: </span>
                        {status === "tomt" ? "–" : formatKr(total)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={addCategory}
              className="inline-flex items-center gap-1.5 rounded-full px-1 py-1 font-heading font-semibold text-sm transition-colors hover:text-primary"
            >
              <Icon name="plus" className="size-4" />
              Legg til kategori
            </button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="rounded-full"
              onClick={() => setState(example)}
            >
              Tilbake til eksempelet fra boka
            </Button>
          </div>
          <p className="text-muted-foreground text-xs">
            Tallene huskes i nettleseren din. Ingenting sendes noe sted.
          </p>
        </div>
      </details>
    </div>
  );
}
