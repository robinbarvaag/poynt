import { type Stat, StatsBand } from "@poynt/ui";

interface StatItem {
  value: number;
  prefix?: string | null;
  suffix?: string | null;
  label: string;
}

interface StatsBandBlockProps {
  eyebrow?: string | null;
  title?: string | null;
  variant?: "primary" | "salmon" | "saffron" | null;
  stats?: StatItem[] | null;
}

/** Mapper Payload-blokken `statsBand` til StatsBand i @poynt/ui. */
export function StatsBandBlock({
  eyebrow,
  title,
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
      variant={variant ?? undefined}
      stats={mapped}
    />
  );
}
