import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@poynt/ui";
import { Button } from "@poynt/ui";
import { Icon, type IconName } from "@poynt/ui/icons";

const tools: {
  icon: IconName;
  title: string;
  description: string;
  href: string;
  gradient: string;
  benefits: string[];
}[] = [
  {
    icon: "compass",
    title: "Kanalveileder",
    description:
      "Finn de beste markedsføringskanalene for din bedrift basert på målgruppe og ressurser.",
    href: "/planner/tools/channel-guide",
    gradient: "from-sky-400/80 to-teal-400/80",
    benefits: ["Personlig analyse", "Prioritert liste"],
  },
  {
    icon: "file-text",
    title: "Markedsplan-generator",
    description:
      "Lag en komplett markedsplan med innholdsstrategi og publiseringsfrekvens.",
    href: "/planner/tools/marketing-plan",
    gradient: "from-violet-400/80 to-indigo-400/80",
    benefits: ["Skreddersydd", "Ukentlig plan"],
  },
  {
    icon: "hand-metal",
    title: "Si nei-generator",
    description:
      "Avslå forespørsler profesjonelt uten å brenne broer.",
    href: "/planner/tools/decline-generator",
    gradient: "from-amber-400/80 to-orange-400/80",
    benefits: ["Profesjonelt", "Vennlig tone"],
  },
  {
    icon: "calendar",
    title: "Årshjul",
    description:
      "Planlegg innholdet ditt gjennom året med AI-genererte forslag.",
    href: "/planner/tools/yearly-planner",
    gradient: "from-emerald-400/80 to-teal-400/80",
    benefits: ["12 måneder", "Sesongbasert"],
  },
];

const quickActions = [
  {
    title: "Lag avslag",
    description: "Profesjonelt nei",
    href: "/planner/tools/decline-generator",
    icon: "hand-metal" as IconName,
  },
  {
    title: "Ny markedsplan",
    description: "Komplett strategi",
    href: "/planner/tools/marketing-plan",
    icon: "file-text" as IconName,
  },
  {
    title: "Finn kanaler",
    description: "Beste plattformer",
    href: "/planner/tools/channel-guide",
    icon: "compass" as IconName,
  },
  {
    title: "Planlegg året",
    description: "Innholdskalender",
    href: "/planner/tools/yearly-planner",
    icon: "calendar" as IconName,
  },
];

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      {/* Hero welcome */}
      <div className="relative overflow-hidden rounded-2xl border bg-linear-to-br from-primary/5 via-background to-teal-500/5 p-8">
        <div className="absolute right-0 top-0 -z-10 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 -z-10 h-32 w-32 rounded-full bg-teal-500/10 blur-2xl" />

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              <Icon name="sparkles" className="h-4 w-4" />
              Alle verktøy er klare!
            </div>
            <h1 className="text-3xl font-bold tracking-tight">
              Velkommen til MarkedsPilot
            </h1>
            <p className="max-w-lg text-muted-foreground">
              Fire AI-drevne verktøy for å planlegge, strukturere og gjennomføre
              markedsføringen din. Velg et verktøy for å komme i gang.
            </p>
          </div>

          <div className="flex gap-3">
            <Button asChild size="lg" className="gap-2">
              <Link href="/tools/decline-generator">
                <Icon name="zap" className="h-4 w-4" />
                Hurtigstart
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <Icon name="zap" className="h-5 w-5 text-primary" />
          Hurtigvalg
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => (
            <Link key={action.title} href={action.href}>
              <Card className="group h-full transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon name={action.icon} className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium">{action.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {action.description}
                    </div>
                  </div>
                  <Icon
                    name="arrow-right"
                    className="ml-auto h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100"
                  />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* All tools */}
      <div>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <Icon name="layers" className="h-5 w-5 text-primary" />
          Alle verktøy
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {tools.map((tool, index) => (
            <Link key={tool.title} href={tool.href} className="group">
              <Card className="relative h-full overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5">
                {/* Gradient background on hover */}
                <div
                  className={`absolute inset-0 bg-linear-to-br ${tool.gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-5`}
                />

                {/* Number badge */}
                <div className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full border bg-background text-xs font-medium text-muted-foreground">
                  {index + 1}
                </div>

                <CardHeader className="pb-4">
                  <div
                    className={`mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br ${tool.gradient} text-white shadow-lg transition-transform duration-300 group-hover:scale-110`}
                  >
                    <Icon name={tool.icon} className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-lg transition-colors group-hover:text-primary">
                    {tool.title}
                  </CardTitle>
                  <CardDescription>{tool.description}</CardDescription>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-2">
                    {tool.benefits.map((benefit) => (
                      <span
                        key={benefit}
                        className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium"
                      >
                        <Icon name="check" className="h-3 w-3 text-primary" />
                        {benefit}
                      </span>
                    ))}
                  </div>

                  <div className="mt-4 flex items-center gap-2 text-sm font-medium text-primary opacity-0 transition-all group-hover:opacity-100">
                    Åpne verktøy
                    <Icon
                      name="arrow-right"
                      className="h-4 w-4 transition-transform group-hover:translate-x-1"
                    />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Tips section */}
      <Card className="border-primary/20 bg-linear-to-r from-primary/5 to-teal-500/5">
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Icon name="lightbulb" className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Tips: Start med kanalveilederen</CardTitle>
              <CardDescription className="mt-1">
                Ikke sikker på hvor du skal begynne? Kanalveilederen analyserer
                bedriften din og anbefaler de beste markedsføringskanalene.
                Deretter kan du bruke markedsplan-generatoren for å lage en
                komplett strategi.
              </CardDescription>
              <Button variant="link" className="mt-2 h-auto p-0" asChild>
                <Link href="/tools/channel-guide">
                  Prøv kanalveilederen
                  <Icon name="arrow-right" className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>
    </div>
  );
}
