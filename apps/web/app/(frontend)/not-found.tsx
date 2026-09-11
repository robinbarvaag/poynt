import { LostScene } from "@/components/not-found/lost-scene";
import { Button, Eyebrow, Heading, Text } from "@poynt/ui";
import Link from "next/link";

/**
 * 404 i Poynt-drakt. Rolig side; det eneste lille påfunnet er et par
 * klistremerker som følger musepekeren (kun med mus, aldri ved
 * prefers-reduced-motion). Pynten er aria-hidden.
 */
export default function NotFound() {
  return (
    <LostScene>
      <Eyebrow>Feil 404</Eyebrow>
      <p
        aria-hidden="true"
        className="mt-6 font-extrabold font-heading text-[clamp(5rem,16vw,9rem)] text-primary leading-none tracking-tight"
      >
        404
      </p>
      <Heading
        variant="h1"
        color="foreground"
        weight="bold"
        customStyles="mt-6 text-balance text-3xl sm:text-4xl"
      >
        Denne siden har stukket av
      </Heading>
      <Text variant="muted" customStyles="mt-4 max-w-md text-balance">
        Adressen finnes ikke lenger, eller har aldri gjort det. Forsiden er et
        trygt sted å starte.
      </Text>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button size="lg" asChild>
          <Link href="/">Til forsiden</Link>
        </Button>
        <Button size="lg" variant="ghost" asChild>
          <Link href="/kontakt?kilde=404">Si ifra om en død lenke</Link>
        </Button>
      </div>
    </LostScene>
  );
}
