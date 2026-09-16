import { CheckInScanner } from "@/components/events/check-in-scanner";
import config from "@/payload.config";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getPayload } from "payload";
import { Suspense } from "react";

interface CheckInPageProps {
  searchParams: Promise<{ event?: string }>;
}

/**
 * Innsjekk (/innsjekk): skann QR-koder eller tast inn koder i døra. Krever
 * innlogget Payload-bruker (samme innlogging som admin) — ellers sendes man
 * til innloggingen og tilbake hit. Viser eventer fra i går og framover, så
 * dagens event er valgt automatisk (eller det som står i ?event=).
 */
export default function CheckInPage({ searchParams }: CheckInPageProps) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <CheckInContent searchParams={searchParams} />
    </Suspense>
  );
}

async function CheckInContent({ searchParams }: CheckInPageProps) {
  // Innlogging og «fra i går»-vinduet er request-bundet — ikke prerender.
  await connection();
  const payload = await getPayload({ config });
  const { user } = await payload.auth({ headers: await headers() });
  const { event } = await searchParams;

  if (!user) {
    const back = event
      ? `/innsjekk?event=${encodeURIComponent(event)}`
      : "/innsjekk";
    redirect(`/admin/login?redirect=${encodeURIComponent(back)}`);
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { docs } = await payload.find({
    collection: "events",
    where: {
      startsAt: { greater_than_equal: since },
      registrationMode: { equals: "internal" },
    },
    sort: "startsAt",
    depth: 0,
    limit: 50,
  });

  const events = docs.map((e) => ({
    id: e.id,
    title: e.title,
    startsAt: e.startsAt,
  }));
  const requested = Number(event);
  const initialEventId = events.some((e) => e.id === requested)
    ? requested
    : (events[0]?.id ?? null);

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-6 px-4 py-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <p className="text-muted-foreground text-xs uppercase tracking-[0.14em]">
            Poynt
          </p>
          <h1 className="font-bold font-heading text-3xl text-foreground">
            Innsjekk
          </h1>
        </div>
        <a
          href={
            initialEventId
              ? `/admin/collections/events/${initialEventId}`
              : "/admin"
          }
          className="pb-1 text-muted-foreground text-sm underline-offset-4 hover:text-foreground hover:underline"
        >
          Til admin
        </a>
      </header>
      <CheckInScanner events={events} initialEventId={initialEventId} />
    </main>
  );
}
