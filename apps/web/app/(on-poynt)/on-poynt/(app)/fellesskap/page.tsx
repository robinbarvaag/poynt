import { CommunityClient } from "@/components/community/community-client";
import { requireFeature } from "@/lib/features/server";
import { auth } from "@poynt/planner-auth/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export const metadata = {
  title: "Fellesskap",
};

/**
 * Medlemsfellesskapet — den globale meldingsflaten (kanaler, grupper, DM).
 * Tilgang er allerede gated av `(app)`-layouten (krever aktivt medlemskap).
 * Chatten fyller hele flaten, så vi hopper over `PageShell` og gir en fast
 * høyde basert på viewporten minus header/padding.
 */
export default async function FellesskapPage() {
  await requireFeature("fellesskap");
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/on-poynt/innlogging");
  }

  return (
    <div className="h-[calc(100dvh-7rem)] min-h-[28rem]">
      <Suspense>
        <CommunityClient
          currentUser={{
            id: session.user.id,
            name: session.user.name,
            image: session.user.image ?? null,
          }}
        />
      </Suspense>
    </div>
  );
}
