/**
 * Vern mot at e-post går ut fra dev/preview.
 *
 * Dev- og preview-databasene er kopier av prod (Neon-brancher) og inneholder
 * ekte kunder, påmeldte og abonnenter. Derfor er utsending LUKKET som standard:
 * e-post leveres bare til ekte mottakere når vi kjører i produksjon.
 *
 *   - `VERCEL_ENV=production` (settes av Vercel) eller `EMAIL_DELIVERY=live`
 *     → live: sendes som normalt.
 *   - ellers, med `EMAIL_DEV_REDIRECT=meg@eksempel.no` (kommaseparert)
 *     → redirect: ALT sendes dit i stedet, emnet merkes med opprinnelig mottaker.
 *   - ellers → blocked: ingenting sendes, det logges bare.
 *
 * Nyhetsbrev-broadcasts og endringer i Resend-kontaktlista er aldri tillatt
 * utenfor live (de går til/endrer den ekte lista i Resend uansett database).
 */

export type EmailDelivery =
  | { mode: "live" }
  | { mode: "redirect"; to: string[] }
  | { mode: "blocked" };

type Env = Record<string, string | undefined>;

export function resolveEmailDelivery(env: Env = process.env): EmailDelivery {
  if (env.VERCEL_ENV === "production" || env.EMAIL_DELIVERY === "live") {
    return { mode: "live" };
  }
  const to = (env.EMAIL_DEV_REDIRECT ?? "")
    .split(",")
    .map((address) => address.trim())
    .filter(Boolean);
  return to.length > 0 ? { mode: "redirect", to } : { mode: "blocked" };
}

export function isEmailLive(env: Env = process.env): boolean {
  return resolveEmailDelivery(env).mode === "live";
}

/** Felter vi rører ved omdirigering — dekker både Resend og nodemailer-formen. */
type Redirectable = {
  to?: unknown;
  cc?: unknown;
  bcc?: unknown;
  subject?: string;
};

function describeRecipients(to: unknown): string {
  const list = Array.isArray(to) ? to : [to];
  return list
    .map((entry) => {
      if (typeof entry === "string") return entry;
      if (entry && typeof entry === "object" && "address" in entry) {
        return String((entry as { address: unknown }).address);
      }
      return "ukjent";
    })
    .join(", ");
}

/**
 * Bruk leveringsreglene på én e-post. Returnerer meldingen som skal sendes,
 * eller `null` når den skal stoppes. Kopi/blindkopi fjernes alltid ved
 * omdirigering, så ingen ekte adresse blir med.
 */
export function applyEmailDelivery<T extends object>(
  input: T,
  env: Env = process.env
): T | null {
  const delivery = resolveEmailDelivery(env);
  if (delivery.mode === "live") return input;
  const message: Redirectable = input;

  const original = describeRecipients(message.to);
  if (delivery.mode === "blocked") {
    console.info(
      `[e-post] Ikke sendt (ikke prod): «${message.subject ?? ""}» til ${original}. Sett EMAIL_DEV_REDIRECT for å få den til deg selv.`
    );
    return null;
  }

  console.info(
    `[e-post] Omdirigert (ikke prod): «${message.subject ?? ""}» til ${original} → ${delivery.to.join(", ")}`
  );
  const { cc: _cc, bcc: _bcc, ...rest } = message;
  return {
    ...rest,
    to: delivery.to,
    subject: `[DEV → ${original}] ${message.subject ?? ""}`,
  } as unknown as T;
}
