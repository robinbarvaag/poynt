import { Button, Heading, Text } from "@poynt/ui";
import Link from "next/link";

export default function PlannerLandingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 py-12">
      <div className="flex flex-col items-center gap-3 text-center">
        <Heading>On Poynt</Heading>
        <Text customStyles="mx-auto max-w-2xl text-center text-muted-foreground">
          Et medlemsområde for gründere og småbedrifter: AI-verktøy vi setter
          opp for deg, kurs, artikler og tips — samlet på ett sted.
        </Text>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button asChild>
          <Link href="/bli-medlem">Søk om medlemskap</Link>
        </Button>

        <Button variant="outline" asChild>
          <Link href="/on-poynt/innlogging">Logg inn</Link>
        </Button>
      </div>

      <Text customStyles="mx-auto max-w-md text-center text-sm text-muted-foreground">
        On Poynt er for medlemmer. Send inn en søknad, så får du tilgang så
        snart medlemskapet ditt er godkjent og satt opp.
      </Text>
    </div>
  );
}
