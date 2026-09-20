"use server";

import {
  type DuplicateGroup,
  findDuplicateMedia,
} from "@/lib/media-duplicates";
import {
  type MediaUsage,
  findMediaUsage,
  findUsedMediaIds,
} from "@/lib/media-usage";
import config from "@/payload.config";
import { headers as nextHeaders } from "next/headers";
import { getPayload } from "payload";

/**
 * Server-handlinger for de to oversiktene i Media-admin: hvor et bilde er
 * brukt, og hvilke bilder som er dubletter. Begge leser på tvers av hele
 * databasen, så de kjører på serveren bak en admin-sjekk.
 */

async function requireAdmin() {
  const payload = await getPayload({ config });
  const { user } = await payload.auth({ headers: await nextHeaders() });
  if (!user) return { error: "Ikke autorisert" as const, payload };
  return { error: null, payload };
}

export type MediaUsageResult =
  | { ok: false; error: string }
  | { ok: true; usage: MediaUsage[] };

export async function getMediaUsage(
  mediaId: number
): Promise<MediaUsageResult> {
  const { error, payload } = await requireAdmin();
  if (error) return { ok: false, error };

  try {
    return { ok: true, usage: await findMediaUsage(payload, mediaId) };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error ? err.message : "Kunne ikke sjekke bruken nå.",
    };
  }
}

export type UnusedMediaResult =
  | { ok: false; error: string }
  | { ok: true; unusedIds: number[] };

/** Hvilke av bildene på denne siden i lista som ikke er brukt noe sted. */
export async function getUnusedMediaIds(
  mediaIds: number[]
): Promise<UnusedMediaResult> {
  const { error, payload } = await requireAdmin();
  if (error) return { ok: false, error };

  try {
    const used = await findUsedMediaIds(payload, mediaIds);
    return { ok: true, unusedIds: mediaIds.filter((id) => !used.has(id)) };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error ? err.message : "Kunne ikke sjekke bruken nå.",
    };
  }
}

export type DuplicateResult =
  | { ok: false; error: string }
  | { ok: true; groups: DuplicateGroup[] };

export async function getDuplicateMedia(): Promise<DuplicateResult> {
  const { error, payload } = await requireAdmin();
  if (error) return { ok: false, error };

  try {
    return { ok: true, groups: await findDuplicateMedia(payload) };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error
          ? err.message
          : "Kunne ikke lete etter dubletter nå.",
    };
  }
}
