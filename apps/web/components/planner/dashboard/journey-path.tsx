import { Button, Card, Eyebrow, cn } from "@poynt/ui";
import { Icon, type IconName } from "@poynt/ui/icons";
import Link from "next/link";

export type StageStatus = "done" | "active" | "upcoming";
export type StageSurface = "mint" | "saffron" | "salmon" | "primary";

export interface JourneyStage {
  /** Hvor i reisen står brukeren med denne fasen. */
  status: StageStatus;
  /** Merkefargen som koder fasen (mint → saffron → salmon → primary). */
  surface: StageSurface;
  icon: IconName;
  /** Fasenummer (sekvensen er ekte, så nummerering bærer informasjon). */
  step: number;
  title: string;
  /** Hva fasen gir deg — i klartekst. */
  payoff: string;
  href: string;
  /** Knappetekst på den aktive fasen (den eneste tydelige CTA-en i raden). */
  cta?: string;
  /** Kort status: «Profilen er fylt» (done) eller «Etter forrige steg» (upcoming). */
  meta?: string;
}

export interface JourneyPathProps {
  eyebrow?: string;
  title?: string;
  stages: JourneyStage[];
}

// Hver fase har sin merkefarge. Fargene leses som et spektrum på tvers av raden
// — fargen betyr framdrift, ikke pynt. Bare den aktive fasen får full styrke.
const SURFACE: Record<
  StageSurface,
  { cap: string; node: string; ring: string }
> = {
  mint: { cap: "bg-mint", node: "bg-mint text-foreground", ring: "ring-mint" },
  saffron: {
    cap: "bg-saffron",
    node: "bg-saffron text-foreground",
    ring: "ring-saffron",
  },
  salmon: {
    cap: "bg-salmon",
    node: "bg-salmon text-foreground",
    ring: "ring-salmon",
  },
  primary: {
    cap: "bg-primary",
    node: "bg-primary text-primary-foreground",
    ring: "ring-primary",
  },
};

/**
 * Den guidede veien gjennom oppsettet — signaturen på dashbordet. Fire faser
 * vist som et fargespektrum, der vi alltid framhever ÉN aktiv fase med en
 * tydelig handling, mens ferdige faser er rolige og kommende faser er dempet.
 * Svarer på «hva gjør jeg først, så, så» uten å hindre den som vil hoppe.
 */
export function JourneyPath({ eyebrow, title, stages }: JourneyPathProps) {
  return (
    <section className="space-y-5">
      {(eyebrow || title) && (
        <div className="space-y-1.5">
          {eyebrow && <Eyebrow marker>{eyebrow}</Eyebrow>}
          {title && (
            <h2 className="font-heading font-semibold text-xl">{title}</h2>
          )}
        </div>
      )}

      <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stages.map((stage) => {
          const s = SURFACE[stage.surface];
          const isActive = stage.status === "active";
          const isDone = stage.status === "done";
          const isUpcoming = stage.status === "upcoming";

          return (
            <li key={stage.step}>
              <Card
                className={cn(
                  "relative flex h-full flex-col overflow-hidden p-5 transition-all",
                  isActive && cn("ring-2 ring-offset-2", s.ring),
                  isUpcoming && "opacity-65"
                )}
              >
                {/* Fargekapp på toppen — spekteret som leses på tvers av raden. */}
                <span
                  className={cn(
                    "absolute inset-x-0 top-0 h-1.5",
                    s.cap,
                    isUpcoming && "opacity-50"
                  )}
                />

                <div className="mb-3 flex items-center justify-between">
                  <span
                    className={cn(
                      "flex size-10 items-center justify-center rounded-full font-semibold text-sm",
                      isUpcoming ? "bg-muted text-muted-foreground" : s.node
                    )}
                  >
                    {isDone ? (
                      <Icon name="check" className="size-5" />
                    ) : (
                      <Icon name={stage.icon} className="size-5" />
                    )}
                  </span>
                  <span className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
                    Steg {stage.step}
                  </span>
                </div>

                <h3 className="font-heading font-semibold text-base">
                  {stage.title}
                </h3>
                <p className="mt-1 flex-1 text-muted-foreground text-sm">
                  {stage.payoff}
                </p>

                <div className="mt-4">
                  {isActive && (
                    <Button asChild size="sm" className="w-full gap-2">
                      <Link href={stage.href}>
                        {stage.cta ?? "Start"}
                        <Icon name="arrow-right" className="size-4" />
                      </Link>
                    </Button>
                  )}
                  {isDone && (
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="h-auto gap-1.5 p-0 text-muted-foreground hover:bg-transparent hover:text-foreground"
                    >
                      <Link href={stage.href}>
                        <Icon name="check-circle" className="size-4" />
                        {stage.meta ?? "Ferdig"}
                      </Link>
                    </Button>
                  )}
                  {isUpcoming && (
                    <p className="text-muted-foreground text-xs">
                      {stage.meta ?? "Kommer senere"}
                    </p>
                  )}
                </div>
              </Card>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
