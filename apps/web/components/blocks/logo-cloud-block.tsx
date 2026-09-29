import {
  type MediaResource,
  pickImageSource,
} from "@/components/payload-image";
import { type Logo, LogoCloud } from "@poynt/ui";
import { getImageProps } from "next/image";

interface LogoItem {
  name: string;
  image?: MediaResource | string | number | null;
}

interface LogoCloudBlockProps {
  label?: string | null;
  logos?: LogoItem[] | null;
}

/** Logoene vises maks 120 CSS-px brede (se `LogoCloud`). */
const LOGO_WIDTH = 120;

/**
 * Sender logoen gjennom bildeoptimaliseringen i 2x-bredde, fra `sizes.large`
 * i stedet for originalen — en rå logo-opplasting kan være flere tusen piksler
 * og hundrevis av KB.
 */
function logoSrc(image: LogoItem["image"]): string | undefined {
  if (typeof image !== "object" || image === null) return undefined;
  const source = pickImageSource(image);
  if (!source) return undefined;
  const ratio =
    image.width && image.height ? image.width / image.height : undefined;
  const { props } = getImageProps({
    src: source.src,
    alt: "",
    width: LOGO_WIDTH,
    height: Math.round(LOGO_WIDTH / (ratio ?? 3)),
  });
  return props.src;
}

/** Mapper Payload-blokken `logoCloud` til LogoCloud i @poynt/ui. */
export function LogoCloudBlock({ label, logos }: LogoCloudBlockProps) {
  const mapped: Logo[] = (logos ?? []).map((l) => ({
    name: l.name,
    src: logoSrc(l.image),
  }));
  return <LogoCloud label={label ?? undefined} logos={mapped} />;
}
