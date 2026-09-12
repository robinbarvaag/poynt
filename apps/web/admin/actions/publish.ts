"use server";

import { requireAdmin } from "@/lib/require-admin";
import {
  type DraftCollectionSlug,
  isDraftCollection,
} from "@/lib/unpublished-overview";

/**
 * Publiserer det nyeste utkastet av ett dokument — motoren bak «Klar til
 * publisering» (/admin/upublisert) og hurtigtasten der.
 *
 * Payloads update bygger på siste versjon når drafts er på, så det holder å
 * sende `_status: "published"`: innholdet i utkastet blir den publiserte
 * versjonen. Revalidering av nettsiden skjer i collectionens afterChange-hook.
 */
export async function publishDocument(
  collection: string,
  id: string | number
): Promise<{ success: true } | { success: false; error: string }> {
  const { payload, user } = await requireAdmin();

  if (!isDraftCollection(collection)) {
    return { success: false, error: "Ukjent samling." };
  }

  try {
    await payload.update({
      collection: collection as DraftCollectionSlug,
      id,
      data: { _status: "published" },
      draft: false,
      user,
      overrideAccess: false,
    });
    return { success: true };
  } catch (error) {
    // Typisk årsak: påkrevde felt mangler i utkastet. Da må dokumentet åpnes.
    const message =
      error instanceof Error ? error.message : "Kunne ikke publisere.";
    return { success: false, error: message };
  }
}
