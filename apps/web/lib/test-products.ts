import config from "@/payload.config";
import { cookies, headers as nextHeaders } from "next/headers";
import type { Where } from "payload";
import { getPayload } from "payload";

/**
 * Testprodukter (feltet `testProduct` på Products) skal aldri dukke opp for
 * vanlige besøkende — verken i produktoversikten, i blokker eller i sitemap.
 * Vi filtrerer i spørringene fordi frontend bruker Payloads lokale API, som
 * kjører med `overrideAccess` og derfor ikke ser collection-access.
 *
 * Eldre rader kan ha NULL i kolonnen, og `!= true` treffer ikke NULL i
 * Postgres. Derfor den eksplisitte `exists`-grenen.
 */
export const notTestProduct: Where = {
  or: [{ testProduct: { equals: false } }, { testProduct: { exists: false } }],
};

/** Slår `notTestProduct` sammen med et eksisterende where-uttrykk. */
export function withoutTestProducts(where: Where): Where {
  return { and: [where, notTestProduct] };
}

/**
 * Er den som ser på siden logget inn i Payload-admin? Users-collectionen er
 * kun for admin/partner, så en gyldig `payload-token` = noen av våre egne.
 * Cookie-sjekken først sparer et auth-kall for anonyme besøk.
 */
export async function isAdminViewer(): Promise<boolean> {
  const cookieStore = await cookies();
  if (!cookieStore.has("payload-token")) return false;

  try {
    const payload = await getPayload({ config });
    const { user } = await payload.auth({ headers: await nextHeaders() });
    return Boolean(user);
  } catch {
    return false;
  }
}
