import { AppSidebar } from "@/components/planner/app-sidebar";
import { getSessionWithMembership } from "@/lib/membership";
import { SidebarInset, SidebarProvider, Toaster } from "@poynt/ui";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

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
