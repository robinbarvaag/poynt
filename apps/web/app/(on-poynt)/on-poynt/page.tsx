import Link from "next/link";

export default function PlannerLandingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-white">
      <div className="container mx-auto px-4 text-center">
        <h1 className="mb-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          MarkedsPilot
        </h1>
        <p className="mx-auto mb-8 max-w-2xl text-lg text-slate-600">
          AI-drevne markedsføringsverktøy for gründere og småbedrifter. Få
          personlige anbefalinger, markedsplaner og innholdsstrategier.
        </p>
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/planner/signup"
            className="inline-flex items-center justify-center rounded-md bg-slate-900 px-6 py-3 text-sm font-medium text-white shadow transition-colors hover:bg-slate-700"
          >
            Kom i gang gratis
          </Link>
          <Link
            href="/planner/login"
            className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-6 py-3 text-sm font-medium text-slate-900 shadow-sm transition-colors hover:bg-slate-50"
          >
            Logg inn
          </Link>
        </div>
      </div>
    </div>
  );
}
