import type { Form } from "@/payload-types";
import config from "@/payload.config";
import { getPayload } from "payload";

/** Tittelen på kontaktskjemaet (seedes i scripts/seed-kontakt.ts). */
export const CONTACT_FORM_TITLE = "Kontakt";

/**
 * Henter kontaktskjemaet (form-builder) med felt-definisjonene. Brukes både av
 * den dedikerte /kontakt-siden og av modal-interceptoren, slik at de rendrer
 * nøyaktig samme skjema.
 */
export async function getContactForm(): Promise<Form | null> {
  const payload = await getPayload({ config });
  const res = await payload.find({
    collection: "forms",
    where: { title: { equals: CONTACT_FORM_TITLE } },
    limit: 1,
    depth: 1,
  });
  return res.docs[0] ?? null;
}
