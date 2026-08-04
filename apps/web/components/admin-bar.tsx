import {
  AdminBarClient,
  type AdminBarProps,
} from "@/components/admin-bar-client";
import { cookies } from "next/headers";
import { Suspense } from "react";

/**
 * Server-gate for admin-stripa: `payload-token`-cookien er httpOnly, så
 * klienten kan ikke sjekke den selv — uten denne gaten gjorde hver eneste
 * anonyme sidevisning et `/api/users/me`-kall bare for å rendre ingenting.
 * cookies() er runtime-data og leses derfor bak Suspense (cacheComponents).
 * Selve token-verifiseringen skjer fortsatt i klienten.
 */
async function AdminBarGate(props: AdminBarProps) {
  const cookieStore = await cookies();
  if (!cookieStore.has("payload-token")) return null;
  return <AdminBarClient {...props} />;
}

export function AdminBar(props: AdminBarProps) {
  return (
    <Suspense fallback={null}>
      <AdminBarGate {...props} />
    </Suspense>
  );
}
