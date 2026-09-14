import { DefaultTemplate } from "@payloadcms/next/templates";
import { Gutter, SetStepNav } from "@payloadcms/ui";
import { getVisibleEntities } from "@payloadcms/ui/shared";
import type { AdminViewServerProps } from "payload";
import { CheckInScanner } from "../../components/events/check-in-scanner";

/**
 * Innsjekk (/admin/innsjekk): skann QR-koder eller tast inn koder i døra.
 * Laget for mobil. Viser eventer som starter fra i går og framover, så
 * dagens event er valgt automatisk (eller det som står i ?event=).
 */
export const CheckInView = async (props: AdminViewServerProps) => {
  const { payload } = props;
  const visibleEntities = getVisibleEntities({ req: props.initPageResult.req });

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

  const requested = Number(
    (props.searchParams as Record<string, string | undefined> | undefined)
      ?.event
  );
  const events = docs.map((e) => ({
    id: e.id,
    title: e.title,
    startsAt: e.startsAt,
  }));
  const initialEventId = events.some((e) => e.id === requested)
    ? requested
    : (events[0]?.id ?? null);

  return (
    <DefaultTemplate
      i18n={props.i18n}
      payload={payload}
      permissions={props.initPageResult.permissions}
      visibleEntities={visibleEntities}
    >
      <SetStepNav nav={[{ label: "Innsjekk" }]} />
      <div style={{ width: "100%" }}>
        <Gutter>
          <div style={{ marginTop: "1.5rem", marginBottom: "0.5rem" }}>
            <h1 style={{ margin: 0 }}>Innsjekk</h1>
          </div>
          <p
            style={{
              marginBottom: "1.5rem",
              maxWidth: "60ch",
              color: "var(--theme-elevation-500)",
            }}
          >
            Skann QR-koden på billetten, eller skriv inn koden hvis kameraet
            ikke vil. Fungerer best på mobilen: åpne denne siden der og logg
            inn.
          </p>
          <CheckInScanner events={events} initialEventId={initialEventId} />
        </Gutter>
      </div>
    </DefaultTemplate>
  );
};
