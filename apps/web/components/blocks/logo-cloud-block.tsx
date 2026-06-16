import { getMediaUrl } from "@/lib/media-url";
import { type Logo, LogoCloud } from "@poynt/ui";

interface MediaRef {
  url?: string | null;
}

interface LogoItem {
  name: string;
  image?: MediaRef | string | number | null;
}

interface LogoCloudBlockProps {
  label?: string | null;
  logos?: LogoItem[] | null;
}

/** Mapper Payload-blokken `logoCloud` til LogoCloud i @poynt/ui. */
export function LogoCloudBlock({ label, logos }: LogoCloudBlockProps) {
  const mapped: Logo[] = (logos ?? []).map((l) => {
    const img =
      typeof l.image === "object" && l.image !== null ? l.image : null;
    return { name: l.name, src: img?.url ? getMediaUrl(img.url) : undefined };
  });
  return <LogoCloud label={label ?? undefined} logos={mapped} />;
}
