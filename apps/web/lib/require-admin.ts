import config from "@/payload.config";
import { headers as nextHeaders } from "next/headers";
import { getPayload } from "payload";

/**
 * Vakt for admin server actions. Server actions er offentlige POST-endepunkter
 * (adresserbare via action-ID i klient-bundelen), så HVER action må selv sjekke
 * at kalleren er en innlogget Payload-bruker — å være «bak» admin-UI-et er
 * ingen beskyttelse. Kast ved manglende auth: `await requireAdmin()`.
 */
export async function requireAdmin() {
  const payload = await getPayload({ config });
  const { user } = await payload.auth({ headers: await nextHeaders() });
  if (!user) {
    throw new Error("Ikke autorisert");
  }
  return { payload, user };
}
