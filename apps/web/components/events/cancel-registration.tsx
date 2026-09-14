"use client";

import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@poynt/ui";
import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * «Meld meg av» på billettsiden. Én bekreftelse i en dialog er nok — lenken
 * er personlig, så det trengs ingen ekstra e-post for å bekrefte.
 */
export function CancelRegistration({
  token,
  waitlisted,
  withGuests = false,
}: {
  token: string;
  waitlisted: boolean;
  /** Personen tok med noen — de meldes av samtidig. */
  withGuests?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cancel = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/eventer/billett/${token}/avmelding`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Noe gikk galt. Prøv igjen.");
        return;
      }
      setOpen(false);
      router.refresh();
    } catch {
      setError("Fikk ikke kontakt. Sjekk nettet og prøv igjen.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="w-full text-muted-foreground">
          {waitlisted
            ? withGuests
              ? "Meld oss av ventelista"
              : "Meld meg av ventelista"
            : withGuests
              ? "Vi kan ikke komme likevel"
              : "Jeg kan ikke komme likevel"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {waitlisted ? "Melde deg av ventelista?" : "Melde deg av?"}
          </DialogTitle>
          <DialogDescription>
            {waitlisted
              ? "Du mister plassen i køen. Du kan melde deg på igjen senere hvis det er plass."
              : "Plassen din går til noen andre, og billetten slutter å virke. Du kan melde deg på igjen senere hvis det fortsatt er plass."}
            {withGuests &&
              " De du tar med, meldes av samtidig, og billettene deres slutter også å virke."}
          </DialogDescription>
        </DialogHeader>
        {error && (
          <p role="alert" className="text-destructive text-sm">
            {error}
          </p>
        )}
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={busy}>
              Nei, behold plassen
            </Button>
          </DialogClose>
          <Button variant="destructive" onClick={cancel} disabled={busy}>
            {busy ? "Melder av…" : "Ja, meld meg av"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
