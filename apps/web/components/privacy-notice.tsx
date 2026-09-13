import Link from "next/link";

/**
 * Kort personverninfo der vi samler inn personopplysninger (GDPR art. 13):
 * hva opplysningene brukes til + lenke til personvernerklæringen. Arver
 * tekstfargen fra flaten, så den fungerer både på lyse og fargede bånd.
 */
export function PrivacyNotice({
  purpose,
  className = "",
}: {
  /** Én setning om formålet, f.eks. «Vi bruker e-posten kun til nyhetsbrevet.» */
  purpose: string;
  className?: string;
}) {
  return (
    <p className={`text-xs leading-relaxed opacity-75 ${className}`}>
      {purpose} Les mer i{" "}
      <Link
        href="/personvern"
        target="_blank"
        className="underline underline-offset-2 hover:opacity-100"
      >
        personvernerklæringen
      </Link>
      .
    </p>
  );
}
