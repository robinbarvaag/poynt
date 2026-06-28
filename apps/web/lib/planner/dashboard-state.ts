import { createServerCaller } from "@/lib/planner/trpc-server";
import type { BrandIdentity } from "@poynt/planner-validators";
import type { JourneyStage, NextStepHeroProps, StageStatus } from "@poynt/ui";

export interface DashboardState {
  hero: NextStepHeroProps;
  stages: JourneyStage[];
  /** Alle fem fasene er gjort — dashbordet går over i «rytme»-modus. */
  fullySetUp: boolean;
  /** Den visuelle merkevaren (for et lite glimt på dashbordet). */
  brandIdentity: BrandIdentity | null;
}

const PROFIL = "/on-poynt/bedrifter";
const KANALVEILEDER = "/on-poynt/verktoy/kanalveileder";
const MARKEDSPLAN = "/on-poynt/verktoy/markedsplan";
const ARSHJUL = "/on-poynt/verktoy/arsplanlegger";

// Fast definisjon av reisen. Status fylles inn fra brukerens faktiske framdrift.
const STAGE_DEFS: Omit<JourneyStage, "status" | "meta">[] = [
  {
    step: 1,
    surface: "mint",
    icon: "building-2",
    title: "Bli kjent",
    payoff: "Fortell oss om bedriften, så blir alt vi lager skreddersydd.",
    href: PROFIL,
    cta: "Fyll ut profilen",
  },
  {
    step: 2,
    surface: "cream",
    icon: "compass",
    title: "Finn kanalene",
    payoff: "Få de 3 kanalene som passer bedriften din best — og hvorfor.",
    href: KANALVEILEDER,
    cta: "Finn kanaler",
  },
  {
    step: 3,
    surface: "saffron",
    icon: "bar-chart",
    title: "Lag markedsplanen",
    payoff: "Gjør kanalvalget om til en konkret plan du kan følge.",
    href: MARKEDSPLAN,
    cta: "Lag markedsplan",
  },
  {
    step: 4,
    surface: "salmon",
    icon: "calendar-days",
    title: "Planlegg året",
    payoff: "Sett innholdet i system: 12 måneder tilpasset sesongene dine.",
    href: ARSHJUL,
    cta: "Lag årshjul",
  },
  {
    step: 5,
    surface: "primary",
    icon: "send",
    title: "Lag & del innhold",
    payoff: "Lag innlegg klare for hver kanal, i bedriftens stemme.",
    href: ARSHJUL,
    cta: "Lag innlegg",
  },
];

const DONE_META = [
  "Profilen er fylt ut",
  "Kanalene er valgt",
  "Planen er klar",
  "Årshjulet er laget",
  "Du lager innhold",
];

const UPCOMING_META = [
  "",
  "Etter at profilen er fylt",
  "Etter at du har valgt kanaler",
  "Etter at du har en plan",
  "Etter at året er planlagt",
];

// Hero-tekst per aktiv fase. Sier hvor du er og hva det ENE neste steget er.
const HERO_BY_PHASE: NextStepHeroProps[] = [
  {
    eyebrow: "Kom i gang",
    title: "La oss bli kjent med bedriften din",
    body: "Jo mer vi vet, jo skarpere blir verktøyene. Det tar et par minutter.",
    accent: "mint",
    primary: { label: "Fyll ut profilen", href: PROFIL, icon: "building-2" },
  },
  {
    eyebrow: "Neste steg",
    title: "Finn kanalene som passer bedriften din",
    body: "Vi peker ut de 3 kanalene du bør satse på — og hvorfor. Da vet du hvor du skal være før du legger planen.",
    accent: "cream",
    primary: { label: "Finn kanaler", href: KANALVEILEDER, icon: "compass" },
  },
  {
    eyebrow: "Neste steg",
    title: "Gjør kanalene om til en plan",
    body: "Du vet hvilke kanaler som passer. Nå lager vi en konkret markedsplan som bygger på dem.",
    accent: "saffron",
    primary: { label: "Lag markedsplan", href: MARKEDSPLAN, icon: "bar-chart" },
    secondary: { label: "Se kanalene", href: KANALVEILEDER, icon: "compass" },
  },
  {
    eyebrow: "Neste steg",
    title: "Klar til å planlegge året",
    body: "Du har en plan. Nå setter vi innholdet i system med årshjulet.",
    accent: "salmon",
    primary: { label: "Åpne årshjulet", href: ARSHJUL, icon: "calendar-days" },
    secondary: { label: "Se planen", href: MARKEDSPLAN },
  },
  {
    eyebrow: "Siste steg",
    title: "Nå lager vi innhold",
    body: "Årshjulet står klart. Lag det første innlegget — tilpasset hver kanal.",
    accent: "primary",
    primary: { label: "Lag innlegg", href: ARSHJUL, icon: "send" },
  },
];

const HERO_DONE: NextStepHeroProps = {
  eyebrow: "Du er i gang",
  title: "Alt er på plass — nå holder vi rytmen",
  body: "Oppsettet er ferdig. Hold deg til ukerytmen, og se over planen hvert kvartal.",
  accent: "primary",
  primary: {
    label: "Se kommende innlegg",
    href: ARSHJUL,
    icon: "calendar-days",
  },
  secondary: { label: "Se planen", href: MARKEDSPLAN },
};

/**
 * Leser brukerens faktiske framdrift (profil + lagrede verktøyresultater) og
 * avleder den tilstandsstyrte heroen + statusen på hver fase i reisen.
 */
export async function getDashboardState(): Promise<DashboardState> {
  const trpc = await createServerCaller();

  const [profile, channels, plans, years, posts] = await Promise.all([
    trpc.workspaceProfile.get().catch(() => null),
    trpc.toolResult.list({ toolId: "channel-guide", limit: 1 }).catch(() => []),
    trpc.toolResult
      .list({ toolId: "marketing-plan", limit: 1 })
      .catch(() => []),
    trpc.toolResult
      .list({ toolId: "yearly-planner", limit: 1 })
      .catch(() => []),
    trpc.toolResult
      .list({ toolId: "generated-post", limit: 1 })
      .catch(() => []),
  ]);

  const profileComplete = Boolean(
    profile?.industryId &&
      profile?.audienceType &&
      profile?.mainGoal &&
      profile?.weeklyTime &&
      profile?.strengths
  );

  const done = [
    profileComplete,
    channels.length > 0,
    plans.length > 0,
    years.length > 0,
    posts.length > 0,
  ];
  const activeIndex = done.findIndex((d) => !d); // -1 → alt gjort
  const fullySetUp = activeIndex === -1;

  const stages: JourneyStage[] = STAGE_DEFS.map((def, i) => {
    const status: StageStatus = done[i]
      ? "done"
      : i === activeIndex
        ? "active"
        : "upcoming";
    return {
      ...def,
      status,
      meta: done[i] ? DONE_META[i] : UPCOMING_META[i],
    };
  });

  const hero =
    fullySetUp || activeIndex < 0
      ? HERO_DONE
      : (HERO_BY_PHASE[activeIndex] ?? HERO_DONE);

  return {
    hero,
    stages,
    fullySetUp,
    brandIdentity: (profile?.brandIdentity as BrandIdentity | null) ?? null,
  };
}
