import { createServerCaller } from "@/lib/planner/trpc-server";
import type { BrandBrief, BrandIdentity } from "@poynt/planner-validators";
import {
  type MarketingPlan,
  mainGoalLabels,
  profileAudienceTypeLabels,
  profileCompanySizeLabels,
  strengthLabels,
  weeklyTimeLabels,
} from "@poynt/planner-validators";
import {
  BrandHeader,
  Button,
  Card,
  CardContent,
  FontSpecimen,
  Heading,
  PageShell,
  SwatchGrid,
  Text,
} from "@poynt/ui";
import { Icon, type IconName } from "@poynt/ui/icons";
import Link from "next/link";

export const metadata = { title: "Min strategi" };

const BRAND_HREF = "/on-poynt/bedrifter";
const MARKEDSPLAN_HREF = "/on-poynt/verktoy/markedsplan";

/** Seksjonsoverskrift med ikon — rolig, samme stil overalt. */
function SectionHead({
  icon,
  title,
  subtitle,
}: {
  icon: IconName;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon name={icon} className="size-5" />
      </span>
      <div>
        <h2 className="font-heading font-semibold text-xl">{title}</h2>
        {subtitle && (
          <p className="text-muted-foreground text-sm">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

/** En faktarad i situasjonsbildet. */
function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
      <p className="text-muted-foreground text-xs uppercase tracking-[0.12em]">
        {label}
      </p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}

/** Tom-tilstand for en seksjon: rolig CTA i stedet for en tom boks. */
function EmptyHint({
  text,
  cta,
  href,
}: {
  text: string;
  cta: string;
  href: string;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-start gap-3 py-6">
        <Text customStyles="text-muted-foreground">{text}</Text>
        <Button asChild variant="outline" size="sm" className="gap-2">
          <Link href={href}>
            <Icon name="arrow-right" className="size-4" />
            {cta}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export default async function StrategiPage() {
  const trpc = await createServerCaller();

  const [current, profile, planResults] = await Promise.all([
    trpc.workspace.getCurrentWorkspace().catch(() => null),
    trpc.workspaceProfile.get().catch(() => null),
    trpc.toolResult
      .list({ toolId: "marketing-plan", limit: 1 })
      .catch(() => []),
  ]);

  const companyName = current?.name ?? "Bedriften din";
  const brief = (profile?.brandBrief as BrandBrief | null) ?? null;
  const identity = (profile?.brandIdentity as BrandIdentity | null) ?? null;

  const firstPlan = planResults[0]?.result as
    | { plan?: MarketingPlan }
    | undefined;
  const plan = firstPlan?.plan ?? null;

  // Situasjonsfakta fra profilen (kun de som er fylt ut).
  const facts: { label: string; value: string }[] = [];
  if (profile?.industry?.name) {
    facts.push({ label: "Bransje", value: profile.industry.name });
  }
  if (profile?.companySize) {
    facts.push({
      label: "Størrelse",
      value: profileCompanySizeLabels[profile.companySize],
    });
  }
  if (profile?.audienceType) {
    facts.push({
      label: "Målgruppe",
      value: profileAudienceTypeLabels[profile.audienceType],
    });
  }
  if (profile?.mainGoal) {
    facts.push({
      label: "Hovedmål",
      value: mainGoalLabels[profile.mainGoal as keyof typeof mainGoalLabels],
    });
  }
  if (profile?.weeklyTime) {
    facts.push({
      label: "Tid per uke",
      value:
        weeklyTimeLabels[profile.weeklyTime as keyof typeof weeklyTimeLabels],
    });
  }
  if (profile?.strengths) {
    facts.push({
      label: "Styrke",
      value: strengthLabels[profile.strengths as keyof typeof strengthLabels],
    });
  }

  const colors = (identity?.colors ?? []).filter((c) => c?.hex);
  const hasBrand =
    Boolean(identity?.logoUrl) ||
    Boolean(identity?.tagline) ||
    colors.length > 0 ||
    Boolean(identity?.fonts?.heading) ||
    Boolean(identity?.fonts?.body) ||
    Boolean(brief?.toneOfVoice) ||
    Boolean(brief?.coreMessage) ||
    Boolean(brief?.usp);

  const channels = (plan?.channels ?? []).filter((c) => c?.channel);
  const quickWins = (plan?.quickWins ?? []).filter(Boolean);

  return (
    <PageShell>
      <div>
        <p className="font-medium text-muted-foreground text-sm uppercase tracking-[0.14em]">
          Min strategi
        </p>
        <Heading size="h1">Slik henger markedsføringen din sammen</Heading>
        <Text customStyles="mt-2 max-w-2xl text-muted-foreground">
          Situasjonen, merkevaren og planen samlet på ett sted — alt verktøyene
          allerede vet om bedriften din. Oppdaterer du profilen, boka eller
          planen, oppdateres dette bildet.
        </Text>
      </div>

      {/* Merkevaren — forsiden */}
      <BrandHeader
        name={companyName}
        logoUrl={identity?.logoUrl}
        tagline={identity?.tagline}
        surface="cream"
      />

      {/* Situasjon */}
      <section className="space-y-4">
        <SectionHead
          icon="building-2"
          title="Dagens situasjon"
          subtitle="Hvem dere er og hva dere vil oppnå."
        />
        {facts.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {facts.map((f) => (
              <Fact key={f.label} label={f.label} value={f.value} />
            ))}
          </div>
        ) : (
          <EmptyHint
            text="Fyll ut bedriftsprofilen, så tegner vi situasjonsbildet her."
            cta="Fyll ut profilen"
            href={BRAND_HREF}
          />
        )}
        {profile?.targetAudience && (
          <Card>
            <CardContent className="py-5">
              <p className="text-muted-foreground text-xs uppercase tracking-[0.12em]">
                Målgruppen deres
              </p>
              <Text customStyles="mt-1">{profile.targetAudience}</Text>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Merkevaren */}
      <section className="space-y-4">
        <SectionHead
          icon="palette"
          title="Merkevaren"
          subtitle="Slik ser dere ut og høres ut."
        />
        {hasBrand ? (
          <div className="space-y-4">
            {(brief?.coreMessage || brief?.usp || brief?.toneOfVoice) && (
              <div className="grid gap-3 sm:grid-cols-2">
                {brief?.coreMessage && (
                  <Fact label="Kjernebudskap" value={brief.coreMessage} />
                )}
                {brief?.usp && (
                  <Fact label="Det som skiller dere ut" value={brief.usp} />
                )}
                {brief?.toneOfVoice && (
                  <Fact label="Tone of voice" value={brief.toneOfVoice} />
                )}
              </div>
            )}
            {colors.length > 0 && <SwatchGrid colors={colors} hideCopy />}
            {(identity?.fonts?.heading || identity?.fonts?.body) && (
              <div className="grid gap-4 sm:grid-cols-2">
                {identity?.fonts?.heading && (
                  <FontSpecimen fontFamily={identity.fonts.heading} />
                )}
                {identity?.fonts?.body && (
                  <FontSpecimen fontFamily={identity.fonts.body} />
                )}
              </div>
            )}
          </div>
        ) : (
          <EmptyHint
            text="Sett opp merkevare-boka med logo, farger, fonter og stemme."
            cta="Lag merkevare-boka"
            href={BRAND_HREF}
          />
        )}
      </section>

      {/* Strategien (fra markedsplanen) */}
      <section className="space-y-4">
        <SectionHead
          icon="bar-chart"
          title="Strategien"
          subtitle="Retningen og kanalene dere satser på."
        />
        {plan ? (
          <div className="space-y-4">
            {plan.summary && (
              <Card>
                <CardContent className="py-5">
                  <Text>{plan.summary}</Text>
                </CardContent>
              </Card>
            )}
            {channels.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {channels.map((c) => (
                  <span
                    key={c.channel}
                    className="inline-flex items-center gap-1.5 rounded-full bg-accent-3/50 px-3 py-1.5 font-medium text-foreground text-sm ring-1 ring-foreground/10"
                  >
                    <Icon name="target" className="size-3.5 text-primary" />
                    {c.channel}
                  </span>
                ))}
              </div>
            )}
            <Button asChild variant="outline" size="sm" className="gap-2">
              <Link href={MARKEDSPLAN_HREF}>
                <Icon name="arrow-right" className="size-4" />
                Se hele markedsplanen
              </Link>
            </Button>
          </div>
        ) : (
          <EmptyHint
            text="Lag en markedsplan, så viser vi retningen og kanalene her."
            cta="Lag markedsplan"
            href={MARKEDSPLAN_HREF}
          />
        )}
      </section>

      {/* Handlingsplan — quick wins */}
      {quickWins.length > 0 && (
        <section className="space-y-4">
          <SectionHead
            icon="zap"
            title="Kom i gang"
            subtitle="De første konkrete stegene fra planen din."
          />
          <Card>
            <CardContent className="py-5">
              <ul className="space-y-2.5">
                {quickWins.slice(0, 6).map((win, i) => (
                  <li key={win} className="flex items-start gap-2.5 text-sm">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary text-xs">
                      {i + 1}
                    </span>
                    <span>{win}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>
      )}
    </PageShell>
  );
}
