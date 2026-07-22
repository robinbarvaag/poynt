import { type Stat, StatsBand } from "@poynt/ui";
import Link from "next/link";

interface StatItem {
  value: number;
  prefix?: string | null;
  suffix?: string | null;
  label: string;
}

interface StatsBandBlockProps {
  eyebrow?: string | null;
  title?: string | null;
  description?: string | null;
  cta?: { text?: string | null; url?: string | null } | null;
  layout?: "band" | "split" | null;
  variant?: "primary" | "salmon" | "saffron" | null;
  stats?: StatItem[] | null;
}

/** Mapper Payload-blokken `statsBand` til StatsBand i @poynt/ui. */
export function StatsBandBlock({
  eyebrow,
  title,
  description,
  cta,
  layout,
  variant,
  stats,
}: StatsBandBlockProps) {
  const mapped: Stat[] = (stats ?? []).map((s) => ({
    value: s.value,
    prefix: s.prefix ?? undefined,
    suffix: s.suffix ?? undefined,
    label: s.label,
  }));
  return (
    <StatsBand
      eyebrow={eyebrow ?? undefined}
      title={title ?? undefined}
      description={description ?? undefined}
      cta={
        cta?.text && cta?.url ? { text: cta.text, href: cta.url } : undefined
      }
      layout={layout ?? undefined}
      variant={variant ?? undefined}
      stats={mapped}
      renderLink={(href, children) => <Link href={href}>{children}</Link>}
    />
  );
}
