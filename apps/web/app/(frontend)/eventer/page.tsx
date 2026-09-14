import { AdminBar } from "@/components/admin-bar";
import { EventCard } from "@/components/events/event-card";
import { PageHero } from "@/components/page-hero";
import { buildMetadata } from "@/lib/seo";
import config from "@/payload.config";
import { Container, Heading, Text } from "@poynt/ui";
import type { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
import { getPayload } from "payload";

/**
 * Kommende og tidligere eventer. Skillet mellom «kommende» og «tidligere»
 * regnes ut i cachen og fornyes hver time, så et event glir over i
 * «tidligere» av seg selv uten at noen publiserer.
 */
async function getEventsPageData() {
  "use cache";
  cacheTag("cms");
  cacheLife("hours");

  const payload = await getPayload({ config });
  const { docs } = await payload.find({
    collection: "events",
    where: { _status: { equals: "published" } },
    sort: "startsAt",
    depth: 1,
    limit: 200,
  });

  const now = Date.now();
  const isOver = (e: (typeof docs)[number]) =>
    new Date(e.endsAt ?? e.startsAt).getTime() < now;

  return {
    upcoming: docs.filter((e) => !isOver(e)),
    past: docs.filter(isOver).reverse().slice(0, 12),
  };
}

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    title: "Eventer",
    description:
      "Lanseringer, foredrag og samlinger med Poynt. Se hva som skjer, og meld deg på.",
    path: "/eventer",
  });
}

export default async function EventsPage() {
  const { upcoming, past } = await getEventsPageData();

  return (
    <>
      <PageHero
        title="Eventer"
        description="Lanseringer, foredrag og samlinger. Kom som du er, gå hjem med noe du kan bruke."
        size="large"
      />

      <Container padding="default" className="py-8">
        {upcoming.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <Text variant="muted" customStyles="py-12 text-center">
            Ingen eventer akkurat nå. Meld deg på nyhetsbrevet, så får du høre
            om det neste.
          </Text>
        )}

        {past.length > 0 && (
          <section className="mt-20">
            <Heading variant="h2" customStyles="mb-8">
              Tidligere eventer
            </Heading>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {past.map((event) => (
                <EventCard key={event.id} event={event} past />
              ))}
            </div>
          </section>
        )}
      </Container>
    </>
  );
}
