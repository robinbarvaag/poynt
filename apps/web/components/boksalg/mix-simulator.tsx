"use client";

import type { ChannelRates, EconomySettings } from "@/lib/boksalg/economy";
import { unitEconomics } from "@/lib/boksalg/economy";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@poynt/ui";
import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceDot,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";
import { ESTIMATE, EXACT } from "./chart-tokens";
import { antall, kr } from "./format";

/**
 * «Hva om»-simulator: hvor mange bøker må selges for å dekke utgiftene, gitt en
 * bestemt fordeling mellom to kanaler.
 *
 * Bruker samme `unitEconomics` som resten av dashbordet — det er poenget. En
 * simulator med sin egen kopi av regnestykket ville før eller siden vist andre
 * tall enn tabellen rett over den.
 *
 * Kurven viser hele spennet fra 0 til 100 %, ikke bare punktet slideren står på:
 * det er vippepunktet som er interessant, ikke ett enkelt tall.
 */

export interface MixChannel {
  key: string;
  label: string;
  rates: ChannelRates;
}

const config = {
  books: { label: "Bøker til break-even", color: EXACT },
} satisfies ChartConfig;

export function MixSimulator({
  settings,
  channels,
  totalExpenses,
}: {
  settings: EconomySettings;
  channels: MixChannel[];
  totalExpenses: number;
}) {
  // Standard: den beste og den dårligste kanalen, så kontrasten er synlig
  // med en gang. Det er den forskjellen simulatoren finnes for å vise.
  const sorted = useMemo(
    () =>
      [...channels].sort(
        (a, b) =>
          unitEconomics(settings, b.rates).net -
          unitEconomics(settings, a.rates).net
      ),
    [channels, settings]
  );

  const [directKey, setDirectKey] = useState(sorted[0]?.key ?? "");
  const [retailKey, setRetailKey] = useState(
    sorted[sorted.length - 1]?.key ?? ""
  );
  const [directShare, setDirectShare] = useState(50);

  const direct = channels.find((channel) => channel.key === directKey);
  const retail = channels.find((channel) => channel.key === retailKey);

  const result = useMemo(() => {
    if (!(direct && retail)) return null;

    const directNet = unitEconomics(settings, direct.rates).net;
    const retailNet = unitEconomics(settings, retail.rates).net;

    /** Vektet netto per bok, og bøker som trengs, for en gitt andel direkte. */
    const at = (share: number) => {
      const net = (directNet * share + retailNet * (100 - share)) / 100;
      return {
        net,
        books: net > 0 ? Math.ceil(totalExpenses / net) : null,
      };
    };

    // Hele kurven, ett punkt per 5 %.
    const curve = Array.from({ length: 21 }, (_, index) => {
      const share = index * 5;
      return { share, ...at(share) };
    });

    return { ...at(directShare), curve };
  }, [direct, retail, directShare, settings, totalExpenses]);

  if (!result) return null;

  const directBooks = Math.round(((result.books ?? 0) * directShare) / 100);
  const retailBooks = (result.books ?? 0) - directBooks;

  return (
    <div className="border-border flex flex-col gap-5 rounded-xl border p-5">
      <div className="flex flex-col gap-1">
        <h3 className="font-semibold">Hva om miksen blir slik?</h3>
        <p className="text-muted-foreground text-sm">
          Dra i slideren for å se hvor mange bøker som må selges for å dekke de{" "}
          {kr(totalExpenses)} i utgifter.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">Direkte</span>
          <Select value={directKey} onValueChange={setDirectKey}>
            <SelectTrigger className="w-50" aria-label="Direkte kanal">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {channels.map((channel) => (
                <SelectItem key={channel.key} value={channel.key}>
                  {channel.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">Gjennom forhandler</span>
          <Select value={retailKey} onValueChange={setRetailKey}>
            <SelectTrigger className="w-50" aria-label="Forhandlerkanal">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {channels.map((channel) => (
                <SelectItem key={channel.key} value={channel.key}>
                  {channel.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-4 text-sm">
          <span>
            <strong>{directShare} %</strong> {direct?.label}
          </span>
          <span>
            <strong>{100 - directShare} %</strong> {retail?.label}
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={directShare}
          onChange={(event) => setDirectShare(Number(event.target.value))}
          className="accent-primary w-full"
          aria-label={`Andel solgt via ${direct?.label}`}
        />
      </div>

      <div className="bg-muted/50 flex flex-wrap items-baseline justify-between gap-4 rounded-lg p-4">
        <p className="font-display text-3xl font-bold tabular-nums">
          {result.books === null ? "–" : antall(result.books)}{" "}
          <span className="text-muted-foreground text-base font-normal">
            bøker for å gå i null
          </span>
        </p>
        <p className="text-muted-foreground text-sm">
          {kr(result.net, 2)} per bok i snitt
          {result.books !== null && (
            <>
              {" "}
              · {antall(directBooks)} via {direct?.label} og{" "}
              {antall(retailBooks)} via {retail?.label}
            </>
          )}
        </p>
      </div>

      <ChartContainer config={config} className="h-50 w-full">
        <LineChart data={result.curve} accessibilityLayer>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="share"
            type="number"
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            tickFormatter={(value: number) => `${value} %`}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={44}
            tickFormatter={(value: number) => antall(value)}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                labelFormatter={(_label, payload) =>
                  `${payload[0]?.payload?.share ?? 0} % via ${direct?.label}`
                }
              />
            }
          />
          <Line
            dataKey="books"
            type="monotone"
            stroke="var(--color-books)"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
          <ReferenceLine
            x={directShare}
            stroke={ESTIMATE}
            strokeDasharray="4 3"
            strokeWidth={1.5}
          />
          {result.books !== null && (
            <ReferenceDot
              x={directShare}
              y={result.books}
              r={5}
              fill={ESTIMATE}
              stroke="#ffffff"
              strokeWidth={2}
            />
          )}
        </LineChart>
      </ChartContainer>
      <p className="text-muted-foreground -mt-3 text-xs">
        Vannrett: andel solgt via {direct?.label}. Loddrett: bøker som må selges
        til sammen.
      </p>
    </div>
  );
}
