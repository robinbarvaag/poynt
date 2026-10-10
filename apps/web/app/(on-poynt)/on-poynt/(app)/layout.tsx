import { AppHeader } from "@/components/on-poynt/app-header";
import { AppSidebar } from "@/components/on-poynt/app-sidebar";
import { OnPoyntProviders } from "@/components/on-poynt/providers";
import { ShellTour } from "@/components/on-poynt/shell-tour";
import { getFeatureFlags } from "@/lib/features/server";
import { getSessionWithMembership } from "@/lib/membership";
import { hasActiveAccess } from "@/lib/membership/has-active-access";
import { db, eq } from "@poynt/on-poynt-db";
import { onPoyntUser } from "@poynt/on-poynt-db/schema";
import { SidebarInset, SidebarProvider, Toaster } from "@poynt/ui";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function OnPoyntAppLayout({
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
    .select({ onboardingCompleted: onPoyntUser.onboardingCompleted })
    .from(onPoyntUser)
    .where(eq(onPoyntUser.id, session.user.id))
    .limit(1);

  if (users[0] && !users[0].onboardingCompleted) {
    redirect("/on-poynt/onboarding");
  }

  const features = await getFeatureFlags();

  return (
    <OnPoyntProviders>
      <SidebarProvider>
        <AppSidebar features={features} />
        <SidebarInset>
          <AppHeader />
          <main className="flex-1 p-4 md:p-6">{children}</main>
        </SidebarInset>
        <ShellTour />
        <Toaster />
      </SidebarProvider>
    </OnPoyntProviders>
  );
}
