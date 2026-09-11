import Link from "next/link";

/**
 * Forbeholdet angrerettloven § 22 bokstav n krever FØR kjøp av digitalt
 * innhold som leveres umiddelbart: kunden ber uttrykkelig om at leveringen
 * starter med en gang, og erkjenner at angreretten dermed bortfaller. Vises
 * rett under betalingsknappene overalt der et kjøp kan startes (handlekurv,
 * kurv-skuff, produktside). Samme forbehold gjentas i ordrebekreftelsen.
 */
export function CheckoutConsentNotice({
  className = "",
  compact = false,
}: {
  className?: string;
  /** Kortere variant til trange flater (kurv-skuff, sticky kjøpslinje). */
  compact?: boolean;
}) {
  return (
    <p className={`text-muted-foreground text-xs leading-relaxed ${className}`}>
      {compact
        ? "Ved å betale godtar du "
        : "Ved å betale ber du om umiddelbar levering av digitalt innhold og godtar at angreretten bortfaller, jf. "}
      <Link
        href="/kjopsbetingelser"
        className="underline underline-offset-2 hover:text-foreground"
      >
        kjøpsbetingelsene
      </Link>
      {compact ? " og at angreretten bortfaller ved umiddelbar levering." : "."}{" "}
      Les om behandling av personopplysninger i{" "}
      <Link
        href="/personvern"
        className="underline underline-offset-2 hover:text-foreground"
      >
        personvernerklæringen
      </Link>
      .
    </p>
  );
}
