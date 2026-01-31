import Link from "next/link";

const tools = [
  {
    name: "Kanalguide",
    description: "Finn de beste markedskanalene for din bedrift",
    href: "/planner/tools/channel-guide",
  },
  {
    name: "Avslå-generator",
    description: "Skriv profesjonelle avslag uten dårlig samvittighet",
    href: "/planner/tools/decline-generator",
  },
  {
    name: "Markedsplan",
    description: "Få en skreddersydd markedsplan for din bedrift",
    href: "/planner/tools/marketing-plan",
  },
  {
    name: "Årshjul",
    description: "Planlegg årets innholdspublisering",
    href: "/planner/tools/yearly-planner",
  },
];

export default function PlannerDashboardPage() {
  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-2 text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="mb-8 text-slate-600">
          Velg et verktøy for å komme i gang
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          {tools.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <h2 className="mb-2 text-lg font-semibold text-slate-900">
                {tool.name}
              </h2>
              <p className="text-sm text-slate-600">{tool.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
