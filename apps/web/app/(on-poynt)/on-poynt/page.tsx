import { Button, Heading, Text } from "@poynt/ui";
import Link from "next/link";

export default function PlannerLandingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <Heading>On Poynt</Heading>
      <Text className="mx-auto max-w-2xl text-center">
        AI-drevne markedsføringsverktøy for gründere og småbedrifter. Få
        personlige anbefalinger, markedsplaner og innholdsstrategier.
      </Text>
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
        <Button asChild>
          <Link href="/on-poynt/registrer">Kom i gang gratis</Link>
        </Button>

        <Button variant={"secondary"} asChild>
          <Link href="/on-poynt/innlogging">Logg inn</Link>
        </Button>
      </div>
    </div>
  );
}
