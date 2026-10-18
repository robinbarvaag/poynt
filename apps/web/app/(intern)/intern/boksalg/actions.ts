"use server";

import {
  FOLLOW_UP_OPTIONS,
  type FollowUpStatus,
} from "@/lib/boksalg/constants";
import { runStockSnapshot } from "@/lib/boksalg/snapshot";
import { findSource } from "@/lib/boksalg/sources";
import { requireAdmin } from "@/lib/require-admin";
import { revalidatePath } from "next/cache";

const SOURCE_LABELS: Record<string, string> = { norli: "Norli", ark: "ARK" };

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
    const skipped = result.sources.filter((source) => source.skipped);
    const fetched = result.sources.filter(
      (source) => source.ok && !source.skipped
    );
    const events = result.sources.reduce(
      (sum, source) => sum + (source.events ?? 0),
      0
    );

    revalidatePath("/intern/boksalg");

    const label = (key: string) => SOURCE_LABELS[key] ?? key;
    const parts: string[] = [];

    if (fetched.length > 0) {
      parts.push(
        events === 0
          ? `${fetched.map((s) => label(s.sourceKey)).join(" og ")} hentet — ingenting har endret seg siden sist.`
          : `${fetched.map((s) => label(s.sourceKey)).join(" og ")} hentet — ${events} ${events === 1 ? "endring" : "endringer"} registrert.`
      );
    }
    for (const source of skipped) {
      parts.push(
        `${label(source.sourceKey)} ble hentet for ${source.lastFetchedMinutesAgo ?? 0} min siden og hoppes over (henter ikke oftere enn hvert ${Math.round(
          (findSource(source.sourceKey)?.minIntervalMs ?? 0) / 60_000
        )}. minutt — de blokkerer oss ellers).`
      );
    }
    for (const source of failed) {
      parts.push(
        source.transient
          ? `${label(source.sourceKey)}: ${source.error}`
          : `${label(source.sourceKey)} feilet: ${source.error ?? "ukjent feil"}`
      );
    }

    // Midlertidig avvisning (429) er ikke en feil hos oss — vis det som
    // informasjon, ikke som rød feilmelding, så lenge minst én kilde gikk.
    const hardFailure = failed.some((source) => !source.transient);
    return {
      ok: !hardFailure && (fetched.length > 0 || skipped.length > 0),
      message: parts.join(" ") || "Ingen aktive kilder å hente fra.",
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Ukjent feil",
    };
  }
}
