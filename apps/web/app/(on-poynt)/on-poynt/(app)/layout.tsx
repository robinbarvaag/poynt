import { AppSidebar } from "@/components/planner/app-sidebar";
import { getSessionWithMembership } from "@/lib/membership";
import { hasActiveAccess } from "@/lib/membership/has-active-access";
import { db, eq } from "@poynt/planner-db";
import { plannerUser } from "@poynt/planner-db/schema";
import { SidebarInset, SidebarProvider, Toaster } from "@poynt/ui";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function PlannerAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const request = new Request("http://localhost", { headers: headersList });

  const session = await getSessionWithMembership(request);

  if (!session) {
    redirect("/on-poynt/innlogging");
  }

  // Check if user has active access (handles canceled-but-within-period and past_due grace period)
  if (hasActiveAccess(session.membership)) {
    const users = await db
      .select({ onboardingCompleted: plannerUser.onboardingCompleted })
      .from(plannerUser)
      .where(eq(plannerUser.id, session.user.id))
      .limit(1);

    if (users[0] && !users[0].onboardingCompleted) {
      redirect("/on-poynt/onboarding");
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </SidebarInset>
      <Toaster />
    </SidebarProvider>
  );
}
