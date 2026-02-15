import { AppSidebar } from "@/components/planner/app-sidebar";
import { getSessionWithMembership } from "@/lib/membership";
import config from "@/payload.config";
import { SidebarInset, SidebarProvider, Toaster } from "@poynt/ui";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getPayload } from "payload";

export default async function PlannerAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Create Request object from headers for getSessionWithMembership
  const headersList = await headers();
  const request = new Request("http://localhost", { headers: headersList });

  const session = await getSessionWithMembership(request);

  if (!session) {
    redirect("/on-poynt/innlogging");
  }

  // Check if user has active membership and hasn't completed onboarding
  if (
    session.membership.tier !== "none" &&
    session.membership.status === "active"
  ) {
    const payload = await getPayload({ config });

    const result = await payload.find({
      collection: "users",
      where: { email: { equals: session.user.email } },
      limit: 1,
    });

    if (result.docs.length > 0) {
      const user = result.docs[0];
      if (!user.onboardingCompleted) {
        redirect("/on-poynt/onboarding");
      }
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
