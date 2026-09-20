"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  changeMemberTier,
  endMembership,
  setMemberStatus,
} from "../../actions/members";
import { MemberDeleteButton } from "./member-delete-button";

type MembershipTier = "none" | "community" | "community_ai" | "agency";

type Props = {
  userId: string;
  email: string;
  name: string;
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

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.75rem",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  color: "var(--theme-elevation-400)",
  marginBottom: "0.5rem",
};

const hintStyle: React.CSSProperties = {
  margin: "0.4rem 0 0",
  fontSize: "0.8rem",
  color: "var(--theme-elevation-500)",
  lineHeight: 1.5,
};

const sectionStyle: React.CSSProperties = {
  paddingTop: "1rem",
  borderTop: "1px solid var(--theme-elevation-150)",
};

export const MemberActions = ({
  userId,
  email,
  name,
  currentTier,
  currentStatus,
  hasSubscription,
}: Props) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Handlingene returnerer enten { success } eller { success, error } —
  // sistnevnte når noe var i veien uten at det er en feil å kaste.
  const run = async (
    action: () => Promise<{ success: boolean; error?: string }>
  ) => {
    setLoading(true);
    setMessage(null);
    try {
      const result = await action();
      if (result.error) {
        setMessage(result.error);
        return;
      }
      router.refresh();
    } catch (err) {
      console.error("Handlingen feilet:", err);
      setMessage("Handlingen feilet. Prøv igjen.");
    } finally {
      setLoading(false);
    }
  };

  const handleTierChange = (newTier: MembershipTier) => {
    if (newTier === currentTier) return;
    run(() => changeMemberTier(userId, newTier));
  };

  const isPaused = currentStatus === "inactive";

  const handleTogglePause = () =>
    run(() => setMemberStatus(userId, isPaused ? "active" : "inactive"));

  const handleEndMembership = () => {
    if (
      !window.confirm(
        "Avslutte medlemskapet? Stripe-abonnementet kanselleres og nivået settes til «ingen». Skal personen bare stoppes midlertidig, bruk «Sett på pause» i stedet."
      )
    )
      return;
    run(() => endMembership(userId));
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
        <div>
          <span style={labelStyle}>Endre nivå</span>
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
                {tier.value === currentTier && " (nåværende)"}
              </button>
            ))}
          </div>
        </div>

        {/* Pause: reversibel. Stripe og nivået står urørt, så ett klikk
            setter personen tilbake der hen var. */}
        <div style={sectionStyle}>
          <span style={labelStyle}>Tilgang</span>
          <button
            type="button"
            disabled={loading || !hasSubscription}
            onClick={handleTogglePause}
            style={{
              padding: "0.5rem 1rem",
              border: "1px solid var(--theme-elevation-200)",
              borderRadius: "var(--style-radius-s)",
              background: isPaused
                ? "var(--theme-success-500, #16a34a)"
                : "var(--theme-elevation-0)",
              color: isPaused ? "#fff" : "var(--theme-text)",
              cursor: loading || !hasSubscription ? "default" : "pointer",
              opacity: loading || !hasSubscription ? 0.6 : 1,
              fontSize: "0.875rem",
              fontWeight: 500,
            }}
          >
            {isPaused ? "Gi tilgang igjen" : "Sett på pause"}
          </button>
          <p style={hintStyle}>
            {!hasSubscription
              ? "Personen har ikke noe medlemskap ennå, så det er ingen tilgang å pause."
              : isPaused
                ? "Tilgangen er satt på pause. Nivået og Stripe-abonnementet står urørt, så du kan slippe personen inn igjen når som helst."
                : "Stenger tilgangen til On Poynt uten å røre Stripe eller nivået. Kan skrus på igjen."}
          </p>
        </div>

        {hasSubscription && currentStatus !== "canceled" && (
          <div style={sectionStyle}>
            <span style={labelStyle}>Avslutt</span>
            <button
              type="button"
              disabled={loading}
              onClick={handleEndMembership}
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
              {loading ? "Behandler…" : "Avslutt medlemskap"}
            </button>
            <p style={hintStyle}>
              Kansellerer Stripe-abonnementet og setter nivået til «ingen».
              Kontoen består, men medlemskapet er over.
            </p>
          </div>
        )}

        <div style={sectionStyle}>
          <span style={labelStyle}>Slett</span>
          <MemberDeleteButton
            userId={userId}
            label={name || email}
            redirectTo="/admin/medlemmer"
          />
          <p style={hintStyle}>
            Fjerner personen og alt som henger på kontoen. Kan ikke angres.
          </p>
        </div>

        {message && (
          <p
            role="alert"
            style={{
              margin: 0,
              color: "var(--theme-error-500, #dc3545)",
              fontSize: "0.85rem",
            }}
          >
            {message}
          </p>
        )}
      </div>
    </section>
  );
};
