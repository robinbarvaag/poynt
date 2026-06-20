import {
  type MediaResource,
  resolveMediaUrl,
} from "@/components/payload-image";
import { type Logo, LogoCloud } from "@poynt/ui";

interface LogoItem {
  name: string;
  image?: MediaResource | string | number | null;
}

interface LogoCloudBlockProps {
  label?: string | null;
  logos?: LogoItem[] | null;
}

/** Mapper Payload-blokken `logoCloud` til LogoCloud i @poynt/ui. */
export function LogoCloudBlock({ label, logos }: LogoCloudBlockProps) {
  const mapped: Logo[] = (logos ?? []).map((l) => ({
    name: l.name,
    src: resolveMediaUrl(l.image),
  }));
  return <LogoCloud label={label ?? undefined} logos={mapped} />;
}
