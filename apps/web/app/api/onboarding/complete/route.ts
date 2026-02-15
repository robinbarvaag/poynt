import config from "@/payload.config";
import { auth } from "@poynt/planner-auth/server";
import { getPayload } from "payload";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    // Get authenticated session
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await getPayload({ config });

    // Find user by email
    const result = await payload.find({
      collection: "users",
      where: { email: { equals: session.user.email } },
      limit: 1,
    });

    if (result.docs.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = result.docs[0];

    // Update onboardingCompleted field
    await payload.update({
      collection: "users",
      id: user.id,
      data: {
        onboardingCompleted: true,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error completing onboarding:", error);
    return NextResponse.json(
      { error: "Failed to complete onboarding" },
      { status: 500 }
    );
  }
}
