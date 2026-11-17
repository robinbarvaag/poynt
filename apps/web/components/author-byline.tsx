import { PayloadImage } from "@/components/payload-image";
import { ABOUT_PATH, type FounderInfo } from "@/lib/structured-data";
import { Text } from "@poynt/ui";
import Link from "next/link";

/**
 * Liten forfatterlinje på blogginnlegg og kundehistorier: portrett, navn
 * (lenke til «Om»-siden) og tittel. Henter alt fra «Grunnlegger / daglig
 * leder» i Nettsted-innstillinger → Bedrift — samme kilde som forfatteren i
 * JSON-LD-en, så det søkemotorene får oppgitt også står synlig på siden.
 *
 * Uten navn i innstillingene rendres bare `children` (f.eks. datoen).
 */
export function AuthorByline({
  founder,
  children,
}: {
  founder: FounderInfo | null | undefined;
  /** Ekstra linje under navnet, f.eks. publiseringsdato. */
  children?: React.ReactNode;
}) {
  const name = founder?.name?.trim();
  if (!name) {
    return children ? <Text variant="muted">{children}</Text> : null;
  }
  const portrait =
    founder?.image && typeof founder.image === "object" ? founder.image : null;
  const jobTitle = founder?.jobTitle?.trim();

  return (
    <div className="flex items-center gap-3">
      {portrait?.url && (
        <span className="relative size-12 shrink-0 overflow-hidden rounded-full bg-muted">
          <PayloadImage
            media={portrait}
            alt=""
            fill
            sizes="48px"
            className="object-cover"
          />
        </span>
      )}
      <div className="flex flex-col gap-1">
        <Text customStyles="text-sm">
          Skrevet av{" "}
          <Link
            href={ABOUT_PATH}
            rel="author"
            className="font-semibold text-foreground underline underline-offset-4 hover:text-primary"
          >
            {name}
          </Link>
        </Text>
        {(jobTitle || children) && (
          <Text variant="muted">
            {jobTitle}
            {jobTitle && children ? " · " : null}
            {children}
          </Text>
        )}
      </div>
    </div>
  );
}
