import config from "@/payload.config";
import { getPayload } from "payload";

/**
 * Admin-API-ene for eventer (Påmeldte-fanen, innsjekk, CSV) krever en
 * innlogget Payload-bruker — samme cookie som admin-panelet.
 */
export async function getAdminUser(headers: Headers) {
  const payload = await getPayload({ config });
  const { user } = await payload.auth({ headers });
  return user;
}
