import { getSessionWithMembership } from "@/lib/membership";
import { hasActiveAccess } from "@/lib/membership/has-active-access";
import { Button, Icon } from "@poynt/ui";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

/**
 * Server component that gates AI tools behind community_ai tier.
 * Shows upgrade message for community-tier users.
 * Shows status banners for canceled/past_due users.
 */
export async function TierGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const request = new Request("http://localhost", { headers: headersList });
  const session = await getSessionWithMembership(request);

  if (!session || !hasActiveAccess(session.membership)) {
    redirect("/on-poynt/innlogging");
  }

  const { tier, status, currentPeriodEnd } = session.membership;

  // community-tier: show upgrade prompt
  if (tier !== "community_ai") {
    return <UpgradePrompt />;
  }

  // community_ai: show banners if needed, then children
  return (
    <>
      {status === "canceled" && currentPeriodEnd && (
        <CanceledBanner periodEnd={currentPeriodEnd} />
      )}
      {status === "past_due" && <PastDueBanner />}
      {children}
    </>
  );
}

function UpgradePrompt() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="max-w-md space-y-6">
        <div className="flex justify-center">
          <div className="rounded-full bg-primary/10 p-4">
            <Icon name="sparkles" className="h-10 w-10 text-primary" />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight">
            AI-verktøy krev Community AI
          </h2>
          <p className="text-muted-foreground">
            Dette verktøyet er tilgjengeleg for Community AI-medlemmer.
            Oppgrader abonnementet ditt for å få tilgang til alle AI-verktøya.
          </p>
        </div>
        <div className="rounded-lg border bg-muted/50 p-4 text-sm text-left space-y-2">
          <p className="font-medium">Community AI inkluderer:</p>
          <ul className="space-y-1 text-muted-foreground">
            <li className="flex items-center gap-2">
              <Icon name="check" className="h-4 w-4 text-primary shrink-0" />
              Kanalveileder — finn beste marknadskanalar
            </li>
            <li className="flex items-center gap-2">
              <Icon name="check" className="h-4 w-4 text-primary shrink-0" />
              Markedsplan-generator
            </li>
            <li className="flex items-center gap-2">
              <Icon name="check" className="h-4 w-4 text-primary shrink-0" />
              Si nei med stil — høflige avslag
            </li>
            <li className="flex items-center gap-2">
              <Icon name="check" className="h-4 w-4 text-primary shrink-0" />
              Årshjul — innhaldskalender
            </li>
            <li className="flex items-center gap-2">
              <Icon name="check" className="h-4 w-4 text-primary shrink-0" />
              Podcast til innhald (Whisper AI)
            </li>
          </ul>
        </div>
        <Button asChild size="lg" className="w-full">
          <Link href="/on-poynt/innstillinger/medlemskap">
            Oppgrader abonnement
          </Link>
        </Button>
      </div>
    </div>
  );
}

function CanceledBanner({ periodEnd }: { periodEnd: Date }) {
  const formattedDate = periodEnd.toLocaleDateString("nb-NO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm">
      <Icon
        name="alert-triangle"
        className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5"
      />
      <span className="text-amber-800 dark:text-amber-200">
        Abonnementet ditt er kansellert og avsluttes{" "}
        <strong>{formattedDate}</strong>. Du har framleis tilgang til då.{" "}
        <Link
          href="/on-poynt/innstillinger/medlemskap"
          className="underline underline-offset-2"
        >
          Forny abonnement
        </Link>
      </span>
    </div>
  );
}

function PastDueBanner() {
  return (
    <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm">
      <Icon
        name="alert-triangle"
        className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5"
      />
      <span className="text-red-800 dark:text-red-200">
        Betalinga for abonnementet ditt har feila. Vi prøver på nytt automatisk.{" "}
        <Link
          href="/on-poynt/innstillinger/medlemskap"
          className="underline underline-offset-2"
        >
          Oppdater betalingsmetode
        </Link>
      </span>
    </div>
  );
}
