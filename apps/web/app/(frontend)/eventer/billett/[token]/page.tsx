import { CancelRegistration } from "@/components/events/cancel-registration";
import { LiveTicket } from "@/components/events/live-ticket";
import { isTicketToken, ticketPath } from "@/lib/events/codes";
import {
  formatEventLocation,
  formatEventRange,
  formatEventTime,
} from "@/lib/events/format";
import { ticketQrSvg } from "@/lib/events/qr";
import { findRegistrationByToken } from "@/lib/events/registrations";
import { SITE_URL } from "@/lib/seo";
import { Button, Container, Text } from "@poynt/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Billetten din",
  robots: { index: false, follow: false },
};

interface TicketPageProps {
  params: Promise<{ token: string }>;
}

/**
 * Den personlige billettsiden. Lenken (og QR-koden) er nøkkelen: den som har
 * den, ser billetten og kan melde seg av. Alltid dynamisk og aldri indeksert.
 */
export default function TicketPage({ params }: TicketPageProps) {
  // Billetten er runtime-data (hemmelig nøkkel i URL-en, alltid fersk status)
  // — les den bak Suspense, samme mønster som /forhandsvisning.
  return (
    <Suspense fallback={<TicketSkeleton />}>
      <TicketContent params={params} />
    </Suspense>
  );
}

function TicketSkeleton() {
  return (
    <Container size="sm" padding="lg">
      <div className="mx-auto h-144 max-w-md animate-pulse rounded-4xl bg-muted" />
    </Container>
  );
}

async function TicketContent({ params }: TicketPageProps) {
  const { token } = await params;
  await connection();

  if (!isTicketToken(token)) notFound();
  const registration = await findRegistrationByToken(token);
  if (!registration) notFound();

  const { event } = registration;
  const url = `${SITE_URL}${ticketPath(token)}`;
  const withTicket = event.ticketsEnabled !== false;
  const qrSvg =
    withTicket && registration.status !== "cancelled"
      ? await ticketQrSvg(url)
      : null;

  const started = new Date(event.startsAt).getTime() <= Date.now();
  const canCancel =
    !started &&
    (registration.status === "registered" ||
      registration.status === "waitlisted");

  const where = formatEventLocation(event.location);

  return (
    <Container size="sm" padding="default">
      <div className="mx-auto max-w-md">
        <LiveTicket
          token={token}
          startsAt={event.startsAt}
          endsAt={event.endsAt}
          eventTitle={event.title}
          when={formatEventRange(event.startsAt, event.endsAt)}
          where={where || undefined}
          name={registration.name}
          code={withTicket ? registration.code : null}
          qrSvg={qrSvg}
          status={registration.status}
          waitlistPosition={registration.waitlistPosition}
        >
          {registration.status === "checked_in" && (
            <Text customStyles="font-semibold text-primary">
              Du er sjekket inn. God fornøyelse!
            </Text>
          )}
          {registration.status === "registered" && withTicket && (
            <Text variant="muted" customStyles="text-sm">
              Vis QR-koden i døra, eller si koden.
              {event.doorsOpenAt
                ? ` Dørene åpner kl. ${formatEventTime(event.doorsOpenAt)}.`
                : ""}
            </Text>
          )}
          {registration.status === "cancelled" && (
            <Text variant="muted" customStyles="text-sm">
              Denne påmeldingen er meldt av. Vil du likevel komme? Meld deg på
              igjen, så lenge det er plass.
            </Text>
          )}

          <div className="flex flex-wrap justify-center gap-2">
            {registration.status !== "cancelled" && !started && (
              <Button asChild variant="outline">
                <a href={`/api/eventer/${event.id}/kalender`}>
                  Legg i kalenderen
                </a>
              </Button>
            )}
            {event.location?.mapUrl && registration.status !== "cancelled" && (
              <Button asChild variant="outline">
                <a
                  href={event.location.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Vis kart
                </a>
              </Button>
            )}
            <Button
              asChild
              variant={
                registration.status === "cancelled" ? "default" : "ghost"
              }
            >
              <Link href={`/eventer/${event.slug}`}>Se eventet</Link>
            </Button>
          </div>

          {canCancel && (
            <CancelRegistration
              token={token}
              waitlisted={registration.status === "waitlisted"}
            />
          )}
        </LiveTicket>

        <Text variant="muted" customStyles="mt-6 text-center text-xs">
          Tips: legg til denne siden på hjemskjermen, så har du billetten klar i
          døra. Ikke del lenken, den er personlig.
        </Text>
      </div>
    </Container>
  );
}
