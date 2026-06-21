import { getSessionWithMembership } from "@/lib/membership";
import { hasActiveAccess } from "@/lib/membership/has-active-access";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@poynt/ui";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoutButton } from "./logout-button";

export const metadata = {
  title: "Medlemskap kreves",
};

export default async function IngenTilgangPage() {
  const headersList = await headers();
  const request = new Request("http://localhost", { headers: headersList });
  const session = await getSessionWithMembership(request);

  // Ikke innlogget → til innlogging. Allerede tilgang → rett inn i appen.
  if (!session) {
    redirect("/on-poynt/innlogging");
  }
  if (hasActiveAccess(session.membership)) {
    redirect("/on-poynt/oversikt");
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Medlemskap kreves</CardTitle>
          <CardDescription>
            Du er logget inn som {session.user.email}, men kontoen har ikke et
            aktivt medlemskap enda.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            On Poynt er for godkjente medlemmer. Har du allerede sendt inn en
            søknad, gir vi deg tilgang så snart medlemskapet er satt opp — du
            kan trygt lukke vinduet og logge inn igjen senere.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild className="w-full">
              <Link href="/bli-medlem">Søk om medlemskap</Link>
            </Button>
            <LogoutButton />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
