import { ClearCart } from "@/components/clear-cart";
import { getVippsPayment } from "@/lib/vipps";
import config from "@/payload.config";
import {
  Button,
  Eyebrow,
  FloatingShapes,
  GridPattern,
  Heading,
  Text,
} from "@poynt/ui";
import { Check, X } from "lucide-react";
import Link from "next/link";
import { connection } from "next/server";
import { getPayload } from "payload";

interface Props {
  searchParams: Promise<{ session_id?: string; ref?: string }>;
}

// Kvitteringen er toppunktet av kjøpsreisen — her brukes delight-budsjettet:
// ikonet popper inn (animate-success-pop), og tekstlinjene følger i en rolig
// trapp. Alt er ren CSS (motion-safe + fill-mode-both), så siden forblir en
// server-komponent og respekterer redusert bevegelse.
const STEP =
  "motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:animate-in motion-safe:fill-mode-both motion-safe:duration-500 motion-safe:ease-soft";

export default async function ReceiptPage({ searchParams }: Props) {
  // Stripe sender session_id (kun ved fullført betaling). Vipps sender ref
  // uansett utfall — så for Vipps må vi sjekke betalingsstatusen før vi
  // feirer. Innholdet på siden redigeres i admin («Kasse og kvittering»).
  const { session_id: sessionId, ref } = await searchParams;
  const reference = sessionId ?? ref;

  await connection();

  let aborted = false;
  if (ref && !sessionId) {
    try {
      const payment = await getVippsPayment(ref);
      aborted = payment.state !== "AUTHORIZED";
    } catch (error) {
      // Klarer vi ikke slå opp betalingen, viser vi suksess — webhooken er
      // uansett kilden til sannhet for ordren.
      console.error("Kvittering: klarte ikke hente Vipps-betaling", error);
    }
  }

  const payload = await getPayload({ config });
  const settings = await payload
    .findGlobal({ slug: "checkout-settings" })
    .catch(() => null);

  const content = aborted
    ? {
        eyebrow: settings?.cancelledEyebrow || "Ikke fullført",
        title: settings?.cancelledTitle || "Betalingen ble avbrutt",
        text:
          settings?.cancelledText ||
          "Ingen penger er trukket, og handlekurven din er urørt. Du kan prøve igjen når du vil.",
        primaryLabel:
          settings?.cancelledPrimaryCtaLabel || "Tilbake til handlekurven",
        primaryUrl: settings?.cancelledPrimaryCtaUrl || "/handlekurv",
        secondaryLabel: settings?.cancelledSecondaryCtaLabel || "Kontakt oss",
        secondaryUrl: settings?.cancelledSecondaryCtaUrl || "/kontakt",
      }
    : {
        eyebrow: settings?.successEyebrow || "Bekreftet",
        title: settings?.successTitle || "Takk for kjøpet!",
        text:
          settings?.successText ||
          "Ordren din er bekreftet, og en ordrebekreftelse er på vei til innboksen din.",
        primaryLabel: settings?.successPrimaryCtaLabel || "Se flere produkter",
        primaryUrl: settings?.successPrimaryCtaUrl || "/produkter",
        secondaryLabel: settings?.successSecondaryCtaLabel || "Til forsiden",
        secondaryUrl: settings?.successSecondaryCtaUrl || "/",
      };

  return (
    <div className="flex min-h-[75vh] items-center justify-center px-4 py-16">
      {!aborted && <ClearCart />}
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-border bg-card px-6 py-16 text-center shadow-sm sm:px-12">
        <FloatingShapes variant={aborted ? "subtle" : "default"} />
        <GridPattern fade className="text-primary/10" />

        <div className="relative z-10">
          <div className="mb-6 flex justify-center">
            <span
              className={`animate-success-pop flex size-20 items-center justify-center rounded-full ${
                aborted
                  ? "bg-destructive/10 text-destructive"
                  : "bg-primary/10 text-primary"
              }`}
            >
              {aborted ? (
                <X className="size-9" strokeWidth={2.5} />
              ) : (
                <Check className="size-9" strokeWidth={2.5} />
              )}
            </span>
          </div>

          <div className={STEP}>
            <Eyebrow
              className={`mb-4 justify-center ${
                aborted ? "text-destructive" : "text-primary"
              }`}
            >
              {content.eyebrow}
            </Eyebrow>
            <Heading variant="h1" color="foreground" weight="bold">
              {content.title}
            </Heading>
          </div>

          <div className={`${STEP} motion-safe:delay-150`}>
            <Text variant="lead" customStyles="mx-auto mt-4 mb-8 max-w-lg">
              {content.text}
            </Text>
            {!aborted && reference && (
              <Text variant="muted" customStyles="mb-8 text-sm">
                Referanse: {reference}
              </Text>
            )}
          </div>

          <div
            className={`${STEP} flex flex-wrap justify-center gap-4 motion-safe:delay-300`}
          >
            <Link href={content.primaryUrl}>
              <Button size="lg">{content.primaryLabel}</Button>
            </Link>
            <Link href={content.secondaryUrl}>
              <Button size="lg" variant="outline">
                {content.secondaryLabel}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// Kvitteringen nås via redirect fra Stripe/Vipps (aldri Link-navigasjon) og
// leser searchParams per forespørsel — server-bundet navigasjon er greit her.
export const instant = false;
