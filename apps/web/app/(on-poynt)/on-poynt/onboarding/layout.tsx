import { getSessionWithMembership } from "@/lib/membership";
import { hasActiveAccess } from "@/lib/membership/has-active-access";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Samme port som (app)/layout.tsx: onboarding er for innloggede med aktivt
 * medlemskap. Uten gate kunne hvem som helst med konto starte onboardingen
 * direkte på URL-en.
 */
export default async function OnboardingLayout({
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
  if (!hasActiveAccess(session.membership)) {
    redirect("/on-poynt/ingen-tilgang");
  }

  return children;
}
