import { Button, Container, FloatingShapes, Heading, Text } from "@poynt/ui";
import { Compass } from "lucide-react";
import Link from "next/link";

/** Egen 404 i Poynt-drakt — Next sin standard er en naken hvit side. */
export default function NotFound() {
  return (
    <Container size="sm" padding="xl">
      <div className="relative overflow-hidden rounded-3xl border border-border bg-card px-6 py-16 text-center">
        <FloatingShapes variant="subtle" />
        <div className="relative z-10 flex flex-col items-center">
          <div className="mb-6 flex size-20 items-center justify-center rounded-full bg-accent-3/40">
            <Compass className="size-9 text-primary" />
          </div>
          <Heading
            variant="h1"
            color="foreground"
            weight="bold"
            customStyles="mb-3"
          >
            Her var det tomt
          </Heading>
          <Text variant="muted" customStyles="mb-8 max-w-sm">
            Siden du lette etter finnes ikke — den kan være flyttet eller
            slettet. Prøv forsiden, så finner du nok fram.
          </Text>
          <Button size="lg" asChild>
            <Link href="/">Til forsiden</Link>
          </Button>
        </div>
      </div>
    </Container>
  );
}
