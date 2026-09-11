"use client";

import { trackEvent } from "@/lib/analytics";
import { useEffect } from "react";

interface Props {
  transactionId: string;
  value: number;
  currency?: string;
}

/**
 * Sender GA4 `purchase` fra kvitteringen — én gang per ordre (refresh av
 * siden skal ikke telle dobbelt). No-op uten statistikk-samtykke.
 */
export function TrackPurchase({
  transactionId,
  value,
  currency = "NOK",
}: Props) {
  useEffect(() => {
    const key = `poynt-purchase-tracked:${transactionId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // sessionStorage kan være utilgjengelig (privat modus) — send uansett.
    }
    trackEvent("purchase", {
      transaction_id: transactionId,
      value,
      currency,
    });
  }, [transactionId, value, currency]);

  return null;
}
