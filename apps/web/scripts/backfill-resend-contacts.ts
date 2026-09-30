/**
 * Fyller inn kilde/side/påmeldt-dato og navn på kontaktene som allerede ligger
 * i Resend. Nye påmeldinger får dette automatisk (lib/newsletter-consent.ts),
 * men kontakter fra før 2026-09-30 har bare e-postadressen.
 *
 * Datakilder (Payload):
 * - «newsletter-consents»: FØRSTE samtykke per e-post gir kilde, side og dato
 * - Bestillinger (betalte) og event-påmeldinger: navn, når Resend mangler det
 *
 * Idempotent: egenskapene settes til det loggen sier, navn røres bare hvis
 * kontakten ikke har navn fra før. Kontakter uten samtykke i loggen (lagt inn
 * manuelt i Resend, eller påmeldt før loggen fantes) får bare navn.
 *
 * Tørrkjøring er standard — skriver ingenting, viser bare hva som ville skjedd:
 *   bun run --cwd apps/web payload run scripts/backfill-resend-contacts.ts
 * Skriv til Resend:
 *   bun run --cwd apps/web payload run scripts/backfill-resend-contacts.ts apply
 */
import { NEWSLETTER_CONSENT_SOURCES } from "@/lib/newsletter-consent-texts";
import config from "@payload-config";
import {
  ensureContactProperties,
  getResend,
  listAllNewsletterContacts,
} from "@poynt/email";
import { canonicalizeEmail } from "@poynt/utils/email-normalize";
import { getPayload } from "payload";

// `payload run` fjerner flagg (--x) fra argv, så bryteren er et vanlig ord.
const apply = process.argv.includes("apply");

// Resend tillater 10 kall/sek per team — hold god margin.
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function splitName(name: string | null | undefined) {
  const [firstName, ...rest] = (name ?? "").trim().split(/\s+/).filter(Boolean);
  return { firstName, lastName: rest.join(" ") || undefined };
}

async function main() {
  if (!process.env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY mangler.");
    process.exit(1);
  }
  const payload = await getPayload({ config });

  // 1) Første samtykke per e-post.
  const consents = await payload.find({
    collection: "newsletter-consents",
    sort: "createdAt",
    limit: 0,
    pagination: false,
    depth: 0,
    overrideAccess: true,
  });
  const firstConsent = new Map<
    string,
    { kilde: string; side?: string; pameldt: string }
  >();
  for (const consent of consents.docs) {
    const key = canonicalizeEmail(consent.email);
    if (firstConsent.has(key)) continue;
    firstConsent.set(key, {
      kilde:
        NEWSLETTER_CONSENT_SOURCES.find((s) => s.value === consent.source)
          ?.label ?? consent.source,
      side: consent.path ?? undefined,
      pameldt: consent.createdAt.slice(0, 10),
    });
  }

  // 2) Navn fra bestillinger og event-påmeldinger.
  const names = new Map<string, string>();
  const orders = await payload.find({
    collection: "orders",
    where: { status: { equals: "paid" } },
    limit: 0,
    pagination: false,
    depth: 0,
    overrideAccess: true,
  });
  for (const order of orders.docs) {
    if (order.customerEmail && order.customerName) {
      names.set(canonicalizeEmail(order.customerEmail), order.customerName);
    }
  }
  const registrations = await payload
    .find({
      collection: "event-registrations",
      limit: 0,
      pagination: false,
      depth: 0,
      overrideAccess: true,
    })
    .catch(() => ({ docs: [] }));
  for (const registration of registrations.docs) {
    if (registration.email && registration.name) {
      const key = canonicalizeEmail(registration.email);
      if (!names.has(key)) names.set(key, registration.name);
    }
  }

  // 3) Kontaktene i Resend.
  const contacts = await listAllNewsletterContacts();
  console.log(
    `${contacts.length} kontakter i Resend, ${firstConsent.size} e-poster i samtykkeloggen, ${names.size} navn funnet.\n`
  );

  if (apply && !(await ensureContactProperties())) {
    console.error("Kunne ikke opprette kontaktegenskapene i Resend — stopper.");
    process.exit(1);
  }

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const contact of contacts) {
    const key = canonicalizeEmail(contact.email);
    const consent = firstConsent.get(key);
    const name =
      !contact.firstName && !contact.lastName ? names.get(key) : undefined;

    if (!consent && !name) {
      skipped++;
      continue;
    }

    const { firstName, lastName } = splitName(name);
    const changes = {
      ...(firstName && { firstName }),
      ...(lastName && { lastName }),
      ...(consent && {
        properties: {
          kilde: consent.kilde,
          pameldt: consent.pameldt,
          ...(consent.side && { side: consent.side.slice(0, 200) }),
        },
      }),
    };

    const summary = [
      consent && `kilde=${consent.kilde}`,
      consent?.side && `side=${consent.side}`,
      consent && `pameldt=${consent.pameldt}`,
      firstName && `navn=${[firstName, lastName].filter(Boolean).join(" ")}`,
    ]
      .filter(Boolean)
      .join(", ");

    if (!apply) {
      console.log(`  ${contact.email}: ${summary}`);
      updated++;
      continue;
    }

    try {
      const result = await getResend().contacts.update({
        id: contact.id,
        ...changes,
      });
      if (result.error) throw new Error(result.error.message);
      console.log(`  ${contact.email}: ok (${summary})`);
      updated++;
    } catch (err) {
      failed++;
      console.warn(
        `  ${contact.email}: ${err instanceof Error ? err.message : err}`
      );
    }
    await sleep(150);
  }

  console.log(
    `\n${apply ? "Ferdig" : "Tørrkjøring ferdig (ingenting skrevet — kjør med «apply» til slutt)"}. ` +
      `Oppdatert: ${updated}, uten ny info: ${skipped}, feilet: ${failed}.`
  );
  process.exit(0);
}

await main();
