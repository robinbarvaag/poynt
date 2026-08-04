import { revalidateTag } from "next/cache";
import type { PayloadRequest } from "payload";

/** Tittelen på ventelista for boka «Verdifull vekst» (brukes av seed-scriptet). */
export const WAITLIST_FORM_TITLE = "Venteliste – Verdifull vekst";

/**
 * Et skjema regnes som en venteliste når tittelen begynner med «Venteliste».
 * Da kan det lages nye ventelister rett i admin – «Venteliste – neste bok» –
 * uten at noen må røre kode.
 */
export function isWaitlistFormTitle(title: string | null | undefined): boolean {
  return (title ?? "").trim().toLowerCase().startsWith("venteliste");
}

/**
 * Trekker ut hva det ventes på: «Venteliste – Verdifull vekst» → «Verdifull
 * vekst». Uten skilletegn brukes hele tittelen.
 */
export function waitlistSubjectFromTitle(title: string): string {
  const parts = title.split(/[–—-]/);
  const tail = parts.slice(1).join("-").trim();
  return tail || title.trim();
}

/**
 * Nettleseren sender «on» for en avhaket checkbox, mens Payload-admin og
 * API-kall kan sende «true»/«1». Alt annet (inkludert et felt som ikke ble
 * sendt i det hele tatt) er et nei.
 */
function isChecked(value: string | undefined): boolean {
  return ["on", "true", "1", "ja", "yes"].includes(
    (value ?? "").trim().toLowerCase()
  );
}

interface HandleWaitlistParams {
  req: PayloadRequest;
  /** Tittelen på skjemaet innsendingen tilhører. */
  formTitle: string;
  /** Skjema-ID, brukes til å telle hvor mange som står på lista. */
  formId: string | number;
  /** Rådataene fra innsendingen. */
  get: (names: string[]) => string | undefined;
  /**
   * Om skjemaet har en egen bekreftelse under «E-poster ved innsending» —
   * da sender form-builder-pluginen den (i Poynt-ramma via beforeEmail), og
   * standardbekreftelsen i koden hoppes over. Varselet til Poynt sendes uansett.
   */
  hasOwnConfirmation?: boolean;
}

/**
 * Håndterer en venteliste-påmelding: melder på nyhetsbrevet hvis personen
 * krysset av, sender bekreftelse + varsel, og blanker cachen for telleren i
 * bok-heroen. Feil logges, men velter aldri innsendingen – påmeldingen ligger
 * uansett trygt i «Innsendinger».
 */
export async function handleWaitlistSubmission({
  req,
  formTitle,
  formId,
  get,
  hasOwnConfirmation,
}: HandleWaitlistParams): Promise<void> {
  const email = get(["epost", "email", "e-post"]);
  if (!email) return;

  const name = get(["navn", "name", "fornavn"]);
  // «samtykke» = det samlede ja-et (venteliste + påfyll). «nyhetsbrev» støttes
  // fortsatt for eldre skjemaer som skilte de to.
  const wantsNewsletter = isChecked(
    get(["samtykke", "nyhetsbrev", "newsletter"])
  );
  const subject = waitlistSubjectFromTitle(formTitle);

  if (wantsNewsletter) {
    const { subscribeToNewsletter } = await import("@poynt/email");
    const result = await subscribeToNewsletter(email);
    if (!result.success) {
      req.payload.logger.error(
        `Nyhetsbrev-påmelding fra venteliste feilet: ${result.error}`
      );
    }
  }

  const totalSignups = await req.payload
    .count({
      collection: "form-submissions",
      where: { form: { equals: formId } },
    })
    .then((result) => result.totalDocs)
    .catch(() => undefined);

  const { sendWaitlistEmails } = await import("@poynt/email");
  const { getNotificationEmails } = await import("@/lib/notification-emails");
  await sendWaitlistEmails({
    to: await getNotificationEmails(),
    email,
    name,
    title: subject,
    newsletter: wantsNewsletter,
    totalSignups,
    skipConfirmation: hasOwnConfirmation,
  });

  try {
    revalidateTag("venteliste", "max");
  } catch {
    // Utenfor Next-kontekst (f.eks. seed-script) — cachen utløper selv.
  }
}
