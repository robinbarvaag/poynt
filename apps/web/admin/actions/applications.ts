"use server";

import { canonicalizeEmail } from "@/lib/email-normalize";
import { findOnPoyntUserByEmail } from "@/lib/membership/find-user-by-email";
import { requireAdmin } from "@/lib/require-admin";
import { sendMemberWelcomeEmail } from "@poynt/email";
import { db, eq, sql } from "@poynt/on-poynt-db";
import {
  onPoyntMembershipApplication,
  onPoyntSubscription,
  onPoyntUser,
} from "@poynt/on-poynt-db/schema";

type MembershipTier = "community" | "community_ai";

const tierEmailLabel: Record<MembershipTier, "Community" | "Community + AI"> = {
  community: "Community",
  community_ai: "Community + AI",
};

/**
 * Godkjenn en medlemskapssøknad.
 *
 * Oppretter (eller finner) Better Auth-brukeren, aktiverer abonnementet med
 * valgt tier, merker søknaden godkjent og sender velkomst-e-post. «Faktura i
 * ettertid» – medlemmet får tilgang umiddelbart (status = active), fakturaen
 * håndteres manuelt utenfor systemet basert på faktura-feltene på søknaden.
 */
export async function approveMembershipApplication(
  applicationId: string,
  tier: MembershipTier
) {
  await requireAdmin();
  const [application] = await db
    .select()
    .from(onPoyntMembershipApplication)
    .where(eq(onPoyntMembershipApplication.id, applicationId))
    .limit(1);

  if (!application) {
    return { success: false, error: "Fant ikke søknaden" };
  }
  if (application.status === "approved") {
    return { success: false, error: "Søknaden er allerede godkjent" };
  }

  const canonical =
    application.canonicalEmail || canonicalizeEmail(application.email);

  // 1. Finn eller opprett Better Auth-brukeren (samme mønster som gjeste-kjøp).
  // Oppslaget tåler kontoer med tom canonicalEmail — se findOnPoyntUserByEmail.
  const existing = await findOnPoyntUserByEmail(application.email);

  let userId: string;
  if (existing) {
    userId = existing.id;
  } else {
    userId = crypto.randomUUID();
    await db.insert(onPoyntUser).values({
      id: userId,
      name: application.fullName || application.email.split("@")[0],
      email: application.email,
      canonicalEmail: canonical,
      emailVerified: true,
      role: "user",
    });
  }

  // 2. Aktiver abonnementet (userId er unikt → upsert).
  await db
    .insert(onPoyntSubscription)
    .values({
      id: crypto.randomUUID(),
      userId,
      tier,
      status: "active",
    })
    .onConflictDoUpdate({
      target: onPoyntSubscription.userId,
      set: { tier, status: "active", updatedAt: sql`now()` },
    });

  // 3. Merk søknaden som godkjent.
  await db
    .update(onPoyntMembershipApplication)
    .set({
      status: "approved",
      approvedTier: tier,
      userId,
      reviewedAt: sql`now()`,
      updatedAt: sql`now()`,
    })
    .where(eq(onPoyntMembershipApplication.id, applicationId));

  // 4. Velkomst-e-post med onboarding-lenke (no-op uten RESEND_API_KEY).
  try {
    await sendMemberWelcomeEmail({
      email: application.email,
      memberName: application.fullName || application.email,
      tier: tierEmailLabel[tier],
    });
  } catch (err) {
    console.error("Velkomst-e-post feilet:", err);
  }

  return { success: true };
}

/**
 * Avslå en medlemskapssøknad.
 */
export async function rejectMembershipApplication(applicationId: string) {
  await requireAdmin();
  await db
    .update(onPoyntMembershipApplication)
    .set({ status: "rejected", reviewedAt: sql`now()`, updatedAt: sql`now()` })
    .where(eq(onPoyntMembershipApplication.id, applicationId));

  return { success: true };
}
