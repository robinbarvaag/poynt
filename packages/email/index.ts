import { Resend } from "resend";
import type {
  OrderConfirmationContent,
  OrderConfirmationItem,
  OrderConfirmationLegal,
  OrderConfirmationSeller,
} from "./templates/order-confirmation";

export type {
  OrderConfirmationContent,
  OrderConfirmationItem,
  OrderConfirmationLegal,
  OrderConfirmationSeller,
};
export {
  renderEmailPreviews,
  type EmailPreview,
  type PreviewTemplateOverrides,
} from "./previews";

export interface EmailAttachment {
  filename: string;
  /** Filinnhold, base64-kodet. */
  content: string;
}

/**
 * Admin-redigert overstyring av en e-postmal (fra «E-postmaler» i Payload).
 * `subject` og `bodyHtml` kan inneholde {{flettefelt}} som fylles ved sending.
 */
export interface EmailTemplateOverride {
  subject?: string;
  bodyHtml?: string;
}

type EmailTemplateProvider = (
  key: string
) => Promise<EmailTemplateOverride | null>;

let templateProvider: EmailTemplateProvider | null = null;

/**
 * Registrer oppslaget mot admin-redigerte maler («E-postmaler» i Payload).
 * Appen registrerer denne ved oppstart (instrumentation.ts); send-funksjonene
 * slår så opp malen selv. Uten provider (seed-scripts o.l.) brukes de kodede
 * standardtekstene.
 */
export function setEmailTemplateProvider(provider: EmailTemplateProvider) {
  templateProvider = provider;
}

/** Hent overstyring for en mal — feil skal aldri velte en utsending. */
async function getTemplateOverride(
  key: string
): Promise<EmailTemplateOverride | null> {
  if (!templateProvider) return null;
  try {
    return await templateProvider(key);
  } catch (error) {
    console.error(`Klarte ikke hente e-postmalen «${key}»:`, error);
    return null;
  }
}

/**
 * Fyll {{flettefelt}} med verdier. Ukjente felt fjernes (blir tom streng) —
 * i forhåndsvisningen brukes i stedet eksempeldata, se previews.ts.
 */
export function fillEmailWildcards(
  text: string,
  values: Record<string, string | number | undefined>
): string {
  return text.replace(/\{\{(.+?)\}\}/g, (_, raw: string) => {
    const value = values[raw.trim().toLowerCase()];
    return value === undefined || value === null ? "" : String(value);
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * subject/bodyHtml fra en overstyring, ferdig utfylt med flettefelt-verdier.
 * Verdiene kommer fra besøkende (navn, melding …) og HTML-escapes i brødteksten
 * så innsendt tekst aldri kan smugle inn HTML i e-posten.
 */
function applyTemplate(
  override: EmailTemplateOverride | null,
  values: Record<string, string | number | undefined>
): { subject?: string; contentHtml?: string } {
  if (!override) return {};
  const htmlSafeValues = Object.fromEntries(
    Object.entries(values).map(([key, value]) => [
      key,
      value === undefined
        ? undefined
        : escapeHtml(String(value)).replace(/\n/g, "<br />"),
    ])
  );
  return {
    subject: override.subject
      ? fillEmailWildcards(override.subject, values)
      : undefined,
    contentHtml: override.bodyHtml
      ? fillEmailWildcards(override.bodyHtml, htmlSafeValues)
      : undefined,
  };
}

let _resend: Resend | null = null;

export function getResend(): Resend {
  if (!_resend) {
    const key = process.env.RESEND_API_KEY;
    if (!key) {
      throw new Error("RESEND_API_KEY is not set");
    }
    _resend = new Resend(key);
  }
  return _resend;
}

// For backward compatibility - lazy getter
export const resend = new Proxy({} as Resend, {
  get(_, prop) {
    return getResend()[prop as keyof Resend];
  },
});

/**
 * Bygg avsender-adressa. Sett `EMAIL_FROM` til et verifisert domene i Resend,
 * f.eks. `no-reply@poynt.no` eller hele strengen `On Poynt <no-reply@poynt.no>`.
 *
 * Faller tilbake til Resend sitt sandbox-domene `onboarding@resend.dev`, som i
 * test-modus KUN leverer til Resend-kontoens egen e-postadresse — derfor må
 * `EMAIL_FROM` settes (og domenet verifiseres) for å sende til andre.
 */
function buildFrom(displayName: string): string {
  const configured = process.env.EMAIL_FROM;
  if (!configured) {
    return `${displayName} <onboarding@resend.dev>`;
  }
  // Tillat enten en bar adresse ("no-reply@poynt.no") eller full "Navn <adr>".
  return configured.includes("<")
    ? configured
    : `${displayName} <${configured}>`;
}

type SendPayload = Parameters<Resend["emails"]["send"]>[0];

/**
 * Send via Resend og kast på feil. Resend-SDK-en kaster IKKE selv på API-feil
 * (den returnerer `{ data, error }`), så uten denne sjekken feiler utsending
 * stille og kallere tror alt gikk bra.
 */
async function sendEmail(payload: SendPayload) {
  const { data, error } = await getResend().emails.send(payload);
  if (error) {
    console.error("Resend e-post feilet:", {
      to: payload.to,
      subject: payload.subject,
      error,
    });
    throw new Error(
      `Resend e-post feilet (${payload.subject}): ${error.message ?? "ukjent feil"}`
    );
  }
  return data;
}

/**
 * Vipps-testbrukere har fiktive adresser (@vippsmobilepay.com) som aldri kan
 * motta e-post. Sett ORDER_TEST_EMAIL_RECIPIENTS (kommaseparert) for å få
 * disse e-postene levert til dere selv under testing i stedet.
 */
function resolveRecipients(email: string): string | string[] {
  const testRecipients = process.env.ORDER_TEST_EMAIL_RECIPIENTS;
  if (testRecipients && email.toLowerCase().endsWith("@vippsmobilepay.com")) {
    return testRecipients
      .split(",")
      .map((address) => address.trim())
      .filter(Boolean);
  }
  return email;
}

export async function sendOrderConfirmation(params: {
  email: string;
  orderNumber: string;
  /** Kjøpsdato — standard nå. */
  orderDate?: Date | string;
  customerName?: string;
  /** «Vipps» eller «Kort (Stripe)» — vises i ordrefakta. */
  paymentMethod?: string;
  items: OrderConfirmationItem[];
  /** Totalsum i kr, inkl. MVA, etter rabatt. */
  total: number;
  /** Rabatt i kr (positivt) — egen linje i oppsummeringen. */
  discount?: number;
  /** Admin-redigerbart emnefelt – ordrenummer legges på automatisk. */
  subject?: string;
  /** Admin-redigerbare tekster i e-posten. */
  content?: OrderConfirmationContent;
  /** Selgeropplysninger (org.nr., adresse …) fra «Nettbutikk»-innstillingene. */
  seller?: OrderConfirmationSeller;
  /** Angrerett-tekst og lenker til vilkår/personvern. */
  legal?: OrderConfirmationLegal;
  /** Vedlegg (f.eks. kjøpte PDF-er), base64-kodet. */
  attachments?: EmailAttachment[];
}) {
  if (!process.env.RESEND_API_KEY) return;

  const { render } = await import("@react-email/render");
  const { default: OrderConfirmationEmail } = await import(
    "./templates/order-confirmation"
  );

  const html = await render(
    OrderConfirmationEmail({
      orderNumber: params.orderNumber,
      orderDate: params.orderDate,
      customerName: params.customerName,
      customerEmail: params.email,
      paymentMethod: params.paymentMethod,
      items: params.items,
      total: params.total,
      discount: params.discount,
      content: params.content,
      seller: params.seller,
      legal: params.legal,
      hasAttachments: (params.attachments?.length ?? 0) > 0,
    })
  );

  await sendEmail({
    from: buildFrom("Poynt"),
    to: resolveRecipients(params.email),
    subject: `${params.subject || "Ordrebekreftelse"} #${params.orderNumber}`,
    html,
    ...(params.attachments?.length && { attachments: params.attachments }),
  });
}

/**
 * Mottakere for interne varsler: eksplisitt `to` fra kalleren (typisk
 * admin-innstillingen via getNotificationEmails) vinner, ellers CONTACT_EMAIL.
 * undefined → varselet droppes stille.
 */
function resolveNotifyTo(
  override?: string | string[]
): string | string[] | undefined {
  if (Array.isArray(override)) {
    return override.length > 0 ? override : undefined;
  }
  return override || process.env.CONTACT_EMAIL || undefined;
}

/**
 * Internt varsel til Poynt når det kommer et salg — produktkjøp eller nytt
 * medlemskap. Skal ALDRI velte ordreflyten: no-op hvis mottaker eller
 * RESEND_API_KEY mangler, og kallere bør svelge feil.
 */
export async function sendSaleNotification(params: {
  /** Mottakere — overstyrer CONTACT_EMAIL (fra admin-innstillingen). */
  to?: string | string[];
  /** «Produktsalg» eller «Nytt medlemskap». */
  kind: string;
  orderNumber?: string;
  customerName?: string;
  customerEmail: string;
  items: { name: string; quantity?: number; price?: number }[];
  /** Totalsum i kr. */
  total?: number;
  paymentProvider?: string;
  /** Lenke til ordren i admin. */
  adminUrl?: string;
}) {
  if (!process.env.RESEND_API_KEY) return;
  const notifyTo = resolveNotifyTo(params.to);
  if (!notifyTo) return;

  const { render } = await import("@react-email/render");
  const { default: SaleNotificationEmail } = await import(
    "./templates/sale-notification"
  );

  const template = applyTemplate(
    await getTemplateOverride("sale-notification"),
    {
      type: params.kind,
      ordrenummer: params.orderNumber,
      navn: params.customerName,
      epost: params.customerEmail,
      sum: params.total,
      betaling: params.paymentProvider,
    }
  );

  const html = await render(
    SaleNotificationEmail({ ...params, introHtml: template.contentHtml })
  );

  await sendEmail({
    from: buildFrom("Poynt"),
    to: notifyTo,
    subject:
      template.subject ||
      (params.total
        ? `${params.kind}: ${params.total} kr${params.orderNumber ? ` (#${params.orderNumber})` : ""}`
        : `${params.kind}: ${params.customerEmail}`),
    html,
  });
}

/**
 * Internt varsel til Poynt (CONTACT_EMAIL) når noen melder seg på nyhetsbrevet.
 * No-op hvis CONTACT_EMAIL eller RESEND_API_KEY mangler; kallere bør svelge feil
 * slik at selve påmeldingen aldri feiler på grunn av varselet.
 */
export async function sendNewsletterSignupNotification(params: {
  /** Mottakere — overstyrer CONTACT_EMAIL (fra admin-innstillingen). */
  to?: string | string[];
  email: string;
  /** Hvor påmeldingen kom fra, f.eks. «nyhetsbrev-skjema» eller «utsjekk». */
  source?: string;
}) {
  if (!process.env.RESEND_API_KEY) return;
  const notifyTo = resolveNotifyTo(params.to);
  if (!notifyTo) return;

  const { render } = await import("@react-email/render");
  const { default: NewsletterSignupNotificationEmail } = await import(
    "./templates/newsletter-signup-notification"
  );

  const template = applyTemplate(
    await getTemplateOverride("newsletter-signup-notification"),
    { epost: params.email, kilde: params.source }
  );

  const html = await render(
    NewsletterSignupNotificationEmail({
      ...params,
      introHtml: template.contentHtml,
    })
  );

  await sendEmail({
    from: buildFrom("Poynt"),
    to: notifyTo,
    subject: template.subject || `Ny på nyhetsbrevet: ${params.email}`,
    html,
  });
}

/**
 * Send en branded magisk innloggingslenke til et On Poynt-medlem.
 * No-op hvis RESEND_API_KEY mangler.
 */
export async function sendMagicLinkEmail(params: {
  email: string;
  url: string;
  expiresInMinutes?: number;
}) {
  if (!process.env.RESEND_API_KEY) return;

  const { render } = await import("@react-email/render");
  const { default: MagicLinkEmail } = await import("./templates/magic-link");

  const template = applyTemplate(await getTemplateOverride("magic-link"), {
    minutter: params.expiresInMinutes ?? 10,
  });

  const html = await render(
    MagicLinkEmail({
      url: params.url,
      expiresInMinutes: params.expiresInMinutes,
      contentHtml: template.contentHtml,
    })
  );

  await sendEmail({
    from: buildFrom("On Poynt"),
    to: params.email,
    subject: template.subject || "Logg inn på On Poynt",
    html,
  });
}

/**
 * Render den branda «tilbakestill passord»-e-posten til HTML.
 * Brukes av Payload-admin (Users-collection) sin forgotPassword-hook.
 */
export async function renderPasswordResetEmail(params: {
  url: string;
  name?: string;
}): Promise<string> {
  const { render } = await import("@react-email/render");
  const { default: PasswordResetEmail } = await import(
    "./templates/password-reset"
  );

  const template = applyTemplate(await getTemplateOverride("password-reset"), {
    navn: params.name,
  });

  return render(
    PasswordResetEmail({
      url: params.url,
      name: params.name,
      contentHtml: template.contentHtml,
    })
  );
}

/**
 * Emnefeltet for en mal: admin-redigert hvis satt (med flettefelt utfylt),
 * ellers standardteksten. Brukes der emnet genereres separat fra innholdet
 * (f.eks. Payload sin forgotPassword-hook).
 */
export async function resolveTemplateSubject(
  key: string,
  values: Record<string, string | number | undefined>,
  fallback: string
): Promise<string> {
  const override = await getTemplateOverride(key);
  return override?.subject
    ? fillEmailWildcards(override.subject, values)
    : fallback;
}

/**
 * Egenskapene vi lagrer på hver kontakt i Resend, i tillegg til e-post og navn.
 * Gjør at partneren kan se i Resend-dashbordet hvor folk meldte seg på, og
 * kan brukes som flettefelt i broadcasts ({{{contact.kilde}}}). Resend krever
 * at egenskapene er opprettet før de brukes på en kontakt — se
 * ensureContactProperties().
 */
export const NEWSLETTER_CONTACT_PROPERTIES = [
  { key: "kilde", type: "string" },
  { key: "side", type: "string" },
  { key: "pameldt", type: "string" },
] as const;

export interface NewsletterContactMeta {
  /** Lesbar kilde, f.eks. «Kvitteringsside». */
  source?: string;
  /** Sti på nettstedet der påmeldingen skjedde. */
  path?: string;
  firstName?: string;
  lastName?: string;
}

let contactPropertiesReady: Promise<boolean> | null = null;

/**
 * Opprett kontaktegenskapene i Resend hvis de mangler. Kjøres én gang per
 * prosess og huskes; feiler den, sender vi kontakten uten egenskaper heller
 * enn å velte påmeldingen.
 */
export function ensureContactProperties(): Promise<boolean> {
  if (!contactPropertiesReady) {
    contactPropertiesReady = (async () => {
      const resend = getResend();
      const existing = await resend.contactProperties.list({ limit: 100 });
      if (existing.error) throw new Error(existing.error.message);
      const keys = new Set(existing.data?.data.map((p) => p.key) ?? []);
      for (const property of NEWSLETTER_CONTACT_PROPERTIES) {
        if (keys.has(property.key)) continue;
        const created = await resend.contactProperties.create({
          key: property.key,
          type: property.type,
        });
        if (created.error && !created.error.message?.includes("already")) {
          throw new Error(created.error.message);
        }
      }
      return true;
    })().catch((error: unknown) => {
      console.error("Kunne ikke opprette kontaktegenskaper i Resend:", error);
      contactPropertiesReady = null;
      return false;
    });
  }
  return contactPropertiesReady;
}

/** Bygg `properties`-objektet for create/update, kun med felt som har verdi. */
async function contactPropertiesFor(
  meta: NewsletterContactMeta | undefined
): Promise<Record<string, string> | undefined> {
  if (!meta?.source && !meta?.path) return undefined;
  if (!(await ensureContactProperties())) return undefined;
  const properties: Record<string, string> = {
    pameldt: new Date().toISOString().slice(0, 10),
  };
  if (meta.source) properties.kilde = meta.source.slice(0, 200);
  if (meta.path) properties.side = meta.path.slice(0, 200);
  return properties;
}

/**
 * Subscribe an email to the newsletter audience in Resend. `meta` (kilde, side,
 * navn) legges på kontakten så den er synlig og filtrerbar i Resend.
 */
export async function subscribeToNewsletter(
  email: string,
  meta?: NewsletterContactMeta
): Promise<{
  success: boolean;
  error?: string;
  /** Adressen var allerede aktiv abonnent — ingenting ble endret. */
  alreadySubscribed?: boolean;
}> {
  const apiKey = process.env.RESEND_API_KEY;
  // Nyere Resend-kontoer har én innebygd audience — audienceId er da valgfri.
  // Settes RESEND_AUDIENCE_ID, brukes den eksplisitt (eldre kontoer).
  const audienceId = process.env.RESEND_AUDIENCE_ID;

  if (!apiKey) {
    return { success: false, error: "RESEND_API_KEY is not configured" };
  }

  try {
    // Står adressen allerede som aktiv abonnent, rører vi den ikke — da skal
    // det heller ikke gå ut et «ny på nyhetsbrevet»-varsel.
    const existing = await getResend().contacts.get({
      ...(audienceId && { audienceId }),
      email,
    });
    if (existing.data && !existing.data.unsubscribed) {
      return { success: true, alreadySubscribed: true };
    }

    const properties = await contactPropertiesFor(meta);
    const names = {
      ...(meta?.firstName && { firstName: meta.firstName.slice(0, 100) }),
      ...(meta?.lastName && { lastName: meta.lastName.slice(0, 100) }),
    };

    const result = await getResend().contacts.create({
      ...(audienceId && { audienceId }),
      email,
      unsubscribed: false,
      ...names,
      ...(properties && { properties }),
    });

    if (result.error) {
      // Kontakten finnes fra før — kan være avmeldt, så re-abonner eksplisitt
      // (contacts.create setter aldri unsubscribed tilbake til false).
      if (result.error.message?.includes("already exists")) {
        const update = await getResend().contacts.update({
          ...(audienceId && { audienceId }),
          email,
          unsubscribed: false,
          ...names,
          ...(properties && { properties }),
        });
        if (update.error) {
          return { success: false, error: update.error.message };
        }
        return { success: true };
      }
      return { success: false, error: result.error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Newsletter subscription error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Ukjent feil",
    };
  }
}

export interface NewsletterContact {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  unsubscribed: boolean;
  createdAt: string;
}

/**
 * Hent HELE kontaktlista fra Resend. API-et gir maks 100 per side (standard
 * 20!), så vi blar gjennom alle sidene. Kaster ved API-feil.
 */
export async function listAllNewsletterContacts(): Promise<
  NewsletterContact[]
> {
  const audienceId = process.env.RESEND_AUDIENCE_ID;
  const contacts: NewsletterContact[] = [];
  let after: string | undefined;

  // Sikkerhetsgrense: 200 sider à 100 = 20 000 kontakter.
  for (let page = 0; page < 200; page += 1) {
    const result = await getResend().contacts.list({
      ...(audienceId && { audienceId }),
      limit: 100,
      ...(after && { after }),
    });
    if (result.error) throw new Error(result.error.message);
    const batch = result.data?.data ?? [];
    for (const contact of batch) {
      contacts.push({
        id: contact.id,
        email: contact.email,
        firstName: contact.first_name,
        lastName: contact.last_name,
        unsubscribed: contact.unsubscribed,
        createdAt: contact.created_at,
      });
    }
    const last = batch.at(-1);
    if (!result.data?.has_more || !last) break;
    after = last.id;
  }

  return contacts;
}

export interface NewsletterAudienceStats {
  total: number;
  subscribed: number;
  unsubscribed: number;
  /** Nye kontakter (opprettet) siste 7 / 30 dager. */
  newLast7Days: number;
  newLast30Days: number;
}

/** Tell opp kontaktlista i Resend. Kaster ved API-feil. */
export async function getNewsletterAudienceStats(): Promise<NewsletterAudienceStats> {
  const contacts = await listAllNewsletterContacts();
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const stats: NewsletterAudienceStats = {
    total: contacts.length,
    subscribed: 0,
    unsubscribed: 0,
    newLast7Days: 0,
    newLast30Days: 0,
  };
  for (const contact of contacts) {
    if (contact.unsubscribed) stats.unsubscribed += 1;
    else stats.subscribed += 1;
    const age = now - new Date(contact.createdAt).getTime();
    if (age <= 7 * day) stats.newLast7Days += 1;
    if (age <= 30 * day) stats.newLast30Days += 1;
  }
  return stats;
}

/**
 * Render nyhetsbrevet (Poynt-ramma rundt ferdig richtext-HTML). Brukes både ved
 * utsending og av «Forhåndsvisning»-fanen på Nyhetsbrev-dokumentet i admin.
 */
export async function renderNewsletterHtml(params: {
  preview: string;
  contentHtml: string;
  unsubscribeUrl: string;
}): Promise<string> {
  const { render } = await import("@react-email/render");
  const { default: NewsletterEmail } = await import("./templates/newsletter");
  return render(NewsletterEmail(params));
}

/**
 * Render en skjema-e-post (Skjemaer → «E-poster ved innsending») i Poynt-ramma.
 * Brukes av beforeEmail-kroken i payload.config og av forhåndsvisningen i
 * admin, slik at det partneren setter opp selv ser ut som resten av e-postene.
 */
export async function renderFormEmailHtml(params: {
  preview: string;
  contentHtml: string;
}): Promise<string> {
  const { render } = await import("@react-email/render");
  const { default: FormEmail } = await import("./templates/form-email");
  return render(FormEmail(params));
}

/**
 * Send en testversjon av nyhetsbrevet til én adresse (vanlig e-post, ikke
 * broadcast). Avmeldingslenken peker på "#" siden Resend kun bytter ut
 * plassholderen ved ekte broadcasts.
 */
export async function sendNewsletterTest(params: {
  to: string;
  subject: string;
  preview: string;
  contentHtml: string;
}) {
  const html = await renderNewsletterHtml({
    preview: params.preview,
    contentHtml: params.contentHtml,
    unsubscribeUrl: "#",
  });

  await sendEmail({
    from: buildFrom("Poynt"),
    to: params.to,
    subject: `[TEST] ${params.subject}`,
    html,
  });
}

/**
 * Målet for nyhetsbrev-broadcasts. Nyere Resend-kontoer har innebygde
 * segmenter — da slår vi opp standard-segmentet automatisk, og ingen env
 * trengs. RESEND_AUDIENCE_ID beholdes som overstyring for eldre kontoer
 * (audienceId er deprecated hos Resend til fordel for segmentId).
 * Returnerer null hvis ingen målgruppe finnes (eller API-et feiler).
 */
export async function resolveBroadcastTarget(): Promise<
  { audienceId: string } | { segmentId: string } | null
> {
  const configured = process.env.RESEND_AUDIENCE_ID;
  if (configured) return { audienceId: configured };
  if (process.env.RESEND_SEGMENT_ID) {
    return { segmentId: process.env.RESEND_SEGMENT_ID };
  }

  try {
    const segments = await getResend().segments.list();
    // Test-segmentet (bare oss selv) skal ALDRI være mål for den ekte
    // utsendingen, uansett rekkefølge fra API-et.
    const candidates = (segments.data?.data ?? []).filter(
      (s) => s.name !== NEWSLETTER_TEST_SEGMENT_NAME
    );
    if (candidates.length === 1) return { segmentId: candidates[0].id };
    // Flere segmenter: bruk Resends standard («General»), ellers må målet
    // pekes ut eksplisitt med RESEND_SEGMENT_ID.
    const general = candidates.find((s) => s.name === "General");
    if (general) return { segmentId: general.id };
    if (candidates.length > 1) {
      console.error(
        `Flere Resend-segmenter (${candidates.map((s) => s.name).join(", ")}) — sett RESEND_SEGMENT_ID`
      );
    }
    return null;
  } catch (error) {
    console.error("Klarte ikke hente Resend-segmenter:", error);
    return null;
  }
}

/** Opprett en broadcast med ferdig HTML og send den med én gang. */
async function createAndSendBroadcast(params: {
  target: { audienceId: string } | { segmentId: string };
  subject: string;
  name: string;
  html: string;
}): Promise<{ broadcastId: string }> {
  const created = await getResend().broadcasts.create({
    ...params.target,
    from: buildFrom("Poynt"),
    subject: params.subject,
    html: params.html,
    name: params.name,
  });
  if (created.error || !created.data) {
    throw new Error(
      `Kunne ikke opprette broadcast: ${created.error?.message ?? "ukjent feil"}`
    );
  }

  const sent = await getResend().broadcasts.send(created.data.id);
  if (sent.error) {
    throw new Error(
      `Kunne ikke sende broadcast: ${sent.error.message ?? "ukjent feil"}`
    );
  }

  return { broadcastId: created.data.id };
}

/**
 * Opprett og send nyhetsbrevet som en Resend Broadcast til hele lista
 * (standard-segmentet, ev. RESEND_AUDIENCE_ID for eldre kontoer). Resend
 * håndterer avmelding per mottaker via `{{{RESEND_UNSUBSCRIBE_URL}}}`-
 * plassholderen i malen.
 */
export async function sendNewsletterBroadcast(params: {
  subject: string;
  preview: string;
  contentHtml: string;
}): Promise<{ broadcastId: string }> {
  const target = await resolveBroadcastTarget();
  if (!target) {
    throw new Error(
      "Fant ingen mottakerliste i Resend — sjekk at kontoen har et segment (eller sett RESEND_SEGMENT_ID)"
    );
  }

  const html = await renderNewsletterHtml({
    preview: params.preview,
    contentHtml: params.contentHtml,
    unsubscribeUrl: "{{{RESEND_UNSUBSCRIBE_URL}}}",
  });

  return createAndSendBroadcast({
    target,
    subject: params.subject,
    name: params.subject,
    html,
  });
}

/**
 * Segmentet i Resend som bare inneholder oss selv, for å teste ekte
 * broadcasts (avmeldingslenke, flettefelt, Resend-statistikk) uten å nå
 * abonnentene. Opprettes automatisk ved første test-broadcast.
 */
export const NEWSLETTER_TEST_SEGMENT_NAME = "Test – kun oss";

/**
 * Send nyhetsbrevet som en EKTE Resend Broadcast, men bare til én adresse:
 * kontakten legges i test-segmentet (opprettes ved behov) og broadcasten
 * sendes dit. Adressen må være kontakt i Resend — er den ikke det fra før,
 * opprettes den. En avmeldt kontakt får ikke e-post fra Resend uansett, så da
 * stopper vi med en forklaring i stedet for å sende i blinde.
 */
export async function sendNewsletterTestBroadcast(params: {
  to: string;
  subject: string;
  preview: string;
  contentHtml: string;
}): Promise<{ broadcastId: string }> {
  const resend = getResend();
  const email = params.to.trim().toLowerCase();

  // 1) Kontakten.
  let contactId: string | undefined;
  const existing = await resend.contacts.get({ email });
  if (existing.data) {
    if (existing.data.unsubscribed) {
      throw new Error(
        `${email} står som avmeldt i Resend, så Resend vil ikke levere til den. Meld adressen på igjen i Resend (Contacts) og prøv på nytt.`
      );
    }
    contactId = existing.data.id;
  } else {
    const created = await resend.contacts.create({
      email,
      unsubscribed: false,
    });
    if (created.error || !created.data) {
      throw new Error(
        `Kunne ikke legge ${email} inn som kontakt i Resend: ${created.error?.message ?? "ukjent feil"}`
      );
    }
    contactId = created.data.id;
  }

  // 2) Test-segmentet.
  const segments = await resend.segments.list();
  if (segments.error) throw new Error(segments.error.message);
  let segmentId = segments.data?.data.find(
    (s) => s.name === NEWSLETTER_TEST_SEGMENT_NAME
  )?.id;
  if (!segmentId) {
    const created = await resend.segments.create({
      name: NEWSLETTER_TEST_SEGMENT_NAME,
    });
    if (created.error || !created.data) {
      throw new Error(
        `Kunne ikke opprette test-segmentet i Resend: ${created.error?.message ?? "ukjent feil"}`
      );
    }
    segmentId = created.data.id;
  }

  // 3) Kontakten inn i segmentet (idempotent — «finnes fra før» er greit).
  const added = await resend.contacts.segments.add({ contactId, segmentId });
  if (added.error && !/already|exists/i.test(added.error.message ?? "")) {
    throw new Error(
      `Kunne ikke legge kontakten i test-segmentet: ${added.error.message}`
    );
  }

  // 4) Broadcasten — merket [TEST] både i emnet og i Resend-lista.
  const html = await renderNewsletterHtml({
    preview: params.preview,
    contentHtml: params.contentHtml,
    unsubscribeUrl: "{{{RESEND_UNSUBSCRIBE_URL}}}",
  });

  return createAndSendBroadcast({
    target: { segmentId },
    subject: `[TEST] ${params.subject}`,
    name: `[TEST] ${params.subject}`,
    html,
  });
}

/**
 * Send branded contact emails when the contact form is submitted: a notification
 * to Poynt (set CONTACT_EMAIL) and a confirmation to the sender. No-ops if
 * RESEND_API_KEY is missing. Uses React Email templates for proper design.
 */
export async function sendContactEmails(params: {
  /** Varsel-mottakere — overstyrer CONTACT_EMAIL (fra admin-innstillingen). */
  to?: string | string[];
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  /** Intern sporing: lesbar kilde-etikett (f.eks. "tjeneste:radgivning"). */
  source?: string;
  /** Intern sporing: stien brukeren sto på da skjemaet ble åpnet. */
  sourcePath?: string;
}): Promise<void> {
  if (!process.env.RESEND_API_KEY) return;

  const { render } = await import("@react-email/render");
  const { default: ContactNotificationEmail } = await import(
    "./templates/contact-notification"
  );
  const { default: ContactConfirmationEmail } = await import(
    "./templates/contact-confirmation"
  );

  const from = buildFrom("Poynt");

  const wildcardValues = {
    navn: params.name,
    epost: params.email,
    telefon: params.phone,
    gjelder: params.subject,
    melding: params.message,
    kilde: params.source,
  };

  // Varselet til Poynt og bekreftelsen til avsender er uavhengige: feiler
  // varselet (f.eks. ugyldig mottakeradresse i admin), skal avsender likevel
  // få bekreftelsen. Feilen kastes videre etterpå så den havner i loggen.
  let notifyError: unknown;
  const notifyTo = resolveNotifyTo(params.to);
  if (notifyTo) {
    try {
      const template = applyTemplate(
        await getTemplateOverride("contact-notification"),
        wildcardValues
      );
      const html = await render(
        ContactNotificationEmail({ ...params, introHtml: template.contentHtml })
      );
      await sendEmail({
        from,
        to: notifyTo,
        replyTo: params.email,
        subject: template.subject || `Ny henvendelse fra ${params.name}`,
        html,
      });
    } catch (error) {
      notifyError = error;
    }
  }

  const confirmationTemplate = applyTemplate(
    await getTemplateOverride("contact-confirmation"),
    wildcardValues
  );
  const confirmationHtml = await render(
    ContactConfirmationEmail({
      name: params.name,
      message: params.message,
      contentHtml: confirmationTemplate.contentHtml,
    })
  );
  await sendEmail({
    from,
    to: params.email,
    subject: confirmationTemplate.subject || "Takk for din henvendelse – Poynt",
    html: confirmationHtml,
  });

  if (notifyError) throw notifyError;
}

/**
 * Send e-postene som hører til en venteliste-påmelding: en branded bekreftelse
 * til den som meldte seg på, og et kort varsel til Poynt (CONTACT_EMAIL).
 * Har skjemaet en egen bekreftelse under «E-poster ved innsending», sender
 * form-builder-pluginen den i stedet — sett da `skipConfirmation` slik at den
 * påmeldte ikke får to bekreftelser. No-op hvis RESEND_API_KEY mangler.
 */
export async function sendWaitlistEmails(params: {
  /** Varsel-mottakere — overstyrer CONTACT_EMAIL (fra admin-innstillingen). */
  to?: string | string[];
  email: string;
  name?: string;
  /** Boka/produktet det ventes på — brukes i emne og brødtekst. */
  title: string;
  /** Om personen samtidig meldte seg på nyhetsbrevet. */
  newsletter?: boolean;
  /** Antall påmeldte totalt — tas med i varselet til Poynt. */
  totalSignups?: number;
  /** Hopp over bekreftelsen til den påmeldte (skjemaet har sin egen). */
  skipConfirmation?: boolean;
}): Promise<void> {
  if (!process.env.RESEND_API_KEY) return;

  const { render } = await import("@react-email/render");

  const from = buildFrom("Poynt");

  if (!params.skipConfirmation) {
    const { default: WaitlistConfirmationEmail } = await import(
      "./templates/waitlist-confirmation"
    );
    const confirmationHtml = await render(
      WaitlistConfirmationEmail({
        name: params.name,
        title: params.title,
        newsletter: params.newsletter,
      })
    );
    await sendEmail({
      from,
      to: params.email,
      subject: `Du står på ventelista for «${params.title}»`,
      html: confirmationHtml,
    });
  }

  const notifyTo = resolveNotifyTo(params.to);
  if (notifyTo) {
    const { default: ContactNotificationEmail } = await import(
      "./templates/contact-notification"
    );
    const details = [
      `Venteliste: ${params.title}`,
      `Nyhetsbrev: ${params.newsletter ? "ja" : "nei"}`,
      params.totalSignups ? `Antall påmeldte nå: ${params.totalSignups}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const notificationHtml = await render(
      ContactNotificationEmail({
        name: params.name || params.email,
        email: params.email,
        eyebrow: "Venteliste",
        heading: "Ny på ventelista",
        intro: `Noen vil ha beskjed når «${params.title}» er klar.`,
        messageLabel: "Detaljer",
        message: details,
      })
    );
    await sendEmail({
      from,
      to: notifyTo,
      replyTo: params.email,
      subject: `Ny på ventelista: ${params.name || params.email}`,
      html: notificationHtml,
    });
  }
}

/* ------------------------------------------------------------------ */
/* Eventer                                                            */
/* ------------------------------------------------------------------ */

export type { EventTicketEmailProps } from "./templates/event-ticket";

/**
 * Billett til en påmeldt: kode, QR-kode (innebygd bilde) og kalenderfil.
 * Brukes både ved påmelding, ved opprykk fra venteliste og når admin sender
 * billetten på nytt. No-op hvis RESEND_API_KEY mangler.
 */
export async function sendEventTicketEmail(params: {
  email: string;
  name?: string;
  eventTitle: string;
  when: string;
  where?: string;
  mapUrl?: string;
  doorsOpen?: string;
  code?: string;
  ticketUrl: string;
  greeting?: string;
  practicalInfo?: string[];
  promoted?: boolean;
  /** Påminnelse dagen før i stedet for bekreftelse. */
  reminder?: boolean;
  /** QR-koden som PNG. Utelates når eventet ikke bruker billetter. */
  qrPng?: Buffer;
  /** Billetter til følget — sendes til den som meldte på. */
  guests?: { name: string; code?: string; ticketUrl: string; qrPng?: Buffer }[];
  /** Innholdet i .ics-fila. */
  ics?: string;
}) {
  if (!process.env.RESEND_API_KEY) return;

  const { render } = await import("@react-email/render");
  const { default: EventTicketEmail } = await import(
    "./templates/event-ticket"
  );

  const qrContentId = "billett-qr";
  const html = await render(
    EventTicketEmail({
      ...params,
      code: params.code,
      qrSrc: params.qrPng ? `cid:${qrContentId}` : undefined,
      guests: params.guests?.map((guest, index) => ({
        name: guest.name,
        code: guest.code,
        ticketUrl: guest.ticketUrl,
        qrSrc: guest.qrPng ? `cid:${qrContentId}-${index + 1}` : undefined,
      })),
    })
  );

  const attachments: NonNullable<SendPayload["attachments"]> = [];
  if (params.qrPng) {
    attachments.push({
      filename: "billett-qr.png",
      content: params.qrPng,
      contentType: "image/png",
      contentId: qrContentId,
    });
  }
  for (const [index, guest] of (params.guests ?? []).entries()) {
    if (!guest.qrPng) continue;
    attachments.push({
      filename: `billett-qr-${index + 1}.png`,
      content: guest.qrPng,
      contentType: "image/png",
      contentId: `${qrContentId}-${index + 1}`,
    });
  }
  if (params.ics) {
    attachments.push({
      filename: "event.ics",
      content: Buffer.from(params.ics, "utf8"),
      contentType: "text/calendar; charset=utf-8; method=PUBLISH",
    });
  }

  await sendEmail({
    from: buildFrom("Poynt"),
    to: params.email,
    subject: params.reminder
      ? `Snart er det tid: ${params.eventTitle}`
      : params.promoted
        ? `Det ble plass: ${params.eventTitle}`
        : `Billetten din: ${params.eventTitle}`,
    html,
    ...(attachments.length && { attachments }),
  });
}

/** Til den som havnet på ventelista. No-op hvis RESEND_API_KEY mangler. */
export async function sendEventWaitlistEmail(params: {
  email: string;
  name?: string;
  eventTitle: string;
  when: string;
  where?: string;
  position?: number;
  ticketUrl: string;
}) {
  if (!process.env.RESEND_API_KEY) return;

  const { render } = await import("@react-email/render");
  const { default: EventWaitlistedEmail } = await import(
    "./templates/event-waitlisted"
  );

  await sendEmail({
    from: buildFrom("Poynt"),
    to: params.email,
    subject: `Du står på ventelista: ${params.eventTitle}`,
    html: await render(EventWaitlistedEmail(params)),
  });
}

/** Kvittering på avmelding. No-op hvis RESEND_API_KEY mangler. */
export async function sendEventCancelledEmail(params: {
  email: string;
  name?: string;
  eventTitle: string;
  when: string;
  eventUrl: string;
  byAdmin?: boolean;
  /** Beløpet som er betalt tilbake, når billetten var betalt. */
  refundedKr?: number;
}) {
  if (!process.env.RESEND_API_KEY) return;

  const { render } = await import("@react-email/render");
  const { default: EventCancelledEmail } = await import(
    "./templates/event-cancelled"
  );

  await sendEmail({
    from: buildFrom("Poynt"),
    to: params.email,
    subject: params.refundedKr
      ? `Billetten er refundert: ${params.eventTitle}`
      : `Du er meldt av: ${params.eventTitle}`,
    html: await render(EventCancelledEmail(params)),
  });
}

const EVENT_NOTIFICATION_HEADINGS = {
  "Ny påmelding": "Noen har meldt seg på",
  "Ny på venteliste": "Noen står på ventelista",
  Avmelding: "Noen har meldt seg av",
} as const;

/**
 * Internt varsel til Poynt ved ny påmelding eller avmelding. Skal aldri velte
 * påmeldingen: no-op uten mottaker/RESEND_API_KEY, og kallere svelger feil.
 */
export async function sendEventRegistrationNotification(params: {
  to?: string | string[];
  kind: "Ny påmelding" | "Ny på venteliste" | "Avmelding";
  name: string;
  /** Mangler for folk registrert på stedet. */
  email?: string;
  eventTitle: string;
  /** «42 av 80 plasser tatt» o.l. */
  seatsText?: string;
  newsletter?: boolean;
  /** Svar på ekstra spørsmål, ferdig formatert som «Spørsmål: svar». */
  answers?: string[];
}) {
  if (!process.env.RESEND_API_KEY) return;
  const notifyTo = resolveNotifyTo(params.to);
  if (!notifyTo) return;

  const { render } = await import("@react-email/render");
  const { default: ContactNotificationEmail } = await import(
    "./templates/contact-notification"
  );

  const details = [
    `Event: ${params.eventTitle}`,
    params.seatsText ?? null,
    params.newsletter === undefined
      ? null
      : `Nyhetsbrev: ${params.newsletter ? "ja" : "nei"}`,
    ...(params.answers ?? []),
  ]
    .filter(Boolean)
    .join("\n");

  await sendEmail({
    from: buildFrom("Poynt"),
    to: notifyTo,
    ...(params.email && { replyTo: params.email }),
    subject: `${params.kind}: ${params.name} (${params.eventTitle})`,
    html: await render(
      ContactNotificationEmail({
        name: params.name,
        email: params.email ?? "",
        eyebrow: "Eventer",
        heading: EVENT_NOTIFICATION_HEADINGS[params.kind],
        intro: `Gjelder «${params.eventTitle}».`,
        messageLabel: "Detaljer",
        message: details,
      })
    ),
  });
}

/**
 * Beskjed fra admin til de påmeldte på et event. Hver mottaker får sin egen
 * e-post (med egen billettlenke), sendt i puljer via Resends batch-API
 * (maks 100 per kall). Kaster ikke: returnerer hvor mange som gikk/feilet.
 */
export async function sendEventMessageEmails(params: {
  eventTitle: string;
  when: string;
  subject: string;
  message: string;
  replyTo?: string;
  recipients: { email: string; name?: string; ticketUrl?: string }[];
}): Promise<{ sent: number; failed: number }> {
  if (!process.env.RESEND_API_KEY) {
    return { sent: 0, failed: params.recipients.length };
  }

  const { render } = await import("@react-email/render");
  const { default: EventMessageEmail } = await import(
    "./templates/event-message"
  );
  const from = buildFrom("Poynt");
  const BATCH_SIZE = 100;
  let sent = 0;
  let failed = 0;

  for (let i = 0; i < params.recipients.length; i += BATCH_SIZE) {
    const chunk = params.recipients.slice(i, i + BATCH_SIZE);
    const emails = await Promise.all(
      chunk.map(async (recipient) => ({
        from,
        to: recipient.email,
        subject: params.subject,
        ...(params.replyTo && { replyTo: params.replyTo }),
        html: await render(
          EventMessageEmail({
            name: recipient.name,
            eventTitle: params.eventTitle,
            when: params.when,
            message: params.message,
            ticketUrl: recipient.ticketUrl,
          })
        ),
      }))
    );
    try {
      const { error } = await getResend().batch.send(emails);
      if (error) throw new Error(error.message ?? "ukjent feil");
      sent += chunk.length;
    } catch (error) {
      console.error(
        `Beskjed til påmeldte feilet for ${chunk.length} mottakere:`,
        error instanceof Error ? error.message : error
      );
      failed += chunk.length;
    }
  }

  return { sent, failed };
}

/**
 * Send branded welcome email to new member with On Poynt onboarding link.
 * Uses React Email template for better rendering across email clients.
 */
export async function sendMemberWelcomeEmail(params: {
  email: string;
  memberName: string;
  tier: "Community" | "Community + AI";
}) {
  if (!process.env.RESEND_API_KEY) return;

  const { render } = await import("@react-email/render");
  const { default: WelcomeMemberEmail } = await import(
    "./templates/welcome-member"
  );

  const onboardingUrl = `${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/on-poynt/onboarding`;

  const template = applyTemplate(await getTemplateOverride("welcome-member"), {
    navn: params.memberName,
    nivå: params.tier,
    niva: params.tier,
  });

  const emailHtml = await render(
    WelcomeMemberEmail({
      memberName: params.memberName,
      tier: params.tier,
      onboardingUrl,
      contentHtml: template.contentHtml,
    })
  );

  await sendEmail({
    from: buildFrom("On Poynt"),
    to: params.email,
    subject: template.subject || "Velkommen til On Poynt!",
    html: emailHtml,
  });
}
