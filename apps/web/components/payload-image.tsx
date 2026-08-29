import { toRelativeMediaUrl } from "@/lib/media-url";
import NextImage, { type ImageProps } from "next/image";

/**
 * Strukturell delmengde av en Payload `Media`-ressurs. Vi tar imot en løs type
 * (ikke hele `Media`-interfacet) slik at også oppslag med `depth` 0/1 og
 * felt-delmengder (`{ url, alt }`) passer uten casting på kallstedet.
 */
export type MediaResource = {
  url?: string | null;
  alt?: string | null;
  width?: number | null;
  height?: number | null;
  /** Fokuspunkt i prosent (0–100). Payload `focalPoint`. */
  focalX?: number | null;
  focalY?: number | null;
  /**
   * Base64 LQIP for `placeholder="blur"`. Payload genererer ikke dette ut av
   * boksen — feltet leses kun hvis en plugin/hook fyller det ut senere.
   */
  blurDataURL?: string | null;
  /**
   * Kreditering for stock-bilder (Pexels/Giphy), satt ved import. Vises via
   * `<MediaCredit>`. Tom for vanlige opplastede bilder.
   */
  creditLine?: string | null;
  /** Lenke til kilden (fotografprofil / Giphy-side) for krediteringen. */
  sourceUrl?: string | null;
  /**
   * Genererte bildestørrelser fra Payload (`upload.imageSizes`). Kun `og`
   * (1200×630-beskjæring for deling) leses her — nevnte nøkler holder typen
   * strukturelt kompatibel med Payloads genererte `Media`-type.
   */
  sizes?: {
    og?: {
      url?: string | null;
      width?: number | null;
      height?: number | null;
    } | null;
  } | null;
};

type MediaInput = MediaResource | number | null | undefined;

/** Trekker ut en Payload-media-ressurs fra et oppslag (ignorerer rene id-er). */
function asResource(media: MediaInput): MediaResource | null {
  return media && typeof media === "object" ? media : null;
}

export { toRelativeMediaUrl };

/**
 * Løser URL-en til et Payload-media direkte fra `.url`, normalisert til
 * host-relativ sti for app-servert media (se `toRelativeMediaUrl`). Bruk denne
 * der et råstreng-`src` trengs (f.eks. når URL-en sendes videre til en
 * `@poynt/ui`-komponent). En allerede-løst streng normaliseres på samme måte.
 */
export function resolveMediaUrl(
  media: MediaInput | string
): string | undefined {
  const url =
    typeof media === "string"
      ? media || undefined
      : (asResource(media)?.url ?? undefined);
  return url ? toRelativeMediaUrl(url) : undefined;
}

export type PayloadImageProps = Omit<ImageProps, "src" | "alt"> & {
  /** Payload-media-objekt (eller `null`/id ved manglende opplasting). */
  media: MediaInput;
  /** Overstyrer alt-teksten fra mediet. */
  alt?: string;
};

/**
 * Intern bilde-komponent for alle Payload-media. Innkapsler URL-løsing,
 * fokuspunkt (→ `object-position`), intrinsiske dimensjoner og valgfri
 * blur-placeholder, så kallstedene slipper å duplisere logikken.
 *
 * Returnerer `null` når mediet mangler — kallstedet håndterer eget tomt-tilfelle.
 */
export function PayloadImage({
  media,
  alt,
  style,
  sizes,
  fill,
  width,
  height,
  ...rest
}: PayloadImageProps) {
  const resource = asResource(media);
  const src = resource?.url ? toRelativeMediaUrl(resource.url) : undefined;
  if (!(resource && src)) {
    return null;
  }

  const resolvedAlt = alt ?? resource.alt ?? "";

  // Fokuspunkt → object-position. Slår kun inn med object-cover/contain, men er
  // ufarlig ellers. Kallstedets egen `style` vinner ved konflikt.
  const mergedStyle =
    resource.focalX != null && resource.focalY != null
      ? {
          objectPosition: `${resource.focalX}% ${resource.focalY}%`,
          ...style,
        }
      : style;

  const blur = resource.blurDataURL
    ? ({ placeholder: "blur", blurDataURL: resource.blurDataURL } as const)
    : {};

  // Hold `fill` og `width`/`height` gjensidig utelukkende — Next krever det.
  const dimensionProps: Partial<ImageProps> = fill
    ? { fill: true, sizes: sizes ?? "100vw" }
    : {
        width: width ?? resource.width ?? undefined,
        height: height ?? resource.height ?? undefined,
        ...(sizes ? { sizes } : {}),
      };

  return (
    <NextImage
      src={src}
      alt={resolvedAlt}
      style={mergedStyle}
      {...blur}
      {...dimensionProps}
      {...rest}
    />
  );
}
