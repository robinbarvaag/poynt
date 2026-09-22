import type { RecentEvent } from "@/lib/boksalg/dashboard";
import {
  Badge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@poynt/ui";

/**
 * Endringsloggen: hva som faktisk har skjedd ute i butikkene, nyeste først.
 * Dette er dokumentasjonen — en butikk som selger tre bøker på en tirsdag skal
 * fortsatt være synlig et halvår senere.
 */

const TYPE_LABEL: Record<string, string> = {
  sale: "Solgt",
  restock: "Påfyll",
  listed: "Kom i butikk",
  delisted: "Ute av lista",
  sold_out: "Utsolgt",
  availability: "Statusendring",
};

const TYPE_VARIANT: Record<
  string,
  "default" | "soft-primary" | "soft-saffron" | "muted" | "outline"
> = {
  sale: "default",
  restock: "soft-saffron",
  listed: "soft-primary",
  delisted: "muted",
  sold_out: "outline",
  availability: "outline",
};

const SOURCE_LABEL: Record<string, string> = { norli: "Norli", ark: "ARK" };

function formatMoment(value: string): string {
  return new Date(value).toLocaleString("nb-NO", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function EventLog({ events }: { events: RecentEvent[] }) {
  if (events.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        Ingen endringer registrert ennå. Hver morgen sammenlignes butikkenes
        lager med gårsdagens, og alt som har flyttet på seg havner her.
      </p>
    );
  }

  return (
    <div className="border-border overflow-hidden rounded-xl border">
      <Table>
        <TableHeader className="bg-muted/60">
          <TableRow className="hover:bg-transparent">
            <TableHead>Når</TableHead>
            <TableHead>Hva</TableHead>
            <TableHead>Butikk</TableHead>
            <TableHead className="text-right">Før → etter</TableHead>
            <TableHead>Merknad</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.map((event) => (
            <TableRow key={event.id}>
              <TableCell className="text-muted-foreground">
                {formatMoment(event.occurredAt)}
              </TableCell>
              <TableCell>
                <Badge
                  variant={TYPE_VARIANT[event.type] ?? "outline"}
                  size="sm"
                >
                  {TYPE_LABEL[event.type] ?? event.type}
                  {event.delta > 0 ? ` ${event.delta}` : ""}
                </Badge>
              </TableCell>
              <TableCell>
                <span className="font-medium">
                  {event.storeName ??
                    SOURCE_LABEL[event.sourceKey] ??
                    event.sourceKey}
                </span>
                {event.city && (
                  <span className="text-muted-foreground"> · {event.city}</span>
                )}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {event.fromQty !== null && event.toQty !== null
                  ? `${event.fromQty} → ${event.toQty}`
                  : "–"}
              </TableCell>
              <TableCell className="text-muted-foreground max-w-70 truncate">
                {event.note ?? ""}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
