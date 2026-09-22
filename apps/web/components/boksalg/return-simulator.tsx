"use client";

import type {
  ChannelRates,
  ChannelVolumes,
  Coverage,
  EconomySettings,
  Totals,
} from "@/lib/boksalg/economy";
import { maxReturnPercent, returnRisk } from "@/lib/boksalg/economy";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@poynt/ui";
import { useMemo, useState } from "react";
import { ESTIMATE, EXACT } from "./chart-tokens";
import { antall, kr } from "./format";

/**
 * «Veien til null» med returrisiko. Bokhandlene kjøper inn med returrett, så
 * det de har betalt for er inntekt — men ikke sikret inntekt før returfristen
 * er ute. Slideren viser hva som skjer om de sender tilbake X % av innkjøpet.
 *
 * Bruker `returnRisk` fra economy.ts, samme regnestykke som testene, så
 * tallene her og i kanaltabellen kan ikke sprike.
 *
 * Standardstillingen er verst tenkelig (full returrett): det er det tallet
 * Susanne bør planlegge etter, ikke det mest optimistiske.
 */

const HATCH = `repeating-linear-gradient(45deg, ${ESTIMATE} 0 3px, rgba(255,255,255,0.55) 3px 5px)`;

export function ReturnSimulator({
  settings,
  channels,
  returnable,
  earned,
  coverage,
  totalExpenses,
}: {
  settings: EconomySettings;
  channels: ChannelRates[];
  returnable: ChannelVolumes;
  earned: Totals;
  coverage: Coverage;
  totalExpenses: number;
}) {
  const max = maxReturnPercent(channels);
  const [percent, setPercent] = useState(max);

  const risk = useMemo(
    () =>
      returnRisk(
        settings,
        channels,
        returnable,
        earned,
        totalExpenses,
        percent
      ),
    [settings, channels, returnable, earned, totalExpenses, percent]
  );

  const share = (value: number) =>
    totalExpenses > 0
      ? Math.max(0, Math.min(100, (value / totalExpenses) * 100))
      : 0;
  const securedWidth = share(risk.netAfter);
  const riskWidth = Math.min(100 - securedWidth, share(risk.netLost));
  const remaining = Math.max(0, totalExpenses - earned.net);

  const retailers = risk.channels.filter(
    (row) =>
      (channels.find((channel) => channel.key === row.key)?.maxReturnPercent ??
        0) > 0
  );
  const retailerNames = retailers.map((row) => row.label);
  const retailerText =
    retailerNames.length > 1
      ? `${retailerNames.slice(0, -1).join(", ")} og ${retailerNames.at(-1)}`
      : (retailerNames[0] ?? "bokhandlene");

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-display text-4xl font-bold tabular-nums">
            {coverage.coveredPercent.toLocaleString("nb-NO", {
              maximumFractionDigits: 1,
            })}{" "}
            %
          </p>
          <p className="text-muted-foreground text-sm">
            tjent inn av {kr(totalExpenses)}
            {coverage.averageNetPerCopy !== null &&
              ` · ${kr(coverage.averageNetPerCopy, 2)} per bok i snitt`}
          </p>
        </div>
        {coverage.remainingAtCurrentMix !== null &&
          coverage.remainingAtCurrentMix > 0 && (
            <p className="text-muted-foreground text-right text-sm">
              <strong className="text-foreground">
                {antall(coverage.remainingAtCurrentMix)} bøker
              </strong>{" "}
              igjen, hvis salget fortsetter å fordele seg som nå
            </p>
          )}
      </div>

      {/* Sikret / kan forsvinne / igjen — én linje, tre segmenter. */}
      <div className="flex flex-col gap-2">
        <p className="sr-only">
          {Math.round(securedWidth)} % av utgiftene er sikret,{" "}
          {Math.round(riskWidth)} prosentpoeng til kan forsvinne ved retur.
        </p>
        <div
          className="bg-muted flex h-3 w-full overflow-hidden rounded-full"
          aria-hidden
        >
          <div
            className="h-full transition-all duration-500"
            style={{ width: `${securedWidth}%`, background: EXACT }}
          />
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${riskWidth}%`,
              backgroundColor: ESTIMATE,
              backgroundImage: HATCH,
            }}
          />
        </div>
        <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-xs">
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block size-2.5 rounded-sm"
              style={{ background: EXACT }}
              aria-hidden
            />
            Sikret{" "}
            <strong className="text-foreground tabular-nums">
              {kr(risk.netAfter)}
            </strong>
          </span>
          {max > 0 && (
            <span className="flex items-center gap-1.5">
              <span
                className="inline-block size-2.5 rounded-sm"
                style={{ backgroundColor: ESTIMATE, backgroundImage: HATCH }}
                aria-hidden
              />
              Kan forsvinne ved retur{" "}
              <strong className="text-foreground tabular-nums">
                {kr(risk.netLost)}
              </strong>
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <span
              className="bg-muted inline-block size-2.5 rounded-sm"
              aria-hidden
            />
            Igjen{" "}
            <strong className="text-foreground tabular-nums">
              {kr(remaining)}
            </strong>
          </span>
        </div>
      </div>

      {max > 0 && (
        <div className="border-border flex flex-col gap-4 rounded-xl border p-5">
          <div className="flex flex-col gap-1">
            <h3 className="font-semibold">Hva om bøkene kommer i retur?</h3>
            <p className="text-muted-foreground text-sm">
              {retailerText} kan sende tilbake inntil {max} % av det de kjøpte
              inn. Forhåndsbestilte og avregnede bøker er solgt videre og kommer
              ikke tilbake, så de er ikke med i grunnlaget.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-sm">
              Hvis {retailerText} returnerer{" "}
              <strong className="tabular-nums">{percent} %</strong> av innkjøpet
            </p>
            <input
              type="range"
              min={0}
              max={max}
              step={max >= 10 ? 5 : 1}
              value={percent}
              onChange={(event) => setPercent(Number(event.target.value))}
              className="accent-primary w-full"
              aria-label="Andel av innkjøpet som returneres"
            />
            <div className="text-muted-foreground flex justify-between text-xs">
              <span>Ingen retur</span>
              <span>Full returrett ({max} %)</span>
            </div>
          </div>

          <div className="bg-muted/50 flex flex-wrap items-baseline justify-between gap-4 rounded-lg p-4">
            <p className="font-display text-3xl font-bold tabular-nums">
              {antall(risk.copiesReturned)}{" "}
              <span className="text-muted-foreground text-base font-normal">
                bøker tilbake
              </span>
            </p>
            <p className="text-muted-foreground text-sm">
              <strong className="text-foreground tabular-nums">
                −{kr(risk.netLost)}
              </strong>{" "}
              · dekningen går fra{" "}
              {coverage.coveredPercent.toLocaleString("nb-NO", {
                maximumFractionDigits: 1,
              })}{" "}
              % til{" "}
              <strong className="text-foreground tabular-nums">
                {risk.after.coveredPercent.toLocaleString("nb-NO", {
                  maximumFractionDigits: 1,
                })}{" "}
                %
              </strong>
              {risk.after.remainingAtCurrentMix !== null &&
                risk.after.remainingAtCurrentMix > 0 && (
                  <>
                    {" "}
                    ·{" "}
                    <strong className="text-foreground tabular-nums">
                      {antall(risk.after.remainingAtCurrentMix)} bøker
                    </strong>{" "}
                    igjen til null
                  </>
                )}
            </p>
          </div>

          {retailers.length > 0 && (
            <div className="border-border overflow-hidden rounded-xl border">
              <Table>
                <TableHeader className="bg-muted/60">
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Kanal</TableHead>
                    <TableHead className="text-right">
                      Kan returneres fra
                    </TableHead>
                    <TableHead className="text-right">Kommer tilbake</TableHead>
                    <TableHead className="text-right">Susanne mister</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {retailers.map((row) => (
                    <TableRow key={row.key}>
                      <TableCell className="font-medium">{row.label}</TableCell>
                      <TableCell className="text-muted-foreground text-right tabular-nums">
                        {antall(row.returnable)} bøker
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {antall(row.returned)}
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">
                        {kr(row.netLost)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
