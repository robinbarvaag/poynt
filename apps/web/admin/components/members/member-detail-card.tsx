"use client";

import { Pill } from "@payloadcms/ui";
import type { MemberDetail } from "../../views/members/detail";

type Props = {
  user: MemberDetail["user"];
  subscription: MemberDetail["subscription"];
  recentSessions: MemberDetail["recentSessions"];
};

const tierLabels: Record<string, string> = {
  none: "Ingen",
  community: "Community",
  community_ai: "Community + AI",
};

const statusLabels: Record<string, string> = {
  active: "Aktiv",
  inactive: "Inaktiv",
  canceled: "Kansellert",
  past_due: "Forfalt",
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("nb-NO", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const MemberDetailCard = ({
  user,
  subscription,
  recentSessions,
}: Props) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* User info */}
      <section>
        <h2 style={sectionHeader}>Brukerinfo</h2>
        <div style={cardStyle}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              marginBottom: "1rem",
            }}
          >
            {user.image && (
              <img
                src={user.image}
                alt={user.name}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  objectFit: "cover",
                }}
              />
            )}
            <div>
              <div style={{ fontWeight: 600, fontSize: "1.125rem" }}>
                {user.name}
              </div>
              <div style={{ color: "var(--theme-elevation-500)" }}>
                {user.email}
              </div>
            </div>
          </div>
          <div style={gridStyle}>
            <Field label="Rolle" value={user.role} />
            <Field
              label="Onboarding"
              value={user.onboardingCompleted ? "Fullført" : "Ikke fullført"}
            />
            <Field label="Registrert" value={formatDate(user.createdAt)} />
          </div>
        </div>
      </section>

      {/* Subscription */}
      <section>
        <h2 style={sectionHeader}>Abonnement</h2>
        <div style={cardStyle}>
          {subscription ? (
            <div style={gridStyle}>
              <Field
                label="Tier"
                value={
                  <Pill pillStyle="dark" size="small">
                    {tierLabels[subscription.tier] ?? subscription.tier}
                  </Pill>
                }
              />
              <Field
                label="Status"
                value={
                  <Pill
                    pillStyle={
                      subscription.status === "active"
                        ? "success"
                        : subscription.status === "past_due"
                          ? "error"
                          : subscription.status === "canceled"
                            ? "warning"
                            : "light"
                    }
                    size="small"
                  >
                    {statusLabels[subscription.status] ?? subscription.status}
                  </Pill>
                }
              />
              <Field
                label="Stripe Customer"
                value={subscription.stripeCustomerId ?? "—"}
              />
              <Field
                label="Stripe Subscription"
                value={subscription.stripeSubscriptionId ?? "—"}
              />
              <Field
                label="Periode start"
                value={formatDate(subscription.currentPeriodStart)}
              />
              <Field
                label="Periode slutt"
                value={formatDate(subscription.currentPeriodEnd)}
              />
              <Field
                label="Kansellerer ved periodeslutt"
                value={subscription.cancelAtPeriodEnd ? "Ja" : "Nei"}
              />
              <Field
                label="Opprettet"
                value={formatDate(subscription.createdAt)}
              />
            </div>
          ) : (
            <p style={{ color: "var(--theme-elevation-400)" }}>
              Ingen abonnementsdata
            </p>
          )}
        </div>
      </section>

      {/* Login history */}
      <section>
        <h2 style={sectionHeader}>Siste innloggingar</h2>
        <div style={cardStyle}>
          {recentSessions.length > 0 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              {recentSessions.map((session, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "0.5rem 0",
                    borderBottom:
                      i < recentSessions.length - 1
                        ? "1px solid var(--theme-elevation-100)"
                        : "none",
                    fontSize: "0.875rem",
                  }}
                >
                  <span>{formatDate(session.createdAt)}</span>
                  <span style={{ color: "var(--theme-elevation-400)" }}>
                    {session.ipAddress ?? "Ukjent IP"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: "var(--theme-elevation-400)" }}>
              Ingen innloggingar registrert
            </p>
          )}
        </div>
      </section>
    </div>
  );
};

function Field({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <div
        style={{
          fontSize: "0.75rem",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          color: "var(--theme-elevation-400)",
          marginBottom: "0.25rem",
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: "0.875rem" }}>{value}</div>
    </div>
  );
}

const sectionHeader: React.CSSProperties = {
  fontSize: "1rem",
  fontWeight: 600,
  marginBottom: "0.75rem",
};

const cardStyle: React.CSSProperties = {
  padding: "1.25rem",
  border: "1px solid var(--theme-elevation-150)",
  borderRadius: "var(--style-radius-s)",
  background: "var(--theme-elevation-50)",
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
  gap: "1rem",
};
