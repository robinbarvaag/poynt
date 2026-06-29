"use client";

import { useDocumentInfo, useField } from "@payloadcms/ui";
import { useState } from "react";

/**
 * «Vurder kvalitet»-panel på Guider-dokumentet (montert som et `ui`-felt).
 * Sender guidens id til `/api/ai/guide-review`, som leser innholdet og
 * returnerer en rubrikk-basert kvalitetsvurdering: totalscore, delscore per
 * dimensjon og de viktigste fiksene. KUN diagnose – partneren skriver om selv.
 *
 * Resultatet PERSISTERES på guiden via skjult-/sidebar-feltene `qualityScore`,
 * `qualityReviewedAt` og `qualityReview` (setValue → autosave). Ved neste åpning
 * leses den lagrede vurderingen tilbake og vises uten å kjøre AI-en på nytt.
 * `qualityScore` driver dessuten et `low_quality`-signal i Innholdsradaren.
 */

interface Dimensjon {
  key: string;
  label: string;
  score: number;
  begrunnelse: string;
}

interface Review {
  totalScore: number;
  oppsummering: string;
  dimensjoner: Dimensjon[];
  toppFiks: { tittel: string; beskrivelse: string }[];
  contentHash?: string;
}

function scoreColor(score: number): string {
  if (score >= 70) return "var(--theme-success-500, #22c55e)";
  if (score >= 40) return "var(--theme-warning-500, #eab308)";
  return "var(--theme-error-500, #ef4444)";
}

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("nb-NO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const ReviewGuideButton = () => {
  const { id } = useDocumentInfo();
  const { setValue: setScore } = useField<number>({ path: "qualityScore" });
  const { setValue: setReviewedAt, value: reviewedAt } = useField<string>({
    path: "qualityReviewedAt",
  });
  const { setValue: setReviewJson, value: reviewJson } = useField<Review>({
    path: "qualityReview",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Vis lagret vurdering ved åpning; lokal state overstyrer etter ny kjøring.
  const [fresh, setFresh] = useState<Review | null>(null);
  const review = fresh ?? (reviewJson as Review | null);
  const reviewedLabel = formatDate(fresh ? null : (reviewedAt ?? null));

  const onClick = async () => {
    if (id === undefined || id === null) {
      setError("Lagre guiden først, så kan vi lese innholdet og vurdere det.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/guide-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guideId: id }),
      });
      const data = (await res.json()) as Review & { error?: string };
      if (!res.ok || typeof data.totalScore !== "number") {
        throw new Error(data.error || "Kunne ikke vurdere guiden.");
      }
      setFresh(data);
      // Persistér på dokumentet (autosave plukker opp endringene).
      setScore(data.totalScore);
      setReviewedAt(new Date().toISOString());
      setReviewJson(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Noe gikk galt.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginBottom: "1.5rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <button
          type="button"
          onClick={onClick}
          disabled={loading}
          className="btn btn--style-secondary btn--size-small"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            margin: 0,
          }}
        >
          <span aria-hidden>🧭</span>{" "}
          {loading
            ? "Vurderer …"
            : review
              ? "Vurder på nytt"
              : "Vurder kvalitet"}
        </button>
        {reviewedLabel && !fresh && (
          <span
            style={{
              fontSize: "0.78rem",
              color: "var(--theme-elevation-500)",
            }}
          >
            Sist vurdert {reviewedLabel}
          </span>
        )}
      </div>

      {error && (
        <p
          style={{
            color: "var(--theme-error-500)",
            fontSize: "0.8rem",
            marginTop: "0.35rem",
          }}
        >
          {error}
        </p>
      )}

      {review && (
        <div
          style={{
            marginTop: "1rem",
            padding: "1rem",
            border: "1px solid var(--theme-elevation-150)",
            borderRadius: "var(--style-radius-m, 8px)",
            background: "var(--theme-elevation-50)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: "0.75rem",
              marginBottom: "0.5rem",
            }}
          >
            <span
              style={{
                fontSize: "2rem",
                fontWeight: 700,
                lineHeight: 1,
                color: scoreColor(review.totalScore),
              }}
            >
              {review.totalScore}
            </span>
            <span style={{ color: "var(--theme-elevation-500)" }}>/ 100</span>
          </div>

          <p style={{ margin: "0 0 1rem", fontSize: "0.9rem" }}>
            {review.oppsummering}
          </p>

          <div style={{ display: "grid", gap: "0.5rem", marginBottom: "1rem" }}>
            {review.dimensjoner.map((d) => (
              <div key={d.key}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    marginBottom: "0.2rem",
                  }}
                >
                  <span>{d.label}</span>
                  <span style={{ color: scoreColor(d.score) }}>{d.score}</span>
                </div>
                <div
                  style={{
                    height: 4,
                    borderRadius: 2,
                    background: "var(--theme-elevation-150)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${d.score}%`,
                      background: scoreColor(d.score),
                    }}
                  />
                </div>
                <p
                  style={{
                    margin: "0.25rem 0 0",
                    fontSize: "0.78rem",
                    color: "var(--theme-elevation-600)",
                  }}
                >
                  {d.begrunnelse}
                </p>
              </div>
            ))}
          </div>

          <p
            style={{
              fontSize: "0.8rem",
              fontWeight: 600,
              margin: "0 0 0.4rem",
            }}
          >
            Viktigste grep
          </p>
          <ol style={{ margin: 0, paddingLeft: "1.1rem" }}>
            {review.toppFiks.map((f, i) => (
              <li
                key={`${i}-${f.tittel}`}
                style={{ fontSize: "0.82rem", marginBottom: "0.4rem" }}
              >
                <strong>{f.tittel}.</strong> {f.beskrivelse}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
};
