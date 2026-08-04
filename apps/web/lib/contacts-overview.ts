import { getResend } from "@poynt/email";
import { db, eq } from "@poynt/planner-db";
import {
  plannerMembershipApplication,
  plannerSubscription,
  plannerUser,
} from "@poynt/planner-db/schema";
import { canonicalizeEmail } from "@poynt/utils/email-normalize";
import type { Payload } from "payload";

/**
 * «Kontakter»-oversikten: samler alle stedene en person kan dukke opp —
 * bestillinger (Payload), skjema-innsendinger (kontakt + venteliste),
 * nyhetsbrevlista (Resend), On Poynt-medlemmer og medlemssøknader (Drizzle) —
 * og slår dem sammen per person på normalisert e-post (canonicalEmail).
 * Kun lesing; hver kilde eier fortsatt sine egne data.
 */

export interface ContactRow {
  /** Normalisert e-post — nøkkelen radene er slått sammen på. */
  canonicalEmail: string;
  /** Slik adressen faktisk ble skrevet (første sett). */
  email: string;
  name?: string;
  /** Betalte bestillinger. */
  orders: { count: number; totalKr: number; lastAt?: string };
  /** Kontakt-/skjemahenvendelser (uten venteliste). */
  submissions: { count: number; lastAt?: string };
  waitlist: boolean;
  newsletter: boolean;
  member?: { tier: string; status: string };
  application?: { status: string; companyName?: string };
  /** Nyeste aktivitet på tvers av kildene — brukes til sortering. */
  lastActivity?: string;
}

export interface ContactsOverview {
  rows: ContactRow[];
  /** Om Resend-lista faktisk kunne hentes (krever RESEND_API_KEY). */
  newsletterAvailable: boolean;
}

function later(a: string | undefined, b: string | undefined) {
  if (!a) return b;
  if (!b) return a;
  return a > b ? a : b;
}

export async function getContactsOverview(
  payload: Payload
): Promise<ContactsOverview> {
  const rows = new Map<string, ContactRow>();

  const rowFor = (email: string, name?: string | null): ContactRow | null => {
    const trimmed = email?.trim();
    if (!trimmed || !trimmed.includes("@")) return null;
    const key = canonicalizeEmail(trimmed);
    let row = rows.get(key);
    if (!row) {
      row = {
        canonicalEmail: key,
        email: trimmed,
        orders: { count: 0, totalKr: 0 },
        submissions: { count: 0 },
        waitlist: false,
        newsletter: false,
      };
      rows.set(key, row);
    }
    if (name && !row.name) row.name = name;
    return row;
  };

  // 1) Bestillinger (kun betalte — pending/avbrutte er ikke kunder ennå).
  const orders = await payload
    .find({
      collection: "orders",
      where: { status: { equals: "paid" } },
      limit: 1000,
      depth: 0,
      sort: "-createdAt",
    })
    .catch(() => null);
  for (const order of orders?.docs ?? []) {
    if (!order.customerEmail) continue;
    const row = rowFor(order.customerEmail, order.customerName);
    if (!row) continue;
    row.orders.count += 1;
    row.orders.totalKr += order.total ?? 0;
    row.orders.lastAt = later(row.orders.lastAt, order.createdAt);
    row.lastActivity = later(row.lastActivity, order.createdAt);
  }

  // 2) Skjema-innsendinger. Ventelista er «skjema med tittel Venteliste …»
  //    (samme regel som venteliste-hooken), resten er henvendelser.
  const submissions = await payload
    .find({
      collection: "form-submissions",
      limit: 1000,
      depth: 1,
      sort: "-createdAt",
    })
    .catch(() => null);
  for (const submission of submissions?.docs ?? []) {
    const entries = (submission.submissionData ?? []) as {
      field: string;
      value: string;
    }[];
    const get = (names: string[]) =>
      entries.find((e) => names.includes((e.field ?? "").toLowerCase()))?.value;

    const email = get(["epost", "email", "e-post"]);
    if (!email) continue;
    const row = rowFor(email, get(["fulltnavn", "navn", "name"]));
    if (!row) continue;

    const formTitle =
      typeof submission.form === "object" ? (submission.form?.title ?? "") : "";
    if (formTitle.startsWith("Venteliste")) {
      row.waitlist = true;
    } else {
      row.submissions.count += 1;
      row.submissions.lastAt = later(
        row.submissions.lastAt,
        submission.createdAt
      );
    }
    row.lastActivity = later(row.lastActivity, submission.createdAt);
  }

  // 3) On Poynt-medlemmer (Better Auth + abonnement).
  const members = await db
    .select({
      email: plannerUser.email,
      name: plannerUser.name,
      createdAt: plannerUser.createdAt,
      tier: plannerSubscription.tier,
      status: plannerSubscription.status,
    })
    .from(plannerUser)
    .leftJoin(
      plannerSubscription,
      eq(plannerSubscription.userId, plannerUser.id)
    )
    .catch(() => []);
  for (const member of members) {
    const row = rowFor(member.email, member.name);
    if (!row) continue;
    row.member = {
      tier: member.tier ?? "none",
      status: member.status ?? "inactive",
    };
    row.lastActivity = later(row.lastActivity, member.createdAt.toISOString());
  }

  // 4) Medlemssøknader.
  const applications = await db
    .select({
      email: plannerMembershipApplication.email,
      fullName: plannerMembershipApplication.fullName,
      status: plannerMembershipApplication.status,
      companyName: plannerMembershipApplication.companyName,
      createdAt: plannerMembershipApplication.createdAt,
    })
    .from(plannerMembershipApplication)
    .catch(() => []);
  for (const application of applications) {
    const row = rowFor(application.email, application.fullName);
    if (!row) continue;
    row.application = {
      status: application.status,
      companyName: application.companyName ?? undefined,
    };
    row.lastActivity = later(
      row.lastActivity,
      application.createdAt.toISOString()
    );
  }

  // 5) Nyhetsbrevlista i Resend — første gang den er synlig i admin.
  let newsletterAvailable = false;
  if (process.env.RESEND_API_KEY) {
    try {
      const audienceId = process.env.RESEND_AUDIENCE_ID;
      const result = await getResend().contacts.list(
        audienceId ? { audienceId } : undefined
      );
      if (!result.error) {
        newsletterAvailable = true;
        for (const contact of result.data?.data ?? []) {
          if (contact.unsubscribed) continue;
          const row = rowFor(
            contact.email,
            [contact.first_name, contact.last_name].filter(Boolean).join(" ") ||
              undefined
          );
          if (!row) continue;
          row.newsletter = true;
          row.lastActivity = later(row.lastActivity, contact.created_at);
        }
      }
    } catch (error) {
      console.error("Kontakter: klarte ikke hente Resend-lista:", error);
    }
  }

  return {
    rows: [...rows.values()].sort((a, b) =>
      (b.lastActivity ?? "").localeCompare(a.lastActivity ?? "")
    ),
    newsletterAvailable,
  };
}
