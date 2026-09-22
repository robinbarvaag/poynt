"use server";

import { inngest } from "@/lib/inngest/client";
import {
  type BindersData,
  getBindersWidgetData,
} from "@/lib/radar/widget-data";
import { requireAdmin } from "@/lib/require-admin";
import config from "@/payload.config";
import { db, eq } from "@poynt/planner-db";
import {
  type ContentSuggestionStatus,
  plannerContentSuggestion,
} from "@poynt/planner-db/schema";
import { headers } from "next/headers";
import { getPayload } from "payload";

/**
 * Data til den flytende Bindersen-assistenten (klienthentet). Dashbord-
 * varianten henter det samme direkte i serverkomponenten.
 *
 * Returnerer `null` i stedet for å kaste når ingen er innlogget: widgeten
 * ligger i admin-providern og kaller dette også på innloggingssiden, og et
 * kast der ble logget som en 500 («⨯ Error: Ikke autorisert») ved hver
 * innlogging selv om klienten fanget den.
 */
export async function getBindersData(): Promise<BindersData | null> {
  const payload = await getPayload({ config });
  const { user } = await payload.auth({ headers: await headers() });
  if (!user) return null;
  return getBindersWidgetData();
}

/**
 * Setter status på et forslag (snooze / ferdig / avvis / gjenåpne). Avviste
 * forslag gjenoppstår aldri ved ny radar-kjøring (se persist.ts).
 */
export async function setSuggestionStatus(
  id: string,
  status: ContentSuggestionStatus
) {
  await requireAdmin();
  const [updated] = await db
    .update(plannerContentSuggestion)
    .set({ status })
    .where(eq(plannerContentSuggestion.id, id))
    .returning({ id: plannerContentSuggestion.id });
  return { success: Boolean(updated) };
}

/**
 * Trigger en radar-kjøring nå ved å sende Inngest-eventet. Selve analysen
 * kjører som bakgrunnsjobb; UI-et oppdaterer seg når den er ferdig (refresh).
 */
export async function runRadarNow() {
  await requireAdmin();
  try {
    await inngest.send({
      name: "radar/analyze.requested",
      data: { trigger: "manual" },
    });
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: message };
  }
}
