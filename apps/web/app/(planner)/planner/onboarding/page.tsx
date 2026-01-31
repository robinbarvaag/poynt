"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PlannerOnboardingPage() {
  const router = useRouter();
  const [workspaceName, setWorkspaceName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // TODO: Call tRPC to create workspace
      // For now, just redirect to dashboard
      router.push("/planner/dashboard");
    } catch {
      setError("Kunne ikke opprette bedrift. Prøv igjen.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-slate-900">Opprett din bedrift</h1>
          <p className="mt-2 text-sm text-slate-600">
            Gi bedriften din et navn for å komme i gang
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="workspaceName" className="block text-sm font-medium text-slate-700">
              Bedriftsnavn
            </label>
            <input
              id="workspaceName"
              type="text"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              placeholder="Min bedrift AS"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !workspaceName.trim()}
            className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "Oppretter..." : "Kom i gang"}
          </button>
        </form>
      </div>
    </div>
  );
}
