import Link from "next/link";

/**
 * Informasjonslinje under betalingsknappene på produktsiden. Selve
 * samtykket (angrerettloven § 22 bokstav n) gis aktivt i
 * CheckoutConsentCheckbox — i handlekurven, eller i CheckoutConsentDialog
 * som Vipps-knappen åpner her. Denne linja forbereder kunden på det og
 * lenker til vilkårene. Samme forbehold gjentas i ordrebekreftelsen.
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
        ? "Før betaling bekrefter du "
        : "Digitalt innhold leveres umiddelbart. Før betaling bekrefter du at du ber om det, og at angreretten bortfaller, jf. "}
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
