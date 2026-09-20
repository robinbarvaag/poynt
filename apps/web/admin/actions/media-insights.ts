"use server";

import {
  type DuplicateGroup,
  findDuplicateMedia,
} from "@/lib/media-duplicates";
import {
  type MediaUsage,
  findMediaUsage,
  findMediaUsageForMany,
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

export type MediaUsageListResult =
  | { ok: false; error: string }
  | { ok: true; usageById: Record<string, MediaUsage[]> };

/**
 * Bruken for alle bildene på én side i lista, i ett oppslag. Returneres som et
 * enkelt objekt fordi det er en server-handling — en Map hadde blitt tyngre å
 * serialisere enn den er verdt her.
 */
export async function getMediaUsageForList(
  mediaIds: number[]
): Promise<MediaUsageListResult> {
  const { error, payload } = await requireAdmin();
  if (error) return { ok: false, error };

  try {
    const byMedia = await findMediaUsageForMany(payload, mediaIds);
    const usageById: Record<string, MediaUsage[]> = {};
    for (const [id, usage] of byMedia) usageById[String(id)] = usage;
    return { ok: true, usageById };
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
