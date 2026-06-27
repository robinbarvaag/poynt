import {
  type MembershipTier,
  membershipTierFeatures,
  membershipTierLabels,
  membershipTierTaglines,
  paidMembershipTiers,
} from "@poynt/planner-validators";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@poynt/ui";
import { Icon } from "@poynt/ui/icons";
import Link from "next/link";

/** Rangering brukt for å avgjøre inkludert/nåværende/oppgradering. */
const tierRank: Record<MembershipTier, number> = {
  none: 0,
  community: 1,
  community_ai: 2,
  agency: 3,
};

/** Nivået vi fremhever som standardvalget. */
const RECOMMENDED: MembershipTier = "community_ai";

const SUPPORT_EMAIL = "support@poynt.no";

/**
 * Sammenligning av de tre ekte medlemskapsnivåene (Community → Community AI →
 * Byrå). Fremhever nåværende nivå og det anbefalte, og gir riktig CTA per nivå:
 * lavere nivå = inkludert, høyere = oppgrader (Byrå er salgsstyrt → «Ta kontakt»).
 * Brukes på medlemskapssiden som «se nivåene»-visning når man har nådd en grense.
 */
export function MembershipPlans({
  currentTier,
}: {
  currentTier: MembershipTier;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {paidMembershipTiers.map((tier) => {
        const isCurrent = tier === currentTier;
        const isIncluded = tierRank[tier] < tierRank[currentTier];
        const isUpgrade = tierRank[tier] > tierRank[currentTier];
        const isRecommended = tier === RECOMMENDED && !isCurrent && !isIncluded;

        return (
          <Card
            key={tier}
            className={
              isRecommended
                ? "ring-2 ring-primary"
                : isCurrent
                  ? "ring-2 ring-foreground/20"
                  : undefined
            }
          >
            <CardHeader>
              <div className="flex h-5 items-center">
                {isCurrent && (
                  <Badge variant="muted" size="sm">
                    Din plan
                  </Badge>
                )}
                {isRecommended && (
                  <Badge variant="default" size="sm">
                    Anbefalt
                  </Badge>
                )}
              </div>
              <CardTitle>{membershipTierLabels[tier]}</CardTitle>
              <p className="text-muted-foreground text-sm">
                {membershipTierTaglines[tier]}
              </p>
            </CardHeader>

            <CardContent className="flex flex-1 flex-col gap-5">
              <ul className="flex-1 space-y-2.5">
                {membershipTierFeatures[tier].map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2.5 text-sm"
                  >
                    <Icon
                      name="check"
                      className="mt-0.5 size-4 shrink-0 text-primary"
                    />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <PlanCta
                tier={tier}
                currentTier={currentTier}
                isCurrent={isCurrent}
                isIncluded={isIncluded}
                isUpgrade={isUpgrade}
                isRecommended={isRecommended}
              />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function PlanCta({
  tier,
  currentTier,
  isCurrent,
  isIncluded,
  isUpgrade,
  isRecommended,
}: {
  tier: MembershipTier;
  currentTier: MembershipTier;
  isCurrent: boolean;
  isIncluded: boolean;
  isUpgrade: boolean;
  isRecommended: boolean;
}) {
  if (isCurrent) {
    return (
      <p className="text-center text-muted-foreground text-sm">
        Dette er nivået ditt nå.
      </p>
    );
  }

  if (isIncluded) {
    return (
      <p className="flex items-center justify-center gap-1.5 text-muted-foreground text-sm">
        <Icon name="check" className="size-4" />
        Inkludert i din plan
      </p>
    );
  }

  if (!isUpgrade) return null;

  // Byrå er salgsstyrt (intet selvbetjent kjøp ennå) → kontakt.
  if (tier === "agency") {
    return (
      <Button variant="outline" className="w-full" asChild>
        <a href={`mailto:${SUPPORT_EMAIL}?subject=Byr%C3%A5-niv%C3%A5`}>
          Ta kontakt
        </a>
      </Button>
    );
  }

  const label =
    currentTier === "none" && tier === "community" ? "Bli medlem" : "Oppgrader";

  return (
    <Button
      variant={isRecommended ? "default" : "outline"}
      className="w-full"
      asChild
    >
      <Link href="/produkter">{label}</Link>
    </Button>
  );
}
