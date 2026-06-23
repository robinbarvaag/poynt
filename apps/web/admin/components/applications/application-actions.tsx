"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  approveMembershipApplication,
  rejectMembershipApplication,
} from "../../actions/applications";

type MembershipTier = "community" | "community_ai";

type Props = {
  applicationId: string;
  status: string;
  approvedTier: string | null;
};

const tierLabels: Record<MembershipTier, string> = {
  community: "Community",
  community_ai: "Community + AI",
};

export const ApplicationActions = ({
  applicationId,
  status,
  approvedTier,
}: Props) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [tier, setTier] = useState<MembershipTier>("community_ai");
  const [error, setError] = useState<string | null>(null);

  const handleApprove = async () => {
    if (
      !window.confirm(
        `Godkjenn søknaden og gi tilgang som ${tierLabels[tier]}? Medlemmet aktiveres med en gang – faktura sendes manuelt etterpå.`
      )
    )
      return;
    setLoading(true);
    setError(null);
    try {
      const res = await approveMembershipApplication(applicationId, tier);
      if (!res.success) {
        setError(res.error ?? "Noe gikk galt");
        return;
      }
      router.refresh();
    } catch (err) {
      console.error("Feil ved godkjenning:", err);
      setError("Noe gikk galt ved godkjenning");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!window.confirm("Avslå denne søknaden?")) return;
    setLoading(true);
    setError(null);
    try {
      await rejectMembershipApplication(applicationId);
      router.refresh();
    } catch (err) {
      console.error("Feil ved avslag:", err);
      setError("Noe gikk galt ved avslag");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section style={{ marginTop: "2rem" }}>
      <h2
        style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem" }}
      >
        Handlinger
      </h2>
      <div
        style={{
          padding: "1.25rem",
          border: "1px solid var(--theme-elevation-150)",
          borderRadius: "var(--style-radius-s)",
          background: "var(--theme-elevation-50)",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        {status === "approved" ? (
          <p style={{ margin: 0, color: "var(--theme-success-500, #2e7d32)" }}>
            Godkjent
            {approvedTier
              ? ` som ${tierLabels[approvedTier as MembershipTier] ?? approvedTier}`
              : ""}
            . Medlemmet finnes nå under{" "}
            <a href="/admin/medlemmer" style={{ textDecoration: "underline" }}>
              Medlemmer
            </a>
            .
          </p>
        ) : status === "rejected" ? (
          <p style={{ margin: 0, color: "var(--theme-elevation-500)" }}>
            Søknaden er avslått.
          </p>
        ) : (
          <>
            <div>
              <span
                style={{
                  display: "block",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  color: "var(--theme-elevation-400)",
                  marginBottom: "0.5rem",
                }}
              >
                Tier ved godkjenning
              </span>
              <select
                value={tier}
                disabled={loading}
                onChange={(e) => setTier(e.target.value as MembershipTier)}
                style={{
                  padding: "0.5rem 0.75rem",
                  border: "1px solid var(--theme-elevation-200)",
                  borderRadius: "var(--style-radius-s)",
                  background: "var(--theme-elevation-0)",
                  color: "var(--theme-text)",
                  fontSize: "0.875rem",
                }}
              >
                <option value="community_ai">Community + AI</option>
                <option value="community">Community</option>
              </select>
            </div>

            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <button
                type="button"
                disabled={loading}
                onClick={handleApprove}
                style={{
                  padding: "0.5rem 1.25rem",
                  border: "none",
                  borderRadius: "var(--style-radius-s)",
                  background: "var(--theme-success-500, #2e7d32)",
                  color: "#fff",
                  cursor: loading ? "default" : "pointer",
                  opacity: loading ? 0.6 : 1,
                  fontSize: "0.875rem",
                  fontWeight: 600,
                }}
              >
                {loading ? "Behandler..." : "Godkjenn"}
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleReject}
                style={{
                  padding: "0.5rem 1.25rem",
                  border: "1px solid var(--theme-elevation-200)",
                  borderRadius: "var(--style-radius-s)",
                  background: "transparent",
                  color: "var(--theme-elevation-600)",
                  cursor: loading ? "default" : "pointer",
                  opacity: loading ? 0.6 : 1,
                  fontSize: "0.875rem",
                  fontWeight: 500,
                }}
              >
                Avslå
              </button>
            </div>
          </>
        )}

        {error && (
          <p style={{ margin: 0, color: "var(--theme-error-500, #dc3545)" }}>
            {error}
          </p>
        )}
      </div>
    </section>
  );
};
