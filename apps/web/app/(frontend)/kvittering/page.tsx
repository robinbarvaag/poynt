import { ClearCart } from "@/components/clear-cart";
import { Button, Eyebrow, Heading, Text } from "@poynt/ui";
import { Check } from "lucide-react";
import Link from "next/link";

interface Props {
  searchParams: Promise<{ session_id?: string }>;
}

// Kvitteringen er toppunktet av kjøpsreisen — her brukes delight-budsjettet:
// ikonet popper inn (animate-success-pop), og tekstlinjene følger i en rolig
// trapp. Alt er ren CSS (motion-safe + fill-mode-both), så siden forblir en
// server-komponent og respekterer redusert bevegelse.
const STEP =
  "motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:animate-in motion-safe:fill-mode-both motion-safe:duration-500 motion-safe:ease-soft";

export default async function ReceiptPage({ searchParams }: Props) {
  const { session_id: sessionId } = await searchParams;

  return (
    <div className="mx-auto max-w-2xl py-16 text-center">
      <ClearCart />
      <div className="mb-6 flex justify-center">
        <span className="animate-success-pop flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Check className="size-8" strokeWidth={2.5} />
        </span>
      </div>
      <div className={STEP}>
        <Eyebrow className="mb-4 justify-center text-primary">
          Bekreftet
        </Eyebrow>
        <Heading variant="h1" color="foreground" weight="bold">
          Takk for kjøpet!
        </Heading>
      </div>
      <div className={`${STEP} motion-safe:delay-150`}>
        <Text variant="lead" customStyles="mb-8 text-xl">
          Ordren din er bekreftet. Du vil motta en e-post med detaljer og
          tilgang til kurset ditt.
        </Text>
        {sessionId && (
          <Text variant="muted" customStyles="mb-8">
            Referanse: {sessionId}
          </Text>
        )}
      </div>
      <div
        className={`${STEP} flex justify-center gap-4 motion-safe:delay-300`}
      >
        <Link href="/min-side">
          <Button size="lg">Gå til Min side</Button>
        </Link>
        <Link href="/kurs">
          <Button size="lg" variant="outline">
            Se flere kurs
          </Button>
        </Link>
      </div>
    </div>
  );
}

// Kvitteringen nås via Stripe-redirect (aldri Link-navigasjon) og leser
// searchParams per forespørsel — server-bundet navigasjon er greit her.
export const instant = false;
