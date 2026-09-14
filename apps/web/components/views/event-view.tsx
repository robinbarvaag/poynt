import { RegistrationForm } from "@/components/events/registration-form";
import { MediaCredit } from "@/components/media-credit";
import { PayloadImage } from "@/components/payload-image";
import { RichText } from "@/components/rich-text";
import { spotsLeft } from "@/lib/events/capacity";
import {
  eventDateParts,
  formatEventDay,
  formatEventLocation,
  formatEventTime,
} from "@/lib/events/format";
import { NEWSLETTER_CONSENT_TEXTS } from "@/lib/newsletter-consent-texts";
import { resolveMedia } from "@/lib/payload";
import { detailBreadcrumbs } from "@/lib/ui-text";
import type { Event } from "@/payload-types";
import {
  Badge,
  Breadcrumbs,
  Button,
  Container,
  Countdown,
  EventDateBadge,
  type EventFact,
  EventFacts,
  EventProgram,
  Eyebrow,
  Heading,
  Panel,
  SpotsMeter,
  Text,
} from "@poynt/ui";

interface EventViewProps {
  event: Event;
  /** Plasser tatt (påmeldt + møtt). */
  seatsTaken: number;
}

/**
 * Selve eventsiden — delt mellom den statiske /eventer/[slug] og
 * /forhandsvisning/eventer/[slug]. Alt som avhenger av «nå» (er påmeldingen
 * åpen, har eventet vært) avgjøres i nettleseren, så siden kan være statisk.
 */
export function EventView({ event, seatsTaken }: EventViewProps) {
  const image = resolveMedia(event.heroImage);
  const { day, month } = eventDateParts(event.startsAt);
  const where = formatEventLocation(event.location);
  const mode = event.registrationMode ?? "internal";
  const left =
    mode === "internal" ? spotsLeft(event.capacity, seatsTaken) : null;
  const notScheduled = event.eventStatus && event.eventStatus !== "scheduled";

  const timeText = event.endsAt
    ? `${formatEventTime(event.startsAt)}–${formatEventTime(event.endsAt)}`
    : formatEventTime(event.startsAt);

  const facts: EventFact[] = [
    { icon: "calendar", label: "Dato", value: formatEventDay(event.startsAt) },
    {
      icon: "clock",
      label: "Tid",
      value: event.doorsOpenAt
        ? `${timeText} (dørene åpner ${formatEventTime(event.doorsOpenAt)})`
        : timeText,
    },
  ];
  if (where) {
    facts.push({
      icon: "map",
      label: "Sted",
      value: where,
      href: event.location?.mapUrl || undefined,
    });
  }
  facts.push({
    icon: "ticket",
    label: "Pris",
    value: mode === "external" ? "Se billettsiden" : "Gratis",
  });

  const program = (event.program ?? []).map((item) => ({
    time: item.time,
    title: item.title,
    description: item.description,
  }));
  const faq = (event.faq ?? []).filter((f) => f.question && f.answer);

  return (
    <>
      <Container size="lg" padding="default">
        <Breadcrumbs
          items={detailBreadcrumbs("eventer", event.title)}
          className="mb-8"
        />

        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              {notScheduled ? (
                <Badge variant="destructive">
                  {event.eventStatus === "cancelled" ? "Avlyst" : "Utsatt"}
                </Badge>
              ) : (
                <>
                  {mode !== "external" && <Badge variant="mint">Gratis</Badge>}
                  {left === 0 && (
                    <Badge variant="salmon">
                      {event.waitlistEnabled
                        ? "Fullt, venteliste åpen"
                        : "Fullt"}
                    </Badge>
                  )}
                </>
              )}
            </div>

            <div className="mt-5 flex items-start gap-5">
              <EventDateBadge
                day={day}
                month={month}
                size="lg"
                // Uten bilde viser bildeflaten allerede datoen.
                className={image?.url ? "hidden sm:flex" : "hidden"}
              />
              <Heading
                variant="h1"
                color="foreground"
                weight="bold"
                customStyles="text-balance"
              >
                {event.title}
              </Heading>
            </div>

            {event.excerpt && (
              <Text
                variant="lead"
                customStyles="mt-5 whitespace-pre-line text-pretty"
              >
                {event.excerpt}
              </Text>
            )}

            {!notScheduled && mode !== "none" && (
              <div className="mt-8 flex flex-wrap gap-3">
                {mode === "external" && event.externalUrl ? (
                  <Button asChild size="lg">
                    <a
                      href={event.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {event.externalLabel || "Kjøp billett"}
                    </a>
                  </Button>
                ) : (
                  <Button asChild size="lg">
                    <a href="#pamelding">
                      {left === 0 ? "Sett meg på ventelista" : "Meld meg på"}
                    </a>
                  </Button>
                )}
                <Button asChild size="lg" variant="outline">
                  <a href={`/api/eventer/${event.id}/kalender`}>
                    Legg i kalenderen
                  </a>
                </Button>
              </div>
            )}
          </div>

          <div className="relative">
            <div
              className="-rotate-2 absolute inset-0 translate-x-3 translate-y-3 rounded-[2.5rem] bg-accent-1"
              aria-hidden
            />
            <div className="relative aspect-[4/3] overflow-hidden rounded-[2.5rem] bg-accent-3 ring-1 ring-border">
              {image?.url ? (
                <>
                  <PayloadImage
                    media={image}
                    alt={image.alt || event.title}
                    fill
                    priority
                    className="object-cover"
                  />
                  <MediaCredit media={image} />
                </>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <EventDateBadge
                    day={day}
                    month={month}
                    size="lg"
                    className="scale-150"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <EventFacts items={facts} className="mt-12 lg:grid-cols-4" />
      </Container>

      <Container size="lg" padding="lg">
        <div className="grid gap-12 lg:grid-cols-[1fr_24rem] lg:gap-16">
          <div className="min-w-0 space-y-14">
            {event.description && (
              <section>
                <Heading variant="h2" customStyles="mb-6">
                  Om eventet
                </Heading>
                <div className="prose prose-lg max-w-none prose-headings:text-foreground prose-p:text-foreground prose-a:text-primary prose-strong:text-foreground">
                  <RichText data={event.description} />
                </div>
              </section>
            )}

            {program.length > 0 && (
              <section>
                <Heading variant="h2" customStyles="mb-8">
                  Program
                </Heading>
                <EventProgram items={program} />
              </section>
            )}

            {event.practicalInfo && (
              <section>
                <Heading variant="h2" customStyles="mb-6">
                  Praktisk info
                </Heading>
                <div className="prose max-w-none prose-p:text-foreground prose-a:text-primary prose-strong:text-foreground">
                  <RichText data={event.practicalInfo} />
                </div>
              </section>
            )}

            {faq.length > 0 && (
              <section>
                <Heading variant="h2" customStyles="mb-6">
                  Det folk lurer på
                </Heading>
                <div className="divide-y divide-border rounded-3xl ring-1 ring-border">
                  {faq.map((item) => (
                    <details key={item.question} className="group px-6 py-5">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-foreground">
                        {item.question}
                        <span
                          aria-hidden
                          className="text-primary text-xl transition-transform group-open:rotate-45"
                        >
                          +
                        </span>
                      </summary>
                      <p className="mt-3 text-muted-foreground leading-relaxed">
                        {item.answer}
                      </p>
                    </details>
                  ))}
                </div>
              </section>
            )}
          </div>

          <aside
            id="pamelding"
            className="scroll-mt-28 space-y-6 lg:sticky lg:top-28 lg:self-start"
          >
            {mode === "internal" && (
              <div className="rounded-3xl bg-card p-6 shadow-sm ring-1 ring-border md:p-8">
                <Heading variant="h3" customStyles="mb-2">
                  {left === 0 ? "Sett deg på ventelista" : "Meld deg på"}
                </Heading>
                <Text variant="muted" customStyles="mb-6">
                  {event.ticketsEnabled !== false
                    ? "Du får billett med QR-kode på e-post."
                    : "Du får en bekreftelse på e-post."}
                </Text>
                <SpotsMeter
                  capacity={event.capacity}
                  taken={seatsTaken}
                  waitlistEnabled={Boolean(event.waitlistEnabled)}
                  className="mb-6"
                />
                <RegistrationForm
                  eventId={event.id}
                  startsAt={event.startsAt}
                  registrationOpensAt={event.registrationOpensAt}
                  registrationClosesAt={event.registrationClosesAt}
                  eventStatus={event.eventStatus}
                  spotsLeft={left}
                  waitlistEnabled={Boolean(event.waitlistEnabled)}
                  ticketsEnabled={event.ticketsEnabled !== false}
                  newsletterOptIn={Boolean(event.newsletterOptIn)}
                  newsletterText={NEWSLETTER_CONSENT_TEXTS.event}
                  maxGuests={event.maxGuests ?? 0}
                  questions={(event.extraQuestions ?? []).flatMap((q) =>
                    q.name
                      ? [
                          {
                            name: q.name,
                            label: q.label,
                            type: q.type,
                            options: q.options,
                            required: q.required,
                          },
                        ]
                      : []
                  )}
                />
              </div>
            )}

            {!notScheduled && (
              <Panel surface="mint" className="p-6 md:p-7">
                <Eyebrow>Nedtelling</Eyebrow>
                <Countdown
                  target={event.startsAt}
                  doneLabel="Det er i dag!"
                  // Fire kolonner i den smale sidekolonnen, ellers havner
                  // «sek» alene på en ny linje.
                  className="mt-4 grid grid-cols-4 gap-2 sm:gap-2 [&>div]:min-w-0 [&>div]:px-1"
                />
              </Panel>
            )}
          </aside>
        </div>
      </Container>
    </>
  );
}
