import { cn } from "../../lib/utils";

export type DownloadKind = "pdf" | "canva" | "link" | "other";

const kindMeta: Record<DownloadKind, { label: string; icon: string }> = {
  pdf: { label: "PDF", icon: "📄" },
  canva: { label: "Canva", icon: "🎨" },
  link: { label: "Lenke", icon: "🔗" },
  other: { label: "Fil", icon: "📦" },
};

export interface DownloadCardProps {
  title: string;
  description?: string;
  kind?: DownloadKind;
  /** Nedlastings-/ekstern lenke. */
  href?: string;
  className?: string;
}

/**
 * Kort for en nedlastbar ressurs / gratis fil. Type-badge, ikon og en tydelig
 * last-ned-affordans. Lite løft på hover.
 */
export function DownloadCard({
  title,
  description,
  kind = "pdf",
  href,
  className,
}: DownloadCardProps) {
  const meta = kindMeta[kind];
  const isDownload = kind !== "link";
  return (
    <a
      href={href ?? "#"}
      {...(isDownload
        ? { download: true }
        : { target: "_blank", rel: "noopener noreferrer" })}
      className={cn(
        "group/dl flex items-center gap-4 rounded-2xl bg-card p-4 ring-1 ring-foreground/10 transition-[transform,box-shadow] duration-300 motion-safe:hover:-translate-y-0.5 hover:shadow-md",
        className
      )}
    >
      <span
        aria-hidden="true"
        className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl bg-accent-1/40 text-2xl"
      >
        {meta.icon}
      </span>
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="flex items-center gap-2">
          <span className="line-clamp-1 font-heading font-semibold text-foreground">
            {title}
          </span>
          <span className="rounded-full bg-muted px-2 py-0.5 font-medium text-[0.65rem] text-muted-foreground uppercase tracking-wide">
            {meta.label}
          </span>
        </span>
        {description && (
          <span className="line-clamp-1 text-muted-foreground text-sm">
            {description}
          </span>
        )}
      </div>
      <span
        aria-hidden="true"
        className="ml-auto shrink-0 text-muted-foreground transition-transform duration-300 group-hover/dl:translate-y-0.5"
      >
        {isDownload ? "↓" : "→"}
      </span>
    </a>
  );
}
