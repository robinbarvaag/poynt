import { DraggableDigits } from "@/components/not-found/draggable-digits";
import { Excuses } from "@/components/not-found/excuses";
import { LostScene } from "@/components/not-found/lost-scene";
import { Button, Eyebrow, Heading, Text } from "@poynt/ui";
import { ArrowLeft, Mail, ShoppingBag } from "lucide-react";
import Link from "next/link";

/**
 * 404 i Poynt-drakt: full-bredde scene der siden bokstavelig talt har stukket
 * av. Klistremerkene følger musepekeren, sifrene kan dras rundt, og
 * forklaringene roterer. Alt pynt er aria-hidden — skjermlesere får bare
 * overskrift, forklaring og lenkene.
 */
export default function NotFound() {
  return (
    <LostScene>
      <Eyebrow>Feil 404</Eyebrow>
      <div className="mt-6 mb-8">
        <DraggableDigits />
      </div>
      <Heading
        variant="h1"
        color="foreground"
        weight="bold"
        customStyles="text-balance text-3xl sm:text-5xl"
      >
        Denne siden har stukket av
      </Heading>
      <Text variant="muted" customStyles="mt-4 max-w-md text-balance">
        Adressen finnes ikke lenger, eller har aldri gjort det. Vi har sendt ut
        søk, men i mellomtiden finner du nok fram herfra.
      </Text>
      <div className="mt-4">
        <Excuses />
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button size="lg" asChild>
          <Link href="/">
            <ArrowLeft />
            Til forsiden
          </Link>
        </Button>
        <Button size="lg" variant="salmon" asChild>
          <Link href="/produkter">
            <ShoppingBag />
            Se produktene
          </Link>
        </Button>
        <Button size="lg" variant="outline" asChild>
          <Link href="/kontakt?kilde=404">
            <Mail />
            Si ifra
          </Link>
        </Button>
      </div>
      <Text variant="muted" customStyles="mt-10 hidden text-xs sm:block">
        Psst: sifrene kan dras. Klistremerkene følger etter deg.
      </Text>
    </LostScene>
  );
}
