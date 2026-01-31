import { auth } from "@poynt/planner-auth/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function PlannerAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/planner/login");
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar will be added from components/planner */}
      <main className="flex-1">{children}</main>
    </div>
  );
}
