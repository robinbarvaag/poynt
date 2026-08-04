"use client";

import { Button, Container, Heading, Text } from "@poynt/ui";
import { RefreshCw } from "lucide-react";
import { useEffect } from "react";

/**
 * Feilgrense for hele den offentlige siden — uten denne tar én blokk som
 * kaster ned hele ruten med Next sin nakne standard-feilside.
 */
export default function FrontendError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Frontend-feil:", error);
  }, [error]);

  return (
    <Container size="sm" padding="xl">
      <div className="relative overflow-hidden rounded-3xl border border-border bg-card px-6 py-16 text-center">
        <div className="relative z-10 flex flex-col items-center">
          <div className="mb-6 flex size-20 items-center justify-center rounded-full bg-destructive/10">
            <RefreshCw className="size-9 text-destructive" />
          </div>
          <Heading
            variant="h1"
            color="foreground"
            weight="bold"
            customStyles="mb-3"
          >
            Oi, noe gikk galt
          </Heading>
          <Text variant="muted" customStyles="mb-8 max-w-sm">
            Det skjedde en feil da vi skulle vise denne siden. Prøv igjen — og
            fungerer det fortsatt ikke, setter vi pris på om du sier ifra.
          </Text>
          <Button size="lg" onClick={reset}>
            Prøv igjen
          </Button>
        </div>
      </div>
    </Container>
  );
}
