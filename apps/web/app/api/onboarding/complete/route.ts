import { auth } from "@poynt/planner-auth/server";
import { db, eq } from "@poynt/planner-db";
import {
  plannerUser,
  plannerUserPreferences,
  plannerWorkspace,
  plannerWorkspaceMember,
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
