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
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  cn,
} from "@poynt/ui";
import { useMemo, useState } from "react";
import { ESTIMATE, EXACT } from "./chart-tokens";
import { antall, kr } from "./format";

/**
 * Returscenarioet øverst i dashbordet. Bokhandlene kjøper inn med returrett,
 * så det de har betalt for er inntekt — men ikke sikret inntekt før
 * returfristen er ute. Slideren sier «hva om de sender tilbake X %», og ALLE
 * tallene under følger den: solgt inn, netto, resultat og veien til null.
 *
 * Regnestykket er `returnRisk` fra economy.ts, samme som testene, så tallene
 * her og i kanaltabellen kan ikke sprike. Standardstillingen er verst
 * tenkelig (full returrett): det er det tallet Susanne bør planlegge etter.
 */

const HATCH = `repeating-linear-gradient(45deg, ${ESTIMATE} 0 3px, rgba(255,255,255,0.55) 3px 5px)`;

const prosent = (value: number) =>
  `${value.toLocaleString("nb-NO", { maximumFractionDigits: 1 })} %`;

export function ReturnScenario({
  settings,
  channels,
  returnable,
  earned,
  coverage,
  totalExpenses,
  printRun,
}: {
  settings: EconomySettings;
  channels: ChannelRates[];
  returnable: ChannelVolumes;
  earned: Totals;
  coverage: Coverage;
  totalExpenses: number;
  printRun: number | null;
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

  // Tallene slik de ser ut i scenarioet.
  const copies = earned.copies - risk.copiesReturned;
  const revenue = earned.revenue - risk.copiesReturned * settings.listPrice;
  const net = risk.netAfter;
  const after = risk.after;
  const scenario = percent > 0;

  const share = (value: number) =>
    totalExpenses > 0
      ? Math.max(0, Math.min(100, (value / totalExpenses) * 100))
      : 0;
  const securedWidth = share(net);
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
    <>
      {/* ---- Slideren: styrer alt under ------------------------------ */}
      {max > 0 && (
        <Card>
          <CardContent className="flex flex-col gap-4 py-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex flex-col gap-1">
                <h2 className="font-semibold">Hva om bøkene kommer i retur?</h2>
                <p className="text-muted-foreground text-sm">
                  {retailerText} kan sende tilbake inntil {max} % av det de
                  kjøpte inn. Forhåndsbestilte og avregnede bøker er solgt
                  videre og kommer ikke tilbake. Alle tallene under følger
                  slideren.
                </p>
              </div>
              <Badge variant={scenario ? "soft-saffron" : "default"}>
                {scenario
                  ? `${percent} % retur · ${antall(risk.copiesReturned)} bøker tilbake · −${kr(risk.netLost)}`
                  : "Ingen retur"}
              </Badge>
            </div>
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
          </CardContent>
        </Card>
      )}

      {/* ---- Nøkkeltall i scenarioet --------------------------------- */}
      <section
        className={cn(
          "grid gap-4 sm:grid-cols-2",
          printRun ? "lg:grid-cols-5" : "lg:grid-cols-4"
        )}
      >
        <StatTile
          label="Solgt inn"
          value={antall(copies)}
          hint={
            scenario
              ? `${antall(earned.copies)} betalt for · ${antall(risk.copiesReturned)} kan komme tilbake`
              : "bøker du har fått betalt for"
          }
        />
        {printRun && (
          <StatTile
            label="Av opplaget"
            value={`${Math.round((copies / printRun) * 100)} %`}
            hint={`${antall(copies)} av ${antall(printRun)} trykte`}
          />
        )}
        <StatTile
          label="Netto til Susanne"
          value={kr(net)}
          hint={
            earned.kickback > 0
              ? `av ${kr(revenue)} i omsetning, inkl. ${kr(earned.kickback)} kickback`
              : `av ${kr(revenue)} i omsetning`
          }
        />
        <StatTile label="Utgifter" value={kr(totalExpenses)} hint="til nå" />
        <StatTile
          label="Resultat"
          value={kr(after.result)}
          hint={after.result >= 0 ? "boka har gått i pluss" : "igjen å dekke"}
          tone={after.result >= 0 ? "good" : "neutral"}
        />
      </section>

      {/* ---- Veien til null ------------------------------------------ */}
      <Card>
        <CardHeader>
          <CardTitle>Veien til null</CardTitle>
          <CardDescription>
            Hvor mye av de {kr(totalExpenses)} i utgifter som er tjent inn — og
            hvor mye av det bokhandlene fortsatt kan sende tilbake. Et innkjøp
            med returrett er inntekt, men ikke sikret inntekt før returfristen
            er ute.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-display text-4xl font-bold tabular-nums">
                {prosent(after.coveredPercent)}
              </p>
              <p className="text-muted-foreground text-sm">
                tjent inn av {kr(totalExpenses)}
                {scenario &&
                  ` · ${prosent(coverage.coveredPercent)} uten retur`}
                {after.averageNetPerCopy !== null &&
                  ` · ${kr(after.averageNetPerCopy, 2)} per bok i snitt`}
              </p>
            </div>
            {after.remainingAtCurrentMix !== null &&
              after.remainingAtCurrentMix > 0 && (
                <p className="text-muted-foreground text-right text-sm">
                  <strong className="text-foreground">
                    {antall(after.remainingAtCurrentMix)} bøker
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
                  {kr(net)}
                </strong>
              </span>
              {max > 0 && (
                <span className="flex items-center gap-1.5">
                  <span
                    className="inline-block size-2.5 rounded-sm"
                    style={{
                      backgroundColor: ESTIMATE,
                      backgroundImage: HATCH,
                    }}
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
        </CardContent>
      </Card>
    </>
  );
}

function StatTile({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "neutral" | "good";
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-1 py-6">
        <p className="text-muted-foreground text-sm">{label}</p>
        <p
          className={cn(
            "font-display text-3xl font-bold tabular-nums",
            tone === "good" && "text-primary"
          )}
        >
          {value}
        </p>
        {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
      </CardContent>
    </Card>
  );
}
