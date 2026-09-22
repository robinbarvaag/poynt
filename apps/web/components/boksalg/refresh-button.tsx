"use client";

import { refreshStockAction } from "@/app/(intern)/intern/boksalg/actions";
import { Button } from "@poynt/ui";
import { useState, useTransition } from "react";

/** Henter lagerstatus på nytt uten å vente på morgendagens cron-kjøring. */
export function RefreshButton() {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(
    null
  );

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setResult(null);
            setResult(await refreshStockAction());
          })
        }
      >
        {pending ? "Henter…" : "Hent nå"}
      </Button>
      {/* <output> har implisitt role="status", så skjermlesere leser
          resultatet uten at vi setter rollen for hånd. */}
      {result && (
        <output
          className={`text-sm ${result.ok ? "text-muted-foreground" : "text-destructive"}`}
        >
          {result.message}
        </output>
      )}
    </div>
  );
}
