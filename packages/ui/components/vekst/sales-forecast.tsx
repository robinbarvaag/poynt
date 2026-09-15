"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useId } from "react";
import { cn } from "../../lib/utils";
import { Button } from "../button";
import { NumberField, numberInputClass } from "./field";
import {
  type MonthStatus,
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

interface MonthInput {
  sure: string;
  likely: string;
}

interface ForecastState {
  need: string;
  months: MonthInput[];
}

/** Hagesenteret i boka: januar–april. */
const BOOK_EXAMPLE_SURE = [40_000, 3_000, 98_000, 152_000];
const BOOK_EXAMPLE_NEED = 127_000;

function exampleState(need: number, sure: number[]): ForecastState {
  return {
    need: formatNumber(need),
    months: MONTHS.map((_, i) => ({
      sure: sure[i] ? formatNumber(sure[i]) : "",
      likely: "",
    })),
  };
}

function parseState(raw: unknown): ForecastState | null {
  if (!raw || typeof raw !== "object") return null;
  const state = raw as Partial<ForecastState>;
  if (typeof state.need !== "string" || !Array.isArray(state.months)) {
    return null;
  }
  if (state.months.length !== MONTHS.length) return null;
  const valid = state.months.every(
    (m) => m && typeof m.sure === "string" && typeof m.likely === "string"
  );
  return valid ? (state as ForecastState) : null;
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

/**
 * Spåkula for salg: inntekter du vet kommer (grønt) og antar kommer (gult),
 * måned for måned, mot det du må ha inn for å gå i null. Kula gløder sterkere
 * jo flere måneder som er dekket.
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
  const months = state.months.map((m) => ({
    sure: parseNumber(m.sure),
    likely: parseNumber(m.likely),
  }));
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

  function updateMonth(index: number, patch: Partial<MonthInput>) {
    setState((s) => ({
      ...s,
      months: s.months.map((m, i) => (i === index ? { ...m, ...patch } : m)),
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
                  fill="var(--vk-gul)"
                  initial={false}
                  animate={{ y: totalTop, height: base - totalTop }}
                  transition={transition}
                />
                <motion.rect
                  x={x}
                  width={BAR}
                  rx={4}
                  fill="var(--vk-gronn)"
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
        <summary className="cursor-pointer select-none list-none rounded-2xl px-4 py-3 font-heading font-semibold text-sm transition-colors hover:bg-muted/50">
          <span className="group-open:hidden">Fyll inn dine egne tall</span>
          <span className="hidden group-open:inline">Skjul tabellen</span>
        </summary>
        <div className="overflow-x-auto px-4 pb-4">
          <table className="w-full min-w-[56rem] border-separate border-spacing-1 text-sm">
            <thead>
              <tr>
                <th className="w-32 text-left font-medium text-muted-foreground">
                  <span className="sr-only">Type</span>
                </th>
                {MONTHS.map((month) => (
                  <th
                    key={month}
                    scope="col"
                    className="font-medium text-muted-foreground"
                  >
                    {month}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(
                [
                  ["sure", "Vet at kommer", "bg-[var(--vk-gronn)]"],
                  ["likely", "Antar kommer", "bg-[var(--vk-gul)]"],
                ] as const
              ).map(([field, label, swatch]) => (
                <tr key={field}>
                  <th scope="row" className="text-left font-medium">
                    <span className="inline-flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className={cn("size-3 rounded-sm", swatch)}
                      />
                      {label}
                    </span>
                  </th>
                  {state.months.map((month, i) => (
                    <td key={MONTHS[i]}>
                      <input
                        aria-label={`${label}, ${MONTHS[i]}`}
                        inputMode="decimal"
                        autoComplete="off"
                        value={month[field]}
                        onChange={(event) =>
                          updateMonth(i, { [field]: event.target.value })
                        }
                        className={cn(
                          numberInputClass,
                          "h-9 px-2 text-right text-sm"
                        )}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-muted-foreground text-xs">
              Tallene huskes i nettleseren din. Ingenting sendes noe sted.
            </p>
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
        </div>
      </details>
    </div>
  );
}
