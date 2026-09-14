"use client";

import {
  PAYMENT_PROVIDERS,
  type PaymentProvider,
  formatKr,
} from "@/lib/events/payment-rules";
import { Button, Text } from "@poynt/ui";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const POLL_MS = 3000;
/** Så lenge ventes det på bekreftelse før vi slutter å spørre. */
const POLL_FOR_MS = 2 * 60 * 1000;

const formatDeadline = (iso: string) =>
  new Date(iso).toLocaleString("nb-NO", {
    timeZone: "Europe/Oslo",
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

/**
 * Betaling på billettsiden, for en plass som er holdt av: betal med Vipps
 * eller kort, eller prøv igjen etter avbrutt betaling. Kommer personen
 * tilbake fra kassen, spør siden etter bekreftelse til billetten er klar.
 */
export function PayForTicket({
  token,
  amountKr,
  expiresAt,
  methods,
  returning,
  aborted,
}: {
  token: string;
  amountKr: number;
  expiresAt: string | null;
  methods: PaymentProvider[];
  /** Kom tilbake fra kassen — betalingen er trolig på vei. */
  returning: boolean;
  aborted: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<PaymentProvider | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [waiting, setWaiting] = useState(returning);

  useEffect(() => {
    if (!waiting) return;
    const started = Date.now();
    const timer = setInterval(async () => {
      if (Date.now() - started > POLL_FOR_MS) {
        setWaiting(false);
        return;
      }
      const res = await fetch(`/api/eventer/billett/${token}/status`, {
        cache: "no-store",
      }).catch(() => null);
      if (!res?.ok) return;
      const json = (await res.json()) as { status?: string };
      if (json.status && json.status !== "pending_payment") {
        clearInterval(timer);
        // Fjern ?betaling=… og vis billetten.
        router.replace(`/eventer/billett/${token}`);
        router.refresh();
      }
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [waiting, token, router]);

  const pay = async (provider: PaymentProvider) => {
    setBusy(provider);
    setError(null);
    try {
      const res = await fetch(`/api/eventer/billett/${token}/betaling`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });
      const json = await res.json();
      if (!res.ok || !json.url) {
        setError(json.error ?? "Kunne ikke starte betalingen. Prøv igjen.");
        setBusy(null);
        return;
      }
      document.location.href = json.url;
    } catch {
      setError("Fikk ikke kontakt. Sjekk nettet og prøv igjen.");
      setBusy(null);
    }
  };

  return (
    <div className="space-y-3 rounded-2xl bg-accent-1/40 p-4 text-left">
      {waiting ? (
        <div className="flex items-center gap-3">
          <Loader2
            className="size-5 shrink-0 animate-spin text-primary"
            aria-hidden
          />
          <output className="block text-foreground text-sm">
            Vi venter på bekreftelse av betalingen. Billetten dukker opp her om
            et øyeblikk.
          </output>
        </div>
      ) : (
        <>
          <p className="font-semibold text-foreground">
            Betal {formatKr(amountKr)} for å få billetten
          </p>
          {aborted && (
            <Text variant="muted" customStyles="text-sm">
              Betalingen ble avbrutt. Ingen penger er trukket, og du kan prøve
              igjen.
            </Text>
          )}
          {expiresAt && (
            <Text variant="muted" customStyles="text-sm">
              Plassen er holdt av til {formatDeadline(expiresAt)}. Etter det går
              den videre til noen andre.
            </Text>
          )}
          <div className="flex flex-wrap gap-2">
            {PAYMENT_PROVIDERS.filter((p) => methods.includes(p.value)).map(
              (provider) => (
                <Button
                  key={provider.value}
                  type="button"
                  variant={provider.value === "vipps" ? "default" : "outline"}
                  disabled={busy !== null}
                  onClick={() => pay(provider.value)}
                >
                  {busy === provider.value
                    ? "Åpner betaling…"
                    : `Betal med ${provider.label.toLowerCase()}`}
                </Button>
              )
            )}
          </div>
        </>
      )}
      {error && (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      )}
    </div>
  );
}
