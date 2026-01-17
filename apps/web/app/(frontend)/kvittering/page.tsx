import { ClearCart } from "@/components/clear-cart";
import { Button } from "@poynt/ui";
import { CheckCircle } from "lucide-react";
import Link from "next/link";

interface Props {
  searchParams: Promise<{ session_id?: string }>;
}

export default async function ReceiptPage({ searchParams }: Props) {
  const { session_id: sessionId } = await searchParams;

  return (
    <div className="max-w-2xl mx-auto text-center py-16">
      <ClearCart />
      <div className="mb-8 flex justify-center">
        <CheckCircle className="h-24 w-24 text-green-500" />
      </div>
      <h1 className="text-4xl font-bold mb-4">Takk for kjøpet!</h1>
      <p className="text-xl text-muted-foreground mb-8">
        Orderen din er bekrefta. Du vil motta ein e-post med detaljar og tilgang
        til kurset ditt.
      </p>
      {sessionId && (
        <p className="text-sm text-muted-foreground mb-8">
          Referanse: {sessionId}
        </p>
      )}
      <div className="flex gap-4 justify-center">
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
