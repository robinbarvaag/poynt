import { auth } from "@poynt/planner-auth/server";
import { db, eq } from "@poynt/planner-db";
import { plannerUser } from "@poynt/planner-db/schema";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Update onboardingCompleted on Drizzle user
    await db
      .update(plannerUser)
      .set({ onboardingCompleted: true })
      .where(eq(plannerUser.id, session.user.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error completing onboarding:", error);
    return NextResponse.json(
      { error: "Failed to complete onboarding" },
      { status: 500 }
    );
  }
}
