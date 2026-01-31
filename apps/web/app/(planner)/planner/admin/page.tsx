import Link from "next/link";

export default function PlannerAdminPage() {
  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-2xl font-bold text-slate-900">Admin</h1>

        <div className="space-y-4">
          <Link
            href="/planner/admin/industries"
            className="block rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
          >
            <h2 className="font-semibold text-slate-900">Bransjer</h2>
            <p className="text-sm text-slate-600">
              Administrer bransjer for verktøyene
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
