import { Badge, Card, cn } from "@poynt/ui";
import { Icon, type IconName } from "@poynt/ui/icons";
import Link from "next/link";

export interface ToolboxCardProps {
  name: string;
  /** Hva verktøyet gjør — én linje, i klartekst. */
  whatItDoes: string;
  /** Når du faktisk bruker det — fjerner gjettingen. */
  whenToUse: string;
  icon: IconName;
  href: string;
  /** Tier-merke (f.eks. «Pro») hvis verktøyet er låst bak et abonnement. */
  tierLabel?: string;
}

/**
 * Et verktøy i «Verktøykassa» — forklart slik en bruker forstår det: navn, hva
 * det gjør, og NÅR man bruker det. Erstatter de nakne flisene der man måtte
 * gjette hva «Lag avslag» egentlig betød.
 */
export function ToolboxCard({
  name,
  whatItDoes,
  whenToUse,
  icon,
  href,
  tierLabel,
}: ToolboxCardProps) {
  return (
    <Card
      asChild
      className="group h-full p-0 transition-all hover:-translate-y-0.5"
    >
      <Link href={href}>
        <div className="flex h-full flex-col gap-3 p-5">
          <div className="flex items-center justify-between gap-2">
            <span className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <Icon name={icon} className="size-5" />
            </span>
            {tierLabel && (
              <Badge variant="soft-primary" size="sm">
                {tierLabel}
              </Badge>
            )}
          </div>

          <div className="flex-1 space-y-1.5">
            <h3 className="font-heading font-semibold">{name}</h3>
            <p className="text-muted-foreground text-sm">{whatItDoes}</p>
          </div>

          <p
            className={cn(
              "border-t pt-3 text-muted-foreground text-xs",
              "flex items-start gap-1.5"
            )}
          >
            <span className="font-semibold text-foreground">Når:</span>
            {whenToUse}
          </p>
        </div>
      </Link>
    </Card>
  );
}
