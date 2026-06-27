import { AppHeader } from "@/components/planner/app-header";
import { AppSidebar } from "@/components/planner/app-sidebar";
import { PlannerProviders } from "@/components/planner/providers";
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

  // Tilgangs-gate: innlogging lager/autentiserer kontoen, men sjølve tilgangen
  // krever eit aktivt medlemskap (handterer òg canceled-innanfor-periode og
  // past_due-grace). Utan tilgang sendast brukaren til ei forklaringsside.
  if (!hasActiveAccess(session.membership)) {
    redirect("/on-poynt/ingen-tilgang");
  }

  const users = await db
    .select({ onboardingCompleted: plannerUser.onboardingCompleted })
    .from(plannerUser)
    .where(eq(plannerUser.id, session.user.id))
    .limit(1);

  if (users[0] && !users[0].onboardingCompleted) {
    redirect("/on-poynt/onboarding");
  }

  return (
    <PlannerProviders>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <AppHeader />
          <main className="flex-1 p-4 md:p-6">{children}</main>
        </SidebarInset>
        <Toaster />
      </SidebarProvider>
    </PlannerProviders>
  );
}
