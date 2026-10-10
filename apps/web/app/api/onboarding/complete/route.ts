import { getSessionWithMembership } from "@/lib/membership";
import { hasActiveAccess } from "@/lib/membership/has-active-access";
import { and, db, desc, eq } from "@poynt/on-poynt-db";
import {
  onPoyntIndustry,
  onPoyntMembershipApplication,
  onPoyntUser,
  onPoyntUserPreferences,
  onPoyntWorkspace,
  onPoyntWorkspaceMember,
  onPoyntWorkspaceProfile,
} from "@poynt/on-poynt-db/schema";
import { type NextRequest, NextResponse } from "next/server";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9æøåä ]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Onboarding er steget ETTER tilgang: innlogget uten aktivt medlemskap skal
 * ikke kunne opprette workspace her (app-layouten stopper dem i UI-et, men
 * ruta må holde samme linje).
 */
async function requireMemberSession(req: NextRequest) {
  const session = await getSessionWithMembership(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!hasActiveAccess(session.membership)) {
    return NextResponse.json(
      { error: "Krever aktivt medlemskap" },
      { status: 403 }
    );
  }
  return session;
}

/** Hent den nyeste godkjente søknaden for brukeren (om noen). */
async function getApprovedApplication(userId: string) {
  const [application] = await db
    .select()
    .from(onPoyntMembershipApplication)
    .where(
      and(
        eq(onPoyntMembershipApplication.userId, userId),
        eq(onPoyntMembershipApplication.status, "approved")
      )
    )
    .orderBy(desc(onPoyntMembershipApplication.reviewedAt))
    .limit(1);
  return application ?? null;
}

/**
 * Forhåndsutfylte verdier til onboarding-skjemaet (fra godkjent søknad), slik at
 * medlemmet slipper å skrive bedriftsnavnet på nytt.
 */
export async function GET(req: NextRequest) {
  const session = await requireMemberSession(req);
  if (session instanceof NextResponse) return session;

  const application = await getApprovedApplication(session.user.id);
  return NextResponse.json({
    companyName: application?.companyName ?? null,
  });
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireMemberSession(req);
    if (session instanceof NextResponse) return session;

    const body = await req.json().catch(() => ({}));
    const workspaceName = body.workspaceName?.trim();

    if (!workspaceName) {
      return NextResponse.json(
        { error: "Workspace name is required" },
        { status: 400 }
      );
    }

    const workspaceId = crypto.randomUUID();
    const slug = `${slugify(workspaceName)}-${workspaceId.slice(0, 6)}`;

    // Create workspace
    await db.insert(onPoyntWorkspace).values({
      id: workspaceId,
      name: workspaceName,
      slug,
    });

    // Add user as owner
    await db.insert(onPoyntWorkspaceMember).values({
      id: crypto.randomUUID(),
      workspaceId,
      userId: session.user.id,
      role: "owner",
    });

    // Set as active workspace
    await db
      .insert(onPoyntUserPreferences)
      .values({
        id: crypto.randomUUID(),
        userId: session.user.id,
        activeWorkspaceId: workspaceId,
      })
      .onConflictDoUpdate({
        target: onPoyntUserPreferences.userId,
        set: { activeWorkspaceId: workspaceId },
      });

    // Forhåndsutfyll bedriftsprofilen fra en godkjent søknad, hvis vi har en.
    const application = await getApprovedApplication(session.user.id);
    if (application) {
      // industryId valideres mot industry (skjemaet er redigerbart).
      let industryId: string | null = null;
      if (application.industryId) {
        const [industry] = await db
          .select({ id: onPoyntIndustry.id })
          .from(onPoyntIndustry)
          .where(eq(onPoyntIndustry.id, application.industryId))
          .limit(1);
        industryId = industry?.id ?? null;
      }

      const hasProfileData =
        industryId ||
        application.companySize ||
        application.audienceType ||
        application.targetAudience ||
        application.aboutCompany;

      if (hasProfileData) {
        await db
          .insert(onPoyntWorkspaceProfile)
          .values({
            id: crypto.randomUUID(),
            workspaceId,
            industryId,
            companySize: application.companySize ?? null,
            audienceType: application.audienceType ?? null,
            targetAudience: application.targetAudience ?? null,
            customContext: application.aboutCompany ?? null,
          })
          .onConflictDoNothing({
            target: onPoyntWorkspaceProfile.workspaceId,
          });
      }
    }

    // Mark onboarding as completed
    await db
      .update(onPoyntUser)
      .set({ onboardingCompleted: true })
      .where(eq(onPoyntUser.id, session.user.id));

    return NextResponse.json({ success: true, workspaceId });
  } catch (error) {
    console.error("Error completing onboarding:", error);
    return NextResponse.json(
      { error: "Failed to complete onboarding" },
      { status: 500 }
    );
  }
}
