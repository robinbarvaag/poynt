"use client";

import {
  EventTicket,
  type EventTicketProps,
  type EventTicketStatus,
} from "@poynt/ui";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const POLL_MS = 5000;
/** Sjekk bare rundt eventet — ingen grunn til å spørre serveren uker før. */
const WINDOW_BEFORE_MS = 48 * 60 * 60 * 1000;
const WINDOW_AFTER_MS = 6 * 60 * 60 * 1000;
/** Etter animasjonen hentes siden på nytt (tekst og knapper under billetten). */
const REFRESH_AFTER_MS = 2600;

interface LiveTicketProps extends Omit<EventTicketProps, "celebrate"> {
  token: string;
  startsAt: string;
  endsAt?: string | null;
}

/**
 * Billetten på billettsiden. Står siden åpen når personen blir skannet i
 * døra, rives billetten av der og da (spørsmål til serveren hvert 5. sekund,
 * bare mens siden er synlig og eventet er nær).
 */
export function LiveTicket({
  token,
  startsAt,
  endsAt,
  ...ticket
}: LiveTicketProps) {
  const router = useRouter();
  const [status, setStatus] = useState<EventTicketStatus>(ticket.status);
  const [celebrate, setCelebrate] = useState(false);

  useEffect(() => {
    setStatus(ticket.status);
  }, [ticket.status]);

  useEffect(() => {
    if (status !== "registered") return;
    const start = new Date(startsAt).getTime();
    const end = endsAt ? new Date(endsAt).getTime() : start + 4 * 3600_000;
    const now = Date.now();
    if (now < start - WINDOW_BEFORE_MS || now > end + WINDOW_AFTER_MS) return;

    let stopped = false;
    const check = async () => {
      if (document.visibilityState !== "visible") return;
      const res = await fetch(`/api/eventer/billett/${token}/status`, {
        cache: "no-store",
      }).catch(() => null);
      if (!res?.ok || stopped) return;
      const json = (await res.json()) as { status?: EventTicketStatus };
      if (json.status !== "checked_in") return;
      stopped = true;
      setCelebrate(true);
      setStatus("checked_in");
      navigator.vibrate?.([30, 50, 80]);
      setTimeout(() => router.refresh(), REFRESH_AFTER_MS);
    };

    const timer = setInterval(check, POLL_MS);
    document.addEventListener("visibilitychange", check);
    return () => {
      stopped = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", check);
    };
  }, [status, startsAt, endsAt, token, router]);

  return <EventTicket {...ticket} status={status} celebrate={celebrate} />;
}
