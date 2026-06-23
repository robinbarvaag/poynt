import { auth } from "@poynt/planner-auth/server";
import { and, db, desc, eq } from "@poynt/planner-db";
import {
  plannerIndustry,
  plannerMembershipApplication,
  plannerUser,
  plannerUserPreferences,
  plannerWorkspace,
  plannerWorkspaceMember,
  plannerWorkspaceProfile,
} from "@poynt/planner-db/schema";
import { type NextRequest, NextResponse } from "next/server";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9æøåä ]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Hent den nyeste godkjente søknaden for brukeren (om noen). */
async function getApprovedApplication(userId: string) {
  const [application] = await db
    .select()
    .from(plannerMembershipApplication)
    .where(
      and(
        eq(plannerMembershipApplication.userId, userId),
        eq(plannerMembershipApplication.status, "approved")
      )
    )
    .orderBy(desc(plannerMembershipApplication.reviewedAt))
    .limit(1);
  return application ?? null;
}

/**
 * Forhåndsutfylte verdier til onboarding-skjemaet (fra godkjent søknad), slik at
 * medlemmet slipper å skrive bedriftsnavnet på nytt.
 */
export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const application = await getApprovedApplication(session.user.id);
  return NextResponse.json({
    companyName: application?.companyName ?? null,
  });
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
    await db.insert(plannerWorkspace).values({
      id: workspaceId,
      name: workspaceName,
      slug,
    });

    // Add user as owner
    await db.insert(plannerWorkspaceMember).values({
      id: crypto.randomUUID(),
      workspaceId,
      userId: session.user.id,
      role: "owner",
    });

    // Set as active workspace
    await db
      .insert(plannerUserPreferences)
      .values({
        id: crypto.randomUUID(),
        userId: session.user.id,
        activeWorkspaceId: workspaceId,
      })
      .onConflictDoUpdate({
        target: plannerUserPreferences.userId,
        set: { activeWorkspaceId: workspaceId },
      });

    // Forhåndsutfyll bedriftsprofilen fra en godkjent søknad, hvis vi har en.
    const application = await getApprovedApplication(session.user.id);
    if (application) {
      // industryId valideres mot planner_industry (skjemaet er redigerbart).
      let industryId: string | null = null;
      if (application.industryId) {
        const [industry] = await db
          .select({ id: plannerIndustry.id })
          .from(plannerIndustry)
          .where(eq(plannerIndustry.id, application.industryId))
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
          .insert(plannerWorkspaceProfile)
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
            target: plannerWorkspaceProfile.workspaceId,
          });
      }
    }

    // Mark onboarding as completed
    await db
      .update(plannerUser)
      .set({ onboardingCompleted: true })
      .where(eq(plannerUser.id, session.user.id));

    return NextResponse.json({ success: true, workspaceId });
  } catch (error) {
    console.error("Error completing onboarding:", error);
    return NextResponse.json(
      { error: "Failed to complete onboarding" },
      { status: 500 }
    );
  }
}
