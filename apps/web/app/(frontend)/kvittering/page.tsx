import { ClearCart } from "@/components/clear-cart";
import { Button, Eyebrow, Heading, Text } from "@poynt/ui";
import Link from "next/link";

interface Props {
  searchParams: Promise<{ session_id?: string }>;
}

export default async function ReceiptPage({ searchParams }: Props) {
  const { session_id: sessionId } = await searchParams;

  return (
    <div className="mx-auto max-w-2xl py-16 text-center">
      <ClearCart />
      <Eyebrow className="mb-4 justify-center text-primary">Bekrefta</Eyebrow>
      <Heading variant="h1" color="foreground" weight="bold">
        Takk for kjøpet!
      </Heading>
      <Text variant="lead" customStyles="mb-8 text-xl">
        Orderen din er bekrefta. Du vil motta ein e-post med detaljar og tilgang
        til kurset ditt.
      </Text>
      {sessionId && (
        <Text variant="muted" customStyles="mb-8">
          Referanse: {sessionId}
        </Text>
      )}
      <div className="flex justify-center gap-4">
        <Link href="/min-side">
          <Button size="lg">Gå til Min side</Button>
        </Link>
        <Link href="/kurs">
          <Button size="lg" variant="outline">
            Sjå fleire kurs
          </Button>
        </Link>
      </div>
    </div>
  );
}
