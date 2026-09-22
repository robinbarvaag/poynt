"use server";

import {
  FOLLOW_UP_OPTIONS,
  type FollowUpStatus,
} from "@/lib/boksalg/constants";
import { runStockSnapshot } from "@/lib/boksalg/snapshot";
import { requireAdmin } from "@/lib/require-admin";
import { revalidatePath } from "next/cache";

/**
 * Setter oppfølgingsstatus på én butikk rett fra tabellen, så Susanne slipper
 * å åpne admin for hver butikk hun ringer. Datoen settes automatisk når
 * statusen går fra «ikke kontaktet» til noe annet.
 */
export async function setStoreFollowUpAction(
  storeId: number,
  status: FollowUpStatus
): Promise<{ ok: boolean; message?: string }> {
  const { payload } = await requireAdmin();

  if (!FOLLOW_UP_OPTIONS.some((option) => option.value === status)) {
    return { ok: false, message: "Ukjent status" };
  }

  try {
    await payload.update({
      collection: "book-stores",
      id: storeId,
      data: {
        followUpStatus: status,
        followUpAt: status === "ingen" ? null : new Date().toISOString(),
      },
    });
    revalidatePath("/intern/boksalg");
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Ukjent feil",
    };
  }
}

/**
 * «Hent nå»-knappen. Kjører samme henting som cron-jobben, men direkte i stedet
 * for via Inngest: den tar et par sekunder, og da slipper man å lure på om
 * køen gikk gjennom.
 *
 * Server actions er offentlige POST-endepunkter, så vakta må stå her — å ligge
 * bak en innlogget side er ingen beskyttelse.
 */
export async function refreshStockAction(): Promise<{
  ok: boolean;
  message: string;
}> {
  const { payload } = await requireAdmin();

  try {
    const result = await runStockSnapshot(payload);
    const failed = result.sources.filter((source) => !source.ok);
    const events = result.sources.reduce(
      (sum, source) => sum + (source.events ?? 0),
      0
    );

    revalidatePath("/intern/boksalg");

    if (failed.length > 0) {
      return {
        ok: false,
        message: `Hentet, men ${failed.map((source) => source.sourceKey).join(" og ")} feilet: ${failed[0]?.error ?? "ukjent feil"}`,
      };
    }

    return {
      ok: true,
      message:
        events === 0
          ? "Hentet — ingenting har endret seg siden sist."
          : `Hentet — ${events} ${events === 1 ? "endring" : "endringer"} registrert.`,
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Ukjent feil",
    };
  }
}
