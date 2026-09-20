"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import {
  type DeletePreview,
  deleteMember,
  previewMemberDeletion,
} from "../../actions/members";

/**
 * Sletteknapp for et medlem, med en bekreftelse som viser hva som faktisk
 * forsvinner før du kan gjøre det.
 *
 * Bekreftelsen krever at du skriver e-postadressen. Et vanlig «er du sikker?»
 * blir klikket bort på refleks, og forskjellen på å slette en testbruker og et
 * betalende medlem er ellers én feiltruffet rad i en liste.
 *
 * Brukes både som ikon i medlemslista og som full knapp på detaljsiden.
 */
export function MemberDeleteButton({
  userId,
  label,
  compact = false,
  redirectTo,
}: {
  userId: string;
  /** Navn eller e-post — vises i dialogen. */
  label: string;
  /** Kompakt ikon-variant til tabellrader. */
  compact?: boolean;
  /** Hvor vi sender brukeren etterpå. Uten denne oppdateres bare siden. */
  redirectTo?: string;
}) {
  const router = useRouter();
  const inputId = useId();
  const [preview, setPreview] = useState<DeletePreview | null>(null);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const open = async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await previewMemberDeletion(userId);
      if (!result) {
        setError("Fant ikke personen.");
        return;
      }
      setPreview(result);
      setTyped("");
    } catch (err) {
      console.error("Kunne ikke hente sletteforhåndsvisning:", err);
      setError("Kunne ikke hente informasjon om personen.");
    } finally {
      setBusy(false);
    }
  };

  const close = () => {
    setPreview(null);
    setTyped("");
    setError(null);
  };

  const confirm = async () => {
    if (!preview) return;
    setBusy(true);
    setError(null);
    try {
      const result = await deleteMember(userId, typed);
      if (!result.success) {
        setError(result.error);
        return;
      }
      close();
      if (redirectTo) router.push(redirectTo);
      else router.refresh();
    } catch (err) {
      console.error("Sletting feilet:", err);
      setError("Sletting feilet. Prøv igjen.");
    } finally {
      setBusy(false);
    }
  };

  const emailMatches =
    preview != null &&
    typed.trim().toLowerCase() === preview.email.trim().toLowerCase();

  return (
    <>
      <button
        type="button"
        onClick={open}
        disabled={busy}
        title={`Slett ${label}`}
        aria-label={`Slett ${label}`}
        style={
          compact
            ? {
                padding: "0.25rem 0.5rem",
                border: "1px solid transparent",
                borderRadius: "var(--style-radius-s)",
                background: "transparent",
                color: "var(--theme-elevation-400)",
                cursor: busy ? "default" : "pointer",
                fontSize: "0.9rem",
                lineHeight: 1,
              }
            : {
                padding: "0.5rem 1rem",
                border: "1px solid var(--theme-error-500, #dc3545)",
                borderRadius: "var(--style-radius-s)",
                background: "var(--theme-error-500, #dc3545)",
                color: "#fff",
                cursor: busy ? "default" : "pointer",
                fontSize: "0.875rem",
                fontWeight: 500,
                opacity: busy ? 0.6 : 1,
              }
        }
      >
        {compact ? "🗑" : "Slett medlem"}
      </button>

      {error && !preview && (
        <p
          role="alert"
          style={{
            margin: "0.5rem 0 0",
            color: "var(--theme-error-500, #dc3545)",
            fontSize: "0.8rem",
          }}
        >
          {error}
        </p>
      )}

      {preview && (
        // Enkel overlay i stedet for Payloads Modal: komponenten brukes både i
        // en tabellrad og på detaljsiden, og skal ikke arve plassering derfra.
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: "1rem",
          }}
        >
          <div
            style={{
              background: "var(--theme-elevation-0)",
              border: "1px solid var(--theme-elevation-150)",
              borderRadius: "var(--style-radius-m)",
              padding: "1.5rem",
              maxWidth: "32rem",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <h2 style={{ margin: "0 0 0.75rem", fontSize: "1.1rem" }}>
              Slette {preview.name || preview.email}?
            </h2>

            <p
              style={{
                margin: "0 0 1rem",
                color: "var(--theme-elevation-600)",
                fontSize: "0.9rem",
                lineHeight: 1.5,
              }}
            >
              Dette kan ikke angres. Kontoen, medlemskapet, innloggingene,
              kursframgangen og chat-medlemskapene forsvinner.
            </p>

            <ul
              style={{
                margin: "0 0 1rem",
                paddingLeft: "1.1rem",
                fontSize: "0.85rem",
                color: "var(--theme-elevation-600)",
                lineHeight: 1.6,
              }}
            >
              {preview.isAdmin && (
                <li style={{ color: "var(--theme-error-500, #dc3545)" }}>
                  <strong>Dette er en administrator.</strong>
                </li>
              )}
              {preview.hasActiveStripeSubscription && (
                <li>
                  Stripe-abonnementet kanselleres, slik at personen ikke blir
                  fakturert videre.
                </li>
              )}
              {preview.soloWorkspaces.length > 0 && (
                <li>
                  Disse bedriftene slettes også, fordi ingen andre er medlem av
                  dem:{" "}
                  <strong>
                    {preview.soloWorkspaces.map((w) => w.name).join(", ")}
                  </strong>{" "}
                  — med merkevare og verktøyresultater.
                </li>
              )}
              <li>
                Medlemssøknaden og samtaler personen har startet blir stående,
                men uten kobling til kontoen.
              </li>
            </ul>

            <label
              htmlFor={inputId}
              style={{
                display: "block",
                fontSize: "0.85rem",
                marginBottom: "0.35rem",
              }}
            >
              Skriv <strong>{preview.email}</strong> for å bekrefte:
            </label>
            <input
              id={inputId}
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
              autoComplete="off"
              // biome-ignore lint/a11y/noAutofocus: dialogen har ett formål, og fokus skal ikke bli stående bak overlayet
              autoFocus
              style={{
                width: "100%",
                padding: "0.5rem 0.75rem",
                borderRadius: "var(--style-radius-s)",
                border: "1px solid var(--theme-elevation-200)",
                background: "var(--theme-input-bg)",
                color: "var(--theme-elevation-800)",
                fontSize: "0.9rem",
              }}
            />

            {error && (
              <p
                role="alert"
                style={{
                  margin: "0.5rem 0 0",
                  color: "var(--theme-error-500, #dc3545)",
                  fontSize: "0.8rem",
                }}
              >
                {error}
              </p>
            )}

            <div
              style={{
                display: "flex",
                gap: "0.5rem",
                justifyContent: "flex-end",
                marginTop: "1.25rem",
              }}
            >
              <button
                type="button"
                onClick={close}
                disabled={busy}
                style={{
                  padding: "0.5rem 1rem",
                  border: "1px solid var(--theme-elevation-200)",
                  borderRadius: "var(--style-radius-s)",
                  background: "var(--theme-elevation-0)",
                  color: "var(--theme-text)",
                  cursor: "pointer",
                  fontSize: "0.875rem",
                }}
              >
                Avbryt
              </button>
              <button
                type="button"
                onClick={confirm}
                disabled={busy || !emailMatches}
                style={{
                  padding: "0.5rem 1rem",
                  border: "1px solid var(--theme-error-500, #dc3545)",
                  borderRadius: "var(--style-radius-s)",
                  background:
                    emailMatches && !busy
                      ? "var(--theme-error-500, #dc3545)"
                      : "var(--theme-elevation-100)",
                  color:
                    emailMatches && !busy
                      ? "#fff"
                      : "var(--theme-elevation-400)",
                  cursor: emailMatches && !busy ? "pointer" : "default",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                }}
              >
                {busy ? "Sletter…" : "Slett for godt"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
