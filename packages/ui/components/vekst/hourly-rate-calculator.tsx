"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useId, useState } from "react";
import { NumberField } from "./field";
import {
  billableHours,
  formatKr,
  formatNumber,
  hourlyRate,
  parseNumber,
  yearlyCost,
} from "./logic";
import { Stamp } from "./stamp";

export interface HourlyRateCalculatorProps {
  /** Påslag på lønnen. Boka bruker ×1,5 for AS. */
  multiplier?: number;
}

const formatMultiplier = (value: number) =>
  value.toLocaleString("nb-NO", { maximumFractionDigits: 2 });

/**
 * Timepris-kalkulatoren: ønsket lønn med påslag pluss kostnader, delt på
 * timene du faktisk kan fakturere. Svaret henger på en prislapp som dingler
 * når tallet endres, og sammenlignes med prisen du tar i dag.
 */
export function HourlyRateCalculator({
  multiplier = 1.5,
}: HourlyRateCalculatorProps) {
  const id = useId();
  const reduceMotion = useReducedMotion();
  const [salary, setSalary] = useState("650 000");
  const [otherCosts, setOtherCosts] = useState("80 000");
  const [workWeeks, setWorkWeeks] = useState("46");
  const [hoursPerWeek, setHoursPerWeek] = useState("37,5");
  const [billableShare, setBillableShare] = useState(60);
  const [currentPrice, setCurrentPrice] = useState("");

  const input = {
    annualSalary: parseNumber(salary),
    multiplier,
    otherCosts: parseNumber(otherCosts),
    workWeeks: parseNumber(workWeeks),
    hoursPerWeek: parseNumber(hoursPerWeek),
    billableShare,
  };
  const rate = hourlyRate(input);
  const hours = billableHours(input);
  const current = parseNumber(currentPrice);
  const tooCheap = rate !== null && current > 0 && current < rate;

  return (
    <div className="grid gap-8 rounded-3xl bg-card p-5 ring-1 ring-foreground/10 md:grid-cols-2 md:gap-10 md:p-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <NumberField
          id={`${id}-salary`}
          label="Lønn du vil ta ut i året"
          unit="kr"
          value={salary}
          onValueChange={setSalary}
          className="sm:col-span-2"
        />
        <NumberField
          id={`${id}-costs`}
          label="Andre kostnader i året"
          unit="kr"
          hint="Lokaler, verktøy, regnskap, forsikring"
          value={otherCosts}
          onValueChange={setOtherCosts}
          className="sm:col-span-2"
        />
        <NumberField
          id={`${id}-weeks`}
          label="Arbeidsuker i året"
          value={workWeeks}
          onValueChange={setWorkWeeks}
        />
        <NumberField
          id={`${id}-hours`}
          label="Timer per uke"
          value={hoursPerWeek}
          onValueChange={setHoursPerWeek}
        />
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label
            htmlFor={`${id}-share`}
            className="flex justify-between font-medium text-sm"
          >
            <span>Andel du kan fakturere</span>
            <span className="tabular-nums">{billableShare} %</span>
          </label>
          <input
            id={`${id}-share`}
            type="range"
            min={10}
            max={100}
            step={5}
            value={billableShare}
            onChange={(event) => setBillableShare(Number(event.target.value))}
            className="w-full accent-[var(--vk-surface)]"
          />
          <p className="text-muted-foreground text-xs">
            Salg, admin og e-post tar også tid. Få klarer mer enn 60–70 %.
          </p>
        </div>
        <NumberField
          id={`${id}-current`}
          label="Timeprisen du tar i dag (valgfritt)"
          unit="kr"
          value={currentPrice}
          onValueChange={setCurrentPrice}
          className="sm:col-span-2"
        />
      </div>

      <div className="flex flex-col items-center gap-6">
        {/* Prislappen henger i en snor og svinger når tallet endres. */}
        <div className="relative flex flex-col items-center pt-10">
          <span
            aria-hidden="true"
            className="absolute top-0 left-1/2 h-14 w-px -translate-x-1/2 bg-foreground/40"
          />
          <motion.div
            key={rate === null ? "tom" : Math.round(rate / 25)}
            initial={reduceMotion ? false : { rotate: 8 }}
            animate={{ rotate: 0 }}
            transition={{ type: "spring", stiffness: 80, damping: 5 }}
            style={{ originY: 0 }}
            className="relative min-w-56 rounded-2xl bg-[var(--vk-surface)] px-8 pt-10 pb-6 text-center text-[var(--vk-ink)] shadow-lg"
          >
            <span
              aria-hidden="true"
              className="absolute top-3 left-1/2 size-3.5 -translate-x-1/2 rounded-full bg-background"
            />
            <span className="block font-heading font-semibold text-[var(--vk-ink-soft)] text-xs uppercase tracking-[0.25em]">
              Timepris
            </span>
            <span
              aria-live="polite"
              className="mt-1 block font-extrabold font-heading text-5xl tabular-nums leading-none tracking-tight"
            >
              {rate === null ? "–" : formatNumber(rate)}
            </span>
            <span className="mt-2 block text-[var(--vk-ink-soft)] text-sm">
              kr per time, eks. mva.
            </span>
          </motion.div>
          {current > 0 && rate !== null && (
            <div className="absolute top-6 -right-6">
              <Stamp tone={tooCheap ? "alarm" : "good"}>
                {tooCheap ? "For billig?" : "Dekker det"}
              </Stamp>
            </div>
          )}
        </div>

        {tooCheap && (
          <p className="max-w-sm text-balance text-center font-heading font-semibold leading-snug">
            «Hvis ingen synes du er for dyr, er du sannsynligvis for billig.»
          </p>
        )}

        <dl className="grid w-full max-w-sm grid-cols-[1fr_auto] gap-x-4 gap-y-2 text-sm tabular-nums">
          <dt className="text-muted-foreground">
            Lønn × {formatMultiplier(multiplier)}
          </dt>
          <dd className="text-right">
            {formatKr(input.annualSalary * multiplier)}
          </dd>
          <dt className="text-muted-foreground">+ andre kostnader</dt>
          <dd className="text-right">{formatKr(input.otherCosts)}</dd>
          <dt className="border-foreground/10 border-t pt-2 font-medium">
            Koster i året
          </dt>
          <dd className="border-foreground/10 border-t pt-2 text-right font-medium">
            {formatKr(yearlyCost(input))}
          </dd>
          <dt className="text-muted-foreground">÷ fakturerbare timer</dt>
          <dd className="text-right">{formatNumber(hours)} t</dd>
        </dl>
        <p className="max-w-sm text-center text-muted-foreground text-xs leading-relaxed">
          Timeprisen betaler lønnen du ønsker og kostnadene dine. Fortjeneste
          kommer på toppen.
        </p>
      </div>
    </div>
  );
}
