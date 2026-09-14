import { AdminBar } from "@/components/admin-bar";
import { JsonLd } from "@/components/json-ld";
import { EventView } from "@/components/views/event-view";
import { spotsLeft } from "@/lib/events/capacity";
import { formatEventLocation } from "@/lib/events/format";
import { getEventSeatsTaken, getPublishedEvent } from "@/lib/events/public";
import { SITE_URL, buildMetadata, notFoundMetadata } from "@/lib/seo";
import {
  breadcrumbSchema,
  eventSchema,
  faqSchema,
} from "@/lib/structured-data";
import config from "@/payload.config";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPayload } from "payload";
import { Suspense } from "react";

interface EventPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: EventPageProps): Promise<Metadata> {
  const { slug } = await params;
  const event = await getPublishedEvent(slug);
  if (!event) return notFoundMetadata("Event ikke funnet");

  return buildMetadata({
    title: event.meta?.title || event.title,
    description: event.meta?.description || event.excerpt || "",
    path: `/eventer/${slug}`,
    image: event.meta?.image || event.heroImage,
    noIndex: event.meta?.noIndex ?? undefined,
    canonicalUrl: event.meta?.canonicalUrl,
  });
}

// Alt avhenger av `slug`, så params leses bak Suspense-grensa — da kan Next
// servere et umiddelbart skall (Instant Navigations) og strømme inn eventet.
export default function EventPage(props: EventPageProps) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-5xl animate-pulse space-y-6 px-4 py-12 sm:px-6 lg:px-8">
          <div className="h-6 w-32 rounded-full bg-muted" />
          <div className="h-12 w-4/5 rounded-2xl bg-muted" />
          <div className="h-5 w-2/3 rounded-full bg-muted" />
          <div className="aspect-video w-full rounded-3xl bg-muted" />
        </div>
      }
    >
      <EventPageContent {...props} />
    </Suspense>
  );
}

async function EventPageContent({ params }: EventPageProps) {
  const { slug } = await params;
  const event = await getPublishedEvent(slug);
  if (!event) notFound();

  const seatsTaken = await getEventSeatsTaken(event.id);
  const url = `${SITE_URL}/eventer/${slug}`;
  const mode = event.registrationMode ?? "internal";
  const left =
    mode === "internal" ? spotsLeft(event.capacity, seatsTaken) : null;

  const jsonLd = [
    eventSchema({
      name: event.title,
      description: event.excerpt,
      image: event.heroImage,
      url,
      startDate: event.startsAt,
      endDate: event.endsAt,
      status: event.eventStatus,
      location: {
        name: event.location?.name,
        address: event.location?.address || formatEventLocation(event.location),
        online: event.location?.online,
      },
      availability: mode === "none" ? null : left === 0 ? "SoldOut" : "InStock",
      validFrom: event.registrationOpensAt,
      offerUrl: mode === "external" ? event.externalUrl : `${url}#pamelding`,
    }),
    breadcrumbSchema([
      { name: "Hjem", url: SITE_URL },
      { name: "Eventer", url: `${SITE_URL}/eventer` },
      { name: event.title, url },
    ]),
    faqSchema(event.faq),
  ].filter((schema): schema is NonNullable<typeof schema> => schema !== null);

  return (
    <>
      <AdminBar collection="events" id={String(event.id)} singular="event" />
      <JsonLd data={jsonLd} />
      <EventView event={event} seatsTaken={seatsTaken} />
    </>
  );
}

export async function generateStaticParams() {
  const payload = await getPayload({ config });
  const events = await payload.find({
    collection: "events",
    where: { _status: { equals: "published" } },
    limit: 1000,
    depth: 0,
  });
  return events.docs.map((event) => ({ slug: event.slug }));
}
