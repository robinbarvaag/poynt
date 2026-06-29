import { BrandGlimpseCard } from "@/components/planner/dashboard/brand-glimpse-card";
import { UpcomingPostsCard } from "@/components/planner/dashboard/upcoming-posts-card";
import { TasksCard } from "@/components/planner/tasks/tasks-card";
import { getDashboardState } from "@/lib/planner/dashboard-state";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  JourneyPath,
  NextStepHero,
  PageShell,
  ToolboxCard,
} from "@poynt/ui";
import { Icon, type IconName } from "@poynt/ui/icons";

/** Én rolig seksjonsoverskrift — samme stil overalt, så siden ikke spriker. */
function SectionTitle({ children }: { children: string }) {
  return <h2 className="font-heading font-semibold text-xl">{children}</h2>;
}

/** Ett sjekkpunkt i den faste rytmen (rad uten egen ramme — bor i ett kort). */
function RhythmCheck({
  icon,
  title,
  text,
}: {
  icon: IconName;
  title: string;
  text: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon name={icon} className="size-4" />
      </span>
      <div>
        <p className="font-medium text-sm">{title}</p>
        <p className="text-muted-foreground text-sm">{text}</p>
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const { hero, stages, brandIdentity } = await getDashboardState();

  return (
    <PageShell>
      {/* Tilstandsstyrt topp — hvor du er + det ene neste steget */}
      <NextStepHero {...hero} />

      {/* Signaturen: den guidede veien gjennom oppsettet */}
      <div data-tour="journey">
        <JourneyPath title="Slik kommer du i gang" stages={stages} />
      </div>

      {/* Din rytme — det daglige/ukentlige når oppsettet er i gang */}
      <section className="space-y-5">
        <SectionTitle>Din rytme</SectionTitle>
        <div className="grid gap-6 lg:grid-cols-2">
          <TasksCard />
          <UpcomingPostsCard />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Samme Card-komponent som de andre flatene — ett tydelig merket kort
              i stedet for to løse bokser. */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Din faste rytme</CardTitle>
              <CardDescription>
                To faste sjekkpunkter som holder markedsføringen i gang.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-5 sm:grid-cols-2">
                <RhythmCheck
                  icon="clock"
                  title="Hver uke"
                  text="Sett av en halvtime til å lage og planlegge ukas innhold."
                />
                <RhythmCheck
                  icon="refresh"
                  title="Hvert kvartal"
                  text="Se over markedsplanen og juster kursen etter det som funker."
                />
              </div>
            </CardContent>
          </Card>

          {/* Lite glimt av den visuelle merkevaren, med snarvei til boka */}
          <BrandGlimpseCard identity={brandIdentity} />
        </div>
      </section>

      {/* Verktøykassa — nyttige verktøy utenom kjernereisen */}
      <section className="space-y-5">
        <SectionTitle>Verktøykassa</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ToolboxCard
            name="Si nei med stil"
            whatItDoes="Lag høflige, profesjonelle avslag på forespørsler du ikke rekker."
            whenToUse="noen ber om noe du må takke nei til."
            icon="message-square-off"
            href="/on-poynt/verktoy/avslag-generator"
          />
          <ToolboxCard
            name="Podcast til innhald"
            whatItDoes="Gjør en podkast-episode om til blogginnlegg, sosiale poster og kapittelmerker."
            whenToUse="du har en episode du vil få mer innhold ut av."
            icon="mic"
            href="/on-poynt/verktoy/podcast-til-innhald"
          />
        </div>
      </section>
    </PageShell>
  );
}
