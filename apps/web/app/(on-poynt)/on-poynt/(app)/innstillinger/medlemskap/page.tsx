import { getSessionWithMembership } from "@/lib/membership";
import { Button } from "@poynt/ui";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  PageHeader,
  PageShell,
} from "@poynt/ui";
import { Icon } from "@poynt/ui/icons";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PortalButton } from "./portal-button";

export default async function MembershipSettingsPage() {
  // Get session with membership data
  const headersList = await headers();
  const request = new Request("http://localhost", { headers: headersList });
  const session = await getSessionWithMembership(request);

  if (!session) {
    redirect("/on-poynt/innlogging");
  }

  const { membership } = session;

  // Map tier to display name
  const tierDisplayName =
    membership.tier === "community"
      ? "Community"
      : membership.tier === "community_ai"
        ? "Community + AI"
        : "Ingen medlemskap";

  // Map status to Norwegian display text and color
  const statusInfo = {
    active: { label: "Aktiv", color: "bg-green-100 text-green-800" },
    inactive: { label: "Inaktiv", color: "bg-muted text-muted-foreground" },
    canceled: { label: "Kansellert", color: "bg-red-100 text-red-800" },
    past_due: { label: "Forfalt", color: "bg-amber-100 text-amber-800" },
  };

  const status = statusInfo[membership.status];

  // Check if user has no membership
  const hasNoMembership = membership.tier === "none";
  const hasCanceledMembership =
    membership.status === "canceled" && !hasNoMembership;

  return (
    <PageShell>
      <PageHeader
        title="Medlemskap"
        description="Administrer ditt On Poynt-medlemskap og abonnement."
      />

      {/* No Membership State */}
      {hasNoMembership && (
        <Card>
          <CardHeader>
            <CardTitle>Du har ikke et aktivt medlemskap</CardTitle>
            <CardDescription>
              Få tilgang til On Poynt med alle funksjoner ved å bli medlem i
              dag.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/produkter">Se medlemskapspriser</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Canceled Membership State */}
      {hasCanceledMembership && (
        <Card className="border-red-200 bg-red-50/50">
          <CardHeader>
            <CardTitle className="text-red-900">
              Ditt abonnement er kansellert
            </CardTitle>
            <CardDescription className="text-red-700">
              Du har tilgang til periodens slutt. Etter det mister du tilgang
              til On Poynt-funksjonene.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/produkter">
                <Icon name="refresh" className="mr-2 size-4" />
                Reaktiver medlemskap
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Active Membership Display */}
      {!hasNoMembership && (
        <Card>
          <CardHeader className="border-b">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-2xl">{tierDisplayName}</CardTitle>
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${status.color}`}
                  >
                    {status.label}
                  </span>
                </div>
                {membership.stripeSubscriptionId && (
                  <p className="text-xs text-muted-foreground">
                    Subscription ID: {membership.stripeSubscriptionId}
                  </p>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6 space-y-6">
            {/* Membership Features */}
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground">
                Inkludert i ditt medlemskap
              </h3>
              <ul className="space-y-2">
                <li className="flex items-center gap-3">
                  <Icon name="check" className="size-5 text-green-600" />
                  <span className="text-sm text-muted-foreground">
                    Tilgang til alle artikler og guider
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <Icon name="check" className="size-5 text-green-600" />
                  <span className="text-sm text-muted-foreground">
                    Kanalveileder for markedsføring
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <Icon name="check" className="size-5 text-green-600" />
                  <span className="text-sm text-muted-foreground">
                    Månedlig markedsplan
                  </span>
                </li>
                {membership.tier === "community_ai" && (
                  <li className="flex items-center gap-3">
                    <Icon name="check" className="size-5 text-primary" />
                    <span className="text-sm font-medium text-foreground">
                      AI-assistert markedsføringsplanlegging
                    </span>
                  </li>
                )}
              </ul>
            </div>

            {/* Manage Subscription Button */}
            {membership.stripeCustomerId && membership.status === "active" && (
              <div className="pt-4 border-t">
                <PortalButton />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle>Trenger du hjelp?</CardTitle>
          <CardDescription>
            Har du spørsmål om medlemskapet ditt? Vi er her for å hjelpe.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button variant="outline" asChild>
              <a href="mailto:support@poynt.no">
                <Icon name="mail" className="mr-2 size-4" />
                Kontakt support
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </PageShell>
  );
}
