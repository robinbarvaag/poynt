import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

export type EventTicketStatus =
  | "registered"
  | "waitlisted"
  | "checked_in"
  | "cancelled";

export interface EventTicketProps {
  eventTitle: string;
  /** Ferdig formatert tidspunkt. */
  when: string;
  where?: string;
  name?: string;
  /** «POY-7K3M» — utelates når eventet ikke bruker billetter. */
  code?: string | null;
  /** SVG-markup for QR-koden (generert på serveren). */
  qrSvg?: string | null;
  status: EventTicketStatus;
  waitlistPosition?: number | null;
  /** Knapper/lenker under billetten. */
  children?: ReactNode;
  className?: string;
}

const STATUS = {
  registered: { label: "Påmeldt", className: "bg-accent-3 text-foreground" },
  waitlisted: { label: "Venteliste", className: "bg-accent-1 text-foreground" },
  checked_in: {
    label: "Sjekket inn",
    className: "bg-primary text-primary-foreground",
  },
  cancelled: { label: "Avmeldt", className: "bg-muted text-muted-foreground" },
} as const;

/**
 * Billetten: en ekte billett-form med perforert kant mellom eventet og
 * QR-koden. Avmeldte billetter tones ned og får et stempel, så ingen tror de
 * fortsatt gjelder.
 */
export function EventTicket({
  eventTitle,
  when,
  where,
  name,
  code,
  qrSvg,
  status,
  waitlistPosition,
  children,
  className,
}: EventTicketProps) {
  const statusInfo = STATUS[status];
  const inactive = status === "cancelled";
  const showQr = Boolean(qrSvg) && status !== "waitlisted" && !inactive;

  return (
    <div className={cn("relative mx-auto w-full max-w-md", className)}>
      <div
        className={cn(
          "overflow-hidden rounded-[2rem] bg-card shadow-xl ring-1 ring-border",
          inactive && "opacity-70 grayscale"
        )}
      >
        <div className="bg-primary px-7 pt-7 pb-8 text-primary-foreground">
          <div className="flex items-center justify-between gap-3">
            <span className="font-semibold text-primary-foreground/70 text-xs uppercase tracking-[0.16em]">
              Billett
            </span>
            <span
              className={cn(
                "rounded-full px-3 py-1 font-semibold text-xs",
                statusInfo.className
              )}
            >
              {statusInfo.label}
              {status === "waitlisted" && waitlistPosition
                ? ` · nr. ${waitlistPosition}`
                : ""}
            </span>
          </div>
          <p className="mt-4 text-balance font-bold font-heading text-2xl leading-tight">
            {eventTitle}
          </p>
          <p className="mt-3 text-primary-foreground/85 text-sm leading-relaxed">
            {when}
            {where ? (
              <>
                <br />
                {where}
              </>
            ) : null}
          </p>
        </div>

        {/* Perforeringen: to halvsirkler + stiplet linje. */}
        <div className="relative h-0">
          <span className="-left-4 -translate-y-1/2 absolute top-0 size-8 rounded-full bg-background ring-1 ring-border" />
          <span className="-right-4 -translate-y-1/2 absolute top-0 size-8 rounded-full bg-background ring-1 ring-border" />
          <span className="absolute inset-x-6 top-0 border-border border-t-2 border-dashed" />
        </div>

        <div className="px-7 pt-8 pb-7 text-center">
          {name && (
            <p className="text-muted-foreground text-sm">
              Til <span className="font-semibold text-foreground">{name}</span>
            </p>
          )}
          {showQr && qrSvg && (
            <div
              className="mx-auto mt-4 aspect-square w-52 rounded-2xl bg-white p-2 [&>svg]:h-full [&>svg]:w-full"
              role="img"
              aria-label={code ? `QR-kode for billett ${code}` : "QR-kode"}
              // biome-ignore lint/security/noDangerouslySetInnerHtml: SVG generert av qrcode-biblioteket på serveren, ikke brukerinnhold
              dangerouslySetInnerHTML={{ __html: qrSvg }}
            />
          )}
          {code && !inactive && status !== "waitlisted" && (
            <p className="mt-4 font-bold font-mono text-3xl text-primary tracking-[0.14em]">
              {code}
            </p>
          )}
          {status === "waitlisted" && (
            <p className="mt-2 text-muted-foreground text-sm leading-relaxed">
              Får du plass, dukker QR-koden opp her, og du får den på e-post.
            </p>
          )}
          {children && <div className="mt-6 space-y-3">{children}</div>}
        </div>
      </div>

      {inactive && (
        <span
          aria-hidden="true"
          className="-rotate-12 pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 rounded-xl border-4 border-destructive/70 px-4 py-1 font-bold font-heading text-3xl text-destructive/80 uppercase tracking-widest"
        >
          Avmeldt
        </span>
      )}
    </div>
  );
}
