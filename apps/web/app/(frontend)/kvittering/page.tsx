import { ClearCart } from "@/components/clear-cart";
import { NewsletterOptIn } from "@/components/newsletter-opt-in";
import { getVippsPayment } from "@/lib/vipps";
import config from "@/payload.config";
import { stripe } from "@poynt/stripe";
import {
  Button,
  Eyebrow,
  FloatingShapes,
  GridPattern,
  Heading,
  Text,
} from "@poynt/ui";
import { Check, Clock, X } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getPayload } from "payload";

interface Props {
  searchParams: Promise<{ session_id?: string; ref?: string }>;
}

export const metadata = {
  title: "Kvittering",
  robots: { index: false, follow: false },
};

// Kvitteringen er toppunktet av kjøpsreisen — her brukes delight-budsjettet:
// ikonet popper inn (animate-success-pop), og tekstlinjene følger i en rolig
// trapp. Alt er ren CSS (motion-safe + fill-mode-both), så siden forblir en
// server-komponent og respekterer redusert bevegelse.
const STEP =
  "motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:animate-in motion-safe:fill-mode-both motion-safe:duration-500 motion-safe:ease-soft";

/** «robinbarvaag@gmail.com» → «r•••g@gmail.com» — adressen skal ikke vises i klartekst. */
function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain || local.length <= 2) return `•••@${domain ?? ""}`;
  return `${local[0]}•••${local[local.length - 1]}@${domain}`;
}

type ReceiptState = "paid" | "aborted" | "pending";

export default async function ReceiptPage({ searchParams }: Props) {
  // Stripe sender session_id, Vipps sender ref. Begge VERIFISERES før vi
  // feirer — uten gyldig referanse finnes det ingen kvittering å vise, og da
  // omdirigeres det til forsiden (en blind /kvittering-visning skal aldri vise
  // suksess eller tømme handlekurven). Innholdet redigeres i admin.
  const { session_id: sessionId, ref } = await searchParams;
  const reference = sessionId ?? ref;

  await connection();

  if (!reference) {
    redirect("/");
  }

  const payload = await getPayload({ config });

  let state: ReceiptState = "pending";
  if (sessionId) {
    // Stripe: slå opp sesjonen og sjekk at den faktisk er betalt. En ugyldig
    // eller påfunnet session_id skal ikke gi en suksess-side.
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      state =
        session.payment_status === "paid" ||
        session.payment_status === "no_payment_required"
          ? "paid"
          : "pending";
    } catch (error) {
      console.error("Kvittering: ugyldig Stripe-session", error);
      redirect("/");
    }
  } else if (ref) {
    // Vipps: ordren i Payload er kilden til sannhet (webhooken setter status).
    // Er webhooken ikke ferdig ennå, spør vi Vipps direkte — og feiler vi der,
    // viser vi «behandles» i stedet for å feire i blinde.
    const orders = await payload.find({
      collection: "orders",
      where: { vippsReference: { equals: ref } },
      limit: 1,
      depth: 0,
    });
    const order = orders.docs[0];
    if (!order) {
      redirect("/");
    }

    if (order.status === "paid") {
      state = "paid";
    } else if (order.status === "cancelled") {
      state = "aborted";
    } else {
      try {
        const payment = await getVippsPayment(ref);
        if (payment.state === "AUTHORIZED") {
          state = "paid";
        } else if (
          payment.state === "ABORTED" ||
          payment.state === "EXPIRED" ||
          payment.state === "TERMINATED"
        ) {
          state = "aborted";
        }
      } catch (error) {
        console.error("Kvittering: klarte ikke hente Vipps-betaling", error);
      }
    }
  }

  const aborted = state === "aborted";
  const settings = await payload
    .findGlobal({ slug: "checkout-settings" })
    .catch(() => null);

  // Vipps-hurtigkassen har ingen samtykke-checkbox i handlekurven — tilby
  // nyhetsbrev-påmelding her i stedet, hvis ordren ikke allerede har samtykke.
  let newsletterPrompt: { reference: string; maskedEmail: string } | null =
    null;
  if (ref && state === "paid") {
    const orders = await payload.find({
      collection: "orders",
      where: { vippsReference: { equals: ref } },
      limit: 1,
      depth: 0,
    });
    const order = orders.docs[0];
    if (order && !order.newsletterOptIn) {
      newsletterPrompt = {
        reference: ref,
        maskedEmail: order.customerEmail
          ? maskEmail(order.customerEmail)
          : "e-posten din fra Vipps",
      };
    }
  }

  const content =
    state === "aborted"
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
      : state === "pending"
        ? {
            eyebrow: "Behandles",
            title: "Betalingen bekreftes",
            text: "Vi venter på endelig bekreftelse fra betalingsleverandøren. Du får ordrebekreftelsen på e-post straks alt er i boks — det tar vanligvis under et minutt.",
            primaryLabel: "Til forsiden",
            primaryUrl: "/",
            secondaryLabel: "Kontakt oss",
            secondaryUrl: "/kontakt",
          }
        : {
            eyebrow: settings?.successEyebrow || "Bekreftet",
            title: settings?.successTitle || "Takk for kjøpet!",
            text:
              settings?.successText ||
              "Ordren din er bekreftet, og en ordrebekreftelse er på vei til innboksen din.",
            primaryLabel:
              settings?.successPrimaryCtaLabel || "Se flere produkter",
            primaryUrl: settings?.successPrimaryCtaUrl || "/produkter",
            secondaryLabel:
              settings?.successSecondaryCtaLabel || "Til forsiden",
            secondaryUrl: settings?.successSecondaryCtaUrl || "/",
          };

  return (
    <div className="flex min-h-[75vh] items-center justify-center px-4 py-16">
      {state === "paid" && <ClearCart />}
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
              ) : state === "pending" ? (
                <Clock className="size-9" strokeWidth={2.5} />
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

          {newsletterPrompt && (
            <div className={`${STEP} motion-safe:delay-500`}>
              <NewsletterOptIn
                reference={newsletterPrompt.reference}
                maskedEmail={newsletterPrompt.maskedEmail}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Kvitteringen nås via redirect fra Stripe/Vipps (aldri Link-navigasjon) og
// leser searchParams per forespørsel — server-bundet navigasjon er greit her.
export const instant = false;
