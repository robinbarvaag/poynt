"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { changeMemberTier, deactivateMember } from "../../actions/members";

type MembershipTier = "none" | "community" | "community_ai" | "agency";

type Props = {
  userId: string;
  currentTier: string;
  currentStatus: string;
  hasSubscription: boolean;
};

const tiers: { value: MembershipTier; label: string }[] = [
  { value: "none", label: "Ingen" },
  { value: "community", label: "Community" },
  { value: "community_ai", label: "Community + AI" },
  { value: "agency", label: "Byrå" },
];

export const MemberActions = ({
  userId,
  currentTier,
  currentStatus,
  hasSubscription,
}: Props) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleTierChange = async (newTier: MembershipTier) => {
    if (newTier === currentTier) return;
    setLoading(true);
    try {
      await changeMemberTier(userId, newTier);
      router.refresh();
    } catch (err) {
      console.error("Feil ved endring av tier:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async () => {
    if (
      !window.confirm(
        "Er du sikker på at du vil deaktivere dette medlemskapet? Stripe-abonnementet vert kansellert."
      )
    )
      return;
    setLoading(true);
    try {
      await deactivateMember(userId);
      router.refresh();
    } catch (err) {
      console.error("Feil ved deaktivering:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section style={{ marginTop: "2rem" }}>
      <h2
        style={{
          fontSize: "1rem",
          fontWeight: 600,
          marginBottom: "0.75rem",
        }}
      >
        Handlingar
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
        {/* Tier change */}
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
            Endre tier
          </span>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {tiers.map((tier) => (
              <button
                key={tier.value}
                type="button"
                disabled={loading || tier.value === currentTier}
                onClick={() => handleTierChange(tier.value)}
                style={{
                  padding: "0.5rem 1rem",
                  border: "1px solid var(--theme-elevation-200)",
                  borderRadius: "var(--style-radius-s)",
                  background:
                    tier.value === currentTier
                      ? "var(--theme-elevation-200)"
                      : "var(--theme-elevation-0)",
                  color: "var(--theme-text)",
                  cursor:
                    tier.value === currentTier || loading
                      ? "default"
                      : "pointer",
                  opacity: loading ? 0.6 : 1,
                  fontWeight: tier.value === currentTier ? 600 : 400,
                  fontSize: "0.875rem",
                  transition: "all 0.15s ease",
                }}
              >
                {tier.label}
                {tier.value === currentTier && " (noverande)"}
              </button>
            ))}
          </div>
        </div>

        {/* Deactivate */}
        {hasSubscription && currentStatus !== "canceled" && (
          <div
            style={{
              paddingTop: "1rem",
              borderTop: "1px solid var(--theme-elevation-150)",
            }}
          >
            <button
              type="button"
              disabled={loading}
              onClick={handleDeactivate}
              style={{
                padding: "0.5rem 1rem",
                border: "1px solid var(--theme-error-500, #dc3545)",
                borderRadius: "var(--style-radius-s)",
                background: "transparent",
                color: "var(--theme-error-500, #dc3545)",
                cursor: loading ? "default" : "pointer",
                opacity: loading ? 0.6 : 1,
                fontSize: "0.875rem",
                fontWeight: 500,
              }}
            >
              {loading ? "Behandlar..." : "Deaktiver medlemskap"}
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
