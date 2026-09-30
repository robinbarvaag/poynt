import { EventLog } from "@/components/boksalg/event-log";
import {
  AVAILABILITY_TEXT,
  antall,
  dato,
  kr,
  tidspunkt,
} from "@/components/boksalg/format";
import { HorizontalBars } from "@/components/boksalg/horizontal-bars";
import { Milestones } from "@/components/boksalg/milestones";
import { MixSimulator } from "@/components/boksalg/mix-simulator";
import { PresaleCard } from "@/components/boksalg/presale-card";
import { RefreshButton } from "@/components/boksalg/refresh-button";
import { ReturnScenario } from "@/components/boksalg/return-scenario";
import { SalesChart } from "@/components/boksalg/sales-chart";
import { StockTabs } from "@/components/boksalg/stock-tabs";
import { StoresSection } from "@/components/boksalg/stores-section";
import { getBookDashboard } from "@/lib/boksalg/dashboard";
import config from "@/payload.config";
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
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getPayload } from "payload";
import { Suspense } from "react";

/**
 * Boksalg (/intern/boksalg): hvordan det går med «Verdifull vekst» — hvor mange
 * som er solgt, hva Susanne sitter igjen med, hvor langt det er igjen til
 * utgiftene er dekket, og hvilke butikker som har boka.
 *
 * Ligger utenfor Payload-admin fordi admin verken har Tailwind eller
 * @poynt/ui, men bak samme innlogging: uten Payload-sesjon sendes man til
 * innloggingen. Dataene er ikke for offentligheten.
 */

export const metadata = {
  title: "Boksalg | Poynt",
  robots: { index: false, follow: false },
};

export default function BookSalesPage() {
  return (
    <Suspense fallback={<div className="bg-background min-h-screen" />}>
      <BookSalesContent />
    </Suspense>
  );
}

async function BookSalesContent() {
  // Innlogging og ferske tall er request-bundet — ikke prerender.
  await connection();
  const payload = await getPayload({ config });
  const { user } = await payload.auth({ headers: await headers() });

  if (!user) {
    redirect(`/admin/login?redirect=${encodeURIComponent("/intern/boksalg")}`);
  }

  const data = await getBookDashboard(payload);
  const { book, coverage, totals, channels, expenses, stock, events } = data;
  const storesWithBook = data.stores.filter((s) => s.currentQty > 0).length;

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-10 sm:px-6 lg:px-8">
      {/* ---- Topp ---------------------------------------------------- */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-muted-foreground text-sm">
            <Link href="/admin" className="hover:text-foreground underline">
              Tilbake til admin
            </Link>
          </p>
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            {book.title}
          </h1>
          <p className="text-muted-foreground text-sm">
            ISBN {book.isbn} · {kr(book.listPrice)} ·{" "}
            {book.released
              ? `utgitt ${dato(book.releaseDate)}`
              : `utgis ${dato(book.releaseDate)}`}
          </p>
        </div>
        <RefreshButton />
      </header>

      {/* ---- Advarsler ----------------------------------------------- */}
      {data.warnings.length > 0 && (
        <div className="border-border bg-accent/40 flex flex-col gap-2 rounded-xl border p-4">
          {data.warnings.map((warning) => (
            <p key={warning} className="text-sm">
              {warning}
            </p>
          ))}
        </div>
      )}

      {/* ---- Nedtelling før utgivelse -------------------------------- */}
      {!book.released && book.daysUntilRelease !== null && (
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-4 py-6">
            <div>
              <p className="font-display text-4xl font-bold">
                {book.daysUntilRelease}{" "}
                <span className="text-muted-foreground text-xl font-normal">
                  {book.daysUntilRelease === 1 ? "dag" : "dager"} til utgivelse
                </span>
              </p>
              <p className="text-muted-foreground mt-1 text-sm">
                Tomme butikkhyller er forventet fram til{" "}
                {dato(book.releaseDate)}. Sporingen er i gang nå, så hele
                utrullingen blir dokumentert fra første eksemplar — og
                butikklista under er klar til å ringes.
              </p>
            </div>
            <div className="flex gap-2">
              {stock.map((entry) => (
                <Badge
                  key={entry.sourceKey}
                  variant={
                    entry.online === "in_stock" ? "default" : "soft-saffron"
                  }
                >
                  {entry.label}: {AVAILABILITY_TEXT[entry.online] ?? "–"}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ---- Forhåndssalg via bokhandelens program (Norli) ----------- */}
      {data.presales.map((presale) => (
        <PresaleCard
          key={presale.channelKey}
          presale={presale}
          purchasedCopies={
            channels
              .find((channel) => channel.key === presale.channelKey)
              ?.bySource.find((part) => part.source === "innkjop")?.copies ?? 0
          }
        />
      ))}

      {/* ---- Returscenario + nøkkeltall + veien til null ------------- */}
      {/* Slideren øverst styrer alle tallene i denne seksjonen. */}
      <ReturnScenario
        settings={data.settings}
        channels={channels.map((channel) => channel.rates)}
        returnable={data.returnable}
        earned={totals}
        coverage={coverage}
        totalExpenses={expenses.total}
        printRun={book.printRun}
      />

      {/* ---- Milepæler ----------------------------------------------- */}
      <Card>
        <CardHeader>
          <CardTitle>Milepæler</CardTitle>
          <CardDescription>
            Små seire underveis — og hva som er neste.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Milestones items={data.milestones} />
        </CardContent>
      </Card>

      {/* ---- Solgt inn over tid -------------------------------------- */}
      <Card>
        <CardHeader>
          <CardTitle>Solgt inn per dag</CardTitle>
          <CardDescription>
            Bøker du har fått betalt for: bokhandlernes innkjøp, avregninger fra
            distributøren, foredragssalg og bestillinger i nettbutikken.{" "}
            <Link
              href="/admin/collections/book-sales/create"
              className="hover:text-foreground underline"
            >
              Legg inn et salg
            </Link>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SalesChart
            points={data.timeline}
            emptyText="Ingen salg ført ennå. Har Norli eller ARK kjøpt inn et antall, legg det inn under Boksalg — det er da du får betalt."
          />
        </CardContent>
      </Card>

      {/* ---- Kanaler ------------------------------------------------- */}
      <Card>
        <CardHeader>
          <CardTitle>Hva hver kanal er verdt</CardTitle>
          <CardDescription>
            Samme bok, samme pris — men det Susanne sitter igjen med varierer
            kraftig. Redaktøren regner sin andel av{" "}
            {data.settings.editorBasis === "brutto"
              ? "utsalgsprisen"
              : "det som står igjen etter bokhandelen"}
            .
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <HorizontalBars
            rows={channels.flatMap((channel) => [
              {
                label: channel.label,
                value: channel.unit.net,
                display: kr(channel.unit.net, 2),
              },
              ...(channel.presale
                ? [
                    {
                      label: `${channel.label} forhåndssalg`,
                      value: channel.presale.unit.net,
                      display: kr(channel.presale.unit.net, 2),
                    },
                  ]
                : []),
            ])}
          />

          <div className="border-border overflow-hidden rounded-xl border">
            <Table>
              <TableHeader className="bg-muted/60">
                <TableRow className="hover:bg-transparent">
                  <TableHead>Kanal</TableHead>
                  <TableHead className="text-right">Pris</TableHead>
                  <TableHead className="text-right">Forhandler</TableHead>
                  <TableHead className="text-right">Redaktør</TableHead>
                  <TableHead className="text-right">
                    Distribusjon og gebyr
                  </TableHead>
                  <TableHead className="text-right">Til Susanne</TableHead>
                  <TableHead className="text-right">Break-even</TableHead>
                  <TableHead className="text-right">Solgt inn</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {channels.flatMap((channel) => [
                  <TableRow key={channel.key}>
                    <TableCell className="font-medium">
                      {channel.label}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {kr(channel.unit.listPrice)}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-right tabular-nums">
                      −{kr(channel.unit.retailerCut, 2)}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-right tabular-nums">
                      −{kr(channel.unit.editorCut, 2)}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-right tabular-nums">
                      −
                      {kr(
                        channel.unit.distributionCut +
                          channel.unit.transactionFee,
                        2
                      )}
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      {kr(channel.unit.net, 2)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {channel.breakEven.copiesNeeded !== null
                        ? `${antall(channel.breakEven.copiesNeeded)} bøker`
                        : "–"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {antall(channel.copies)}
                      {channel.bySource.length > 1 && (
                        <span className="text-muted-foreground block text-xs whitespace-nowrap">
                          {channel.bySource
                            .map(
                              (part) => `${antall(part.copies)} ${part.label}`
                            )
                            .join(" · ")}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>,
                  // Forhåndssalg via bokhandelens program: samme kanal, men
                  // egen sats (Norli 45 %) — vises som egen linje under.
                  ...(channel.presale
                    ? [
                        <TableRow
                          key={`${channel.key}-presale`}
                          className="bg-muted/30"
                        >
                          <TableCell className="text-muted-foreground pl-6 text-sm">
                            {channel.label} forhåndssalg (
                            {channel.presale.terms.retailerPercent} %)
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {kr(channel.presale.unit.listPrice)}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-right tabular-nums">
                            −{kr(channel.presale.unit.retailerCut, 2)}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-right tabular-nums">
                            −{kr(channel.presale.unit.editorCut, 2)}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-right tabular-nums">
                            −
                            {kr(
                              channel.presale.unit.distributionCut +
                                channel.presale.unit.transactionFee,
                              2
                            )}
                          </TableCell>
                          <TableCell className="text-right font-semibold tabular-nums">
                            {kr(channel.presale.unit.net, 2)}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-right text-xs">
                            + kickback
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {antall(channel.presale.copies)}
                          </TableCell>
                        </TableRow>,
                      ]
                    : []),
                ])}
              </TableBody>
            </Table>
          </div>

          <MixSimulator
            settings={data.settings}
            channels={channels.map((channel) => ({
              key: channel.key,
              label: channel.label,
              rates: channel.rates,
            }))}
            totalExpenses={expenses.total}
          />
        </CardContent>
      </Card>

      {/* ---- Ut av hyllene ------------------------------------------- */}
      <Card>
        <CardHeader>
          <CardTitle>Ut av hyllene</CardTitle>
          <CardDescription>
            <strong>{antall(data.sellThroughTotal)} bøker</strong> har forlatt
            en butikkhylle siden sporingen startet, utledet av at lageret gikk
            ned. Dette er <em>ikke</em> omsetning — de bøkene fikk du betalt for
            da bokhandelen kjøpte dem inn. Tallet sier hvor fort boka går, og
            dermed når det kommer en etterbestilling.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SalesChart
            points={data.sellThroughTimeline}
            variant="sellthrough"
            emptyText="Ingenting har flyttet seg i butikkhyllene ennå."
          />
        </CardContent>
      </Card>

      {/* ---- Ute i butikk -------------------------------------------- */}
      {stock.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Ute i butikk</CardTitle>
            <CardDescription>
              Eksemplarer i butikkhyllene dag for dag, kjede for kjede. Går
              linja ned uten at det kommer påfyll, er det på tide å ringe.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StockTabs stock={stock} />
          </CardContent>
        </Card>
      )}

      {/* ---- Butikker ------------------------------------------------ */}
      <Card>
        <CardHeader>
          <CardTitle>Butikkene</CardTitle>
          <CardDescription>
            {antall(data.stores.length)} butikker med kontaktinfo.{" "}
            {storesWithBook > 0
              ? `${antall(storesWithBook)} har boka nå.`
              : "Ingen har boka ennå — men lista er klar, så du kan begynne å ringe."}{" "}
            Klikk på kartet eller et fylke for å filtrere. «Til oppfølging»
            viser de som ikke har boka; velg dem og kopier e-postadressene til
            én samlet e-post.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StoresSection stores={data.stores} regions={data.regions} />
        </CardContent>
      </Card>

      {/* ---- Endringslogg -------------------------------------------- */}
      <Card>
        <CardHeader>
          <CardTitle>Hva har skjedd</CardTitle>
          <CardDescription>
            Hver morgen sammenlignes butikkenes lager med gårsdagens. Bare
            faktiske endringer havner her.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EventLog events={events} />
        </CardContent>
      </Card>

      {/* ---- Utgifter ------------------------------------------------ */}
      <Card>
        <CardHeader>
          <CardTitle>Utgifter</CardTitle>
          <CardDescription>
            Til sammen {kr(expenses.total)}.{" "}
            <Link
              href="/admin/collections/book-expenses"
              className="hover:text-foreground underline"
            >
              Rediger i admin
            </Link>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <HorizontalBars
            rows={expenses.groups.map((group) => ({
              label:
                group.count > 1
                  ? `${group.label} (${group.count})`
                  : group.label,
              value: group.amount,
              display: group.amount === 0 ? "beløp mangler" : kr(group.amount),
              muted: group.amount === 0,
            }))}
          />
        </CardContent>
      </Card>
    </main>
  );
}
