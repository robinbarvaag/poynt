import type { PresaleSummary } from "@/lib/boksalg/dashboard";
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  cn,
} from "@poynt/ui";
import { EXACT } from "./chart-tokens";
import { antall, dato, kr } from "./format";

/**
 * «Forhåndssalg via Norli»: det aktive løpet fram til lansering. Viser hvor
 * mange som har bestilt via Norlis lenke, hvilket kickback-trinn det gir,
 * hvor lenge avtalen varer, og hvor mange bøker som skal signeres i butikk.
 *
 * Tallene kommer ferdig regnet fra dashboard.ts (kickback() i economy.ts) —
 * her er det bare visning. Ingen interaksjon, så dette er en serverkomponent.
 */
export function PresaleCard({
  presale,
  purchasedCopies,
}: {
  presale: PresaleSummary;
  /** Bokhandelens ordinære innkjøp — det forhåndssalget kommer oppå. */
  purchasedCopies: number;
}) {
  const { kickback, terms, marketingPackage } = presale;
  const tiers = terms.kickbackTiers;
  const scale = Math.max(
    ...tiers.map((tier) => tier.copies),
    marketingPackage?.at ?? 0,
    presale.kickbackCopies,
    1
  );
  const progress = Math.min(100, (presale.kickbackCopies / scale) * 100);
  const toSign = presale.signedCopies + presale.personallySignedCopies;
  const deadlinePassed = presale.daysLeft !== null && presale.daysLeft < 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle>Forhåndssalg via {presale.channelLabel}</CardTitle>
          {kickback.tier ? (
            <Badge variant="default">{kickback.percent} % kickback nådd</Badge>
          ) : (
            <Badge variant="soft-saffron">Ingen kickback ennå</Badge>
          )}
        </div>
        <CardDescription>
          Bøker kundene bestiller via{" "}
          {presale.link ? (
            <a
              href={presale.link}
              target="_blank"
              rel="noreferrer"
              className="hover:text-foreground underline"
            >
              {presale.link.replace(/^https?:\/\//, "")}
            </a>
          ) : (
            "forhåndssalgslenka"
          )}{" "}
          kommer <strong>i tillegg</strong> til de {antall(purchasedCopies)}{" "}
          {presale.channelLabel} kjøpte inn, kan ikke returneres, og{" "}
          {presale.channelLabel} tar {terms.retailerPercent} % i stedet for
          bokhandelens vanlige andel — {kr(presale.unit.net, 2)} til Susanne per
          bok. Over {antall(tiers[0]?.copies ?? 0)} bøker kommer kickback på
          fullpris i tillegg.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {/* ---- Nøkkeltall --------------------------------------------- */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            label="Forhåndssalg"
            value={antall(presale.kickbackCopies)}
            hint={
              presale.copiesAfterDeadline > 0
                ? `+ ${antall(presale.copiesAfterDeadline)} etter fristen`
                : `oppå de ${antall(purchasedCopies)} innkjøpte`
            }
          />
          <Stat
            label="Kickback"
            value={kickback.amount > 0 ? kr(kickback.amount) : "0 kr"}
            hint={
              kickback.tier
                ? `${kickback.percent} % av fullpris på alle ${antall(
                    kickback.copies
                  )}`
                : kickback.next
                  ? `${antall(kickback.next.copiesToGo)} bøker til ${kickback.next.percent} %`
                  : "ingen trapp satt opp"
            }
            tone={kickback.amount > 0 ? "good" : "neutral"}
          />
          <Stat
            label="Til signering"
            value={antall(toSign)}
            hint={
              toSign > 0
                ? `${antall(presale.signedCopies)} signert · ${antall(
                    presale.personallySignedCopies
                  )} personlig`
                : "ingen ført som signert ennå"
            }
          />
          <Stat
            label={deadlinePassed ? "Fristen gikk ut" : "Kickback teller til"}
            value={
              presale.daysLeft === null
                ? "Ingen frist"
                : deadlinePassed
                  ? dato(terms.kickbackUntil)
                  : presale.daysLeft === 0
                    ? "I dag"
                    : `${antall(presale.daysLeft)} ${
                        presale.daysLeft === 1 ? "dag" : "dager"
                      }`
            }
            hint={
              presale.daysLeft !== null && !deadlinePassed
                ? `til og med ${dato(terms.kickbackUntil)}`
                : undefined
            }
          />
        </div>

        {/* ---- Trappa ------------------------------------------------- */}
        {tiers.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-sm">
              {kickback.next ? (
                <>
                  <strong className="tabular-nums">
                    {antall(kickback.next.copiesToGo)} bøker
                  </strong>{" "}
                  igjen til {kickback.next.percent} % — da blir kickbacken{" "}
                  <strong className="tabular-nums">
                    {kr(
                      kickback.next.copies *
                        presale.unit.listPrice *
                        (kickback.next.percent / 100)
                    )}
                  </strong>{" "}
                  på {antall(kickback.next.copies)} bøker.
                </>
              ) : (
                <>Øverste trinn nådd — {kickback.percent} % på alt.</>
              )}
            </p>
            <div className="relative pt-1 pb-6">
              <div
                className="bg-muted h-3 w-full overflow-hidden rounded-full"
                aria-hidden
              >
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${progress}%`, background: EXACT }}
                />
              </div>
              {tiers.map((tier) => {
                const left = Math.min(100, (tier.copies / scale) * 100);
                const reached = presale.kickbackCopies >= tier.copies;
                return (
                  <div
                    key={tier.copies}
                    className="absolute top-0 flex -translate-x-1/2 flex-col items-center"
                    style={{ left: `${left}%` }}
                  >
                    <span
                      className={cn(
                        "border-background h-5 w-1 rounded-full border",
                        reached ? "bg-primary" : "bg-border"
                      )}
                      aria-hidden
                    />
                    <span
                      className={cn(
                        "mt-1 text-xs whitespace-nowrap tabular-nums",
                        reached
                          ? "text-foreground font-medium"
                          : "text-muted-foreground"
                      )}
                    >
                      {antall(tier.copies)} · {tier.percent} %
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="sr-only">
              {antall(presale.kickbackCopies)} forhåndssalg av {antall(scale)}{" "}
              på trappa.
            </p>
          </div>
        )}

        {/* ---- Markedspakke ------------------------------------------- */}
        {marketingPackage && (
          <div
            className={cn(
              "rounded-xl border p-4",
              marketingPackage.reached
                ? "border-primary/30 bg-primary/5"
                : "border-border"
            )}
          >
            <p className="font-semibold">
              {marketingPackage.reached
                ? `Markedspakka er utløst — over ${antall(marketingPackage.at)} forhåndssalg`
                : `${antall(marketingPackage.copiesToGo)} bøker igjen til markedspakka (${antall(marketingPackage.at)})`}
            </p>
            <p className="text-muted-foreground mt-1 text-sm">
              Plakat i butikkene (verdi 17 000 kr, husk et høyoppløst bilde du
              har alle rettigheter til), eget vindu i Norli Universitetsgata i
              minst ei uke, Meta-annonser med Norli som avsender, forsida på
              norli.no og plass i nyhetsbrevet.
            </p>
          </div>
        )}

        {/* ---- Verdt å vite ------------------------------------------- */}
        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <Note title="Kickbacken avregnes etterpå">
            Norli regner den ut etter forhåndssalget og trekker fra salg som kom
            via betalte kanaler (f.eks. Google-annonser). Tallet her er derfor
            et øvre anslag — fakturainfo kommer på e-post.
          </Note>
          <Note title="Festen teller ikke i kickbacken">
            Bøker som kjøpes på lanseringsfesten og resten av lanseringsuka
            teller på bestselgerlista, men ikke i kickback-avtalen. Få flest
            mulig til å bestille i forkant.
          </Note>
          <Note title="Bare signerte bøker blir med på festen">
            Kun eksemplarer bestilt som «signert» eller «personlig signert»
            bestilles inn til signering i butikk, og bare de kan tas med. Ta med
            gjestelista når du signerer, så riktig bok går til riktig person.
          </Note>
          <Note title="Noen får boka i posten i stedet">
            De som glemte å velge signert, eller bestilte rett før festen, får
            boka hjem om få dager. Vil de ikke vente, kan de kjøpe et ekstra
            eksemplar på festen.
          </Note>
        </div>

        {presale.rowsWithoutSigning > 0 && (
          <p className="border-border bg-accent/40 rounded-xl border p-3 text-sm">
            {presale.rowsWithoutSigning === 1
              ? "Én forhåndssalg-rad"
              : `${antall(presale.rowsWithoutSigning)} forhåndssalg-rader`}{" "}
            mangler tall for signert og personlig signert, så «til signering»
            kan være for lavt. Fyll det inn under Boksalg.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function Stat({
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
    <div className="bg-muted/50 flex flex-col gap-1 rounded-xl p-4">
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
    </div>
  );
}

function Note({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-border rounded-xl border p-4">
      <p className="font-medium">{title}</p>
      <p className="text-muted-foreground mt-1">{children}</p>
    </div>
  );
}
