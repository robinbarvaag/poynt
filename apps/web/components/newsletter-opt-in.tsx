"use client";

import { Button, Text } from "@poynt/ui";
import { Mail } from "lucide-react";
import { useState } from "react";

/**
 * Nyhetsbrev-påmelding på kvitteringssiden — for Vipps-hurtigkassen, som ikke
 * har samtykke-checkboxen fra handlekurven. Ett aktivt klikk = gyldig samtykke
 * (dokumenteres på ordren via API-et).
 */
export function NewsletterOptIn({
  reference,
  maskedEmail,
}: {
  reference: string;
  maskedEmail: string;
}) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">(
    "idle"
  );

  const subscribe = async () => {
    setState("loading");
    try {
      const res = await fetch("/api/newsletter/order-opt-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference }),
      });
      setState(res.ok ? "done" : "error");
    } catch {
      setState("error");
    }
  };

  if (state === "done") {
    return (
      <div className="mx-auto mt-8 max-w-md rounded-2xl border border-border bg-accent-3/20 px-6 py-5">
        <Text variant="muted" customStyles="text-sm">
          🎉 Du er påmeldt! Nyhetsbrevet kommer til {maskedEmail}.
        </Text>
      </div>
    );
  }

  return (
    <div className="mx-auto mt-8 max-w-md rounded-2xl border border-border bg-accent-3/20 px-6 py-5 text-left">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Mail className="size-4" />
        </span>
        <div>
          <Text customStyles="font-semibold text-sm">
            Vil du ha tips og tilbud fra Poynt?
          </Text>
          <Text variant="muted" customStyles="mt-1 text-sm">
            Meld deg på nyhetsbrevet ({maskedEmail}). Du kan melde deg av når
            som helst.
          </Text>
          <Button
            size="sm"
            className="mt-3"
            onClick={subscribe}
            disabled={state === "loading"}
          >
            {state === "loading" ? "Melder på..." : "Ja takk, meld meg på"}
          </Button>
          {state === "error" && (
            <Text variant="muted" customStyles="mt-2 text-destructive text-xs">
              Noe gikk galt — prøv igjen om et lite øyeblikk.
            </Text>
          )}
        </div>
      </div>
    </div>
  );
}
