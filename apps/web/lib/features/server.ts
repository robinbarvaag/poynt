import config from "@/payload.config";
import { cacheLife, cacheTag } from "next/cache";
import { redirect } from "next/navigation";
import { getPayload } from "payload";
import {
  DEFAULT_FEATURE_FLAGS,
  FEATURE_KEYS,
  type FeatureFlags,
  type FeatureKey,
} from "./keys";

/**
 * Leser feature-flaggene fra globalen «On Poynt-funksjoner». Cachet med tag
 * "features" — globalens afterChange-hook revaliderer taggen, så endringer i
 * admin slår gjennom umiddelbart.
 */
export async function getFeatureFlags(): Promise<FeatureFlags> {
  "use cache";
  cacheTag("features");
  cacheLife("minutes");

  const payload = await getPayload({ config });
  const global = await payload
    .findGlobal({ slug: "on-poynt-features" })
    .catch(() => null);

  if (!global) return DEFAULT_FEATURE_FLAGS;

  const flags = { ...DEFAULT_FEATURE_FLAGS };
  for (const key of FEATURE_KEYS) {
    const value = (global as Partial<Record<FeatureKey, boolean | null>>)[key];
    flags[key] = value ?? true;
  }
  return flags;
}

/**
 * Server-side vakt for funksjonssider: er funksjonen skrudd av i admin,
 * sendes brukeren til oversikten i stedet for å se siden.
 */
export async function requireFeature(key: FeatureKey): Promise<void> {
  const flags = await getFeatureFlags();
  if (!flags[key]) {
    redirect("/on-poynt/oversikt");
  }
}
