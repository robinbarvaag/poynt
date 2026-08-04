"use client";

import { useState } from "react";

/**
 * Redigerbart felt for varslingsadressene, rett på E-post-siden — det er her
 * partneren leter etter det. Lagrer til site-settings-globalen via Payload
 * REST (admin-cookien autentiserer); selve feltet er skjult i
 * Nettsted-innstillinger så dette er det ene stedet å endre det.
 */
export function NotificationEmailsField({
  initialValue,
  envFallback,
}: {
  initialValue: string;
  /** Om CONTACT_EMAIL-miljøvariabelen finnes som fallback. */
  envFallback: boolean;
}) {
  const [value, setValue] = useState(initialValue);
  const [savedValue, setSavedValue] = useState(initialValue);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle"
  );

  const save = async () => {
    setStatus("saving");
    try {
      const res = await fetch("/api/globals/site-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ notificationEmails: value.trim() }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSavedValue(value);
      setStatus("saved");
    } catch (error) {
      console.error("Lagring av varslingsadresser feilet:", error);
      setStatus("error");
    }
  };

  const dirty = value !== savedValue;

  return (
    <div
      style={{
        border: "1px solid var(--theme-elevation-150)",
        borderRadius: "10px",
        padding: "1rem 1.25rem",
        marginBottom: "1.5rem",
        maxWidth: "640px",
      }}
    >
      <label
        htmlFor="notification-emails"
        style={{
          display: "block",
          fontWeight: 600,
          marginBottom: "0.25rem",
        }}
      >
        Hvem skal ha varslene?
      </label>
      <p
        style={{
          margin: "0 0 0.75rem",
          fontSize: "0.85rem",
          color: "var(--theme-elevation-500)",
        }}
      >
        Adressene som får beskjed ved salg, nyhetsbrev-påmeldinger, henvendelser
        og venteliste. Flere adresser? Skill dem med komma.
        {!value.trim() && envFallback
          ? " Akkurat nå brukes adressen fra serveroppsettet (CONTACT_EMAIL)."
          : null}
      </p>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <input
          id="notification-emails"
          type="text"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setStatus("idle");
          }}
          placeholder="robin@poynt.no, partner@poynt.no"
          style={{
            flex: 1,
            minWidth: "260px",
            padding: "0.5rem 0.85rem",
            borderRadius: "8px",
            border: "1px solid var(--theme-elevation-150)",
            background: "var(--theme-input-bg)",
            color: "var(--theme-elevation-800)",
            fontSize: "0.9rem",
          }}
        />
        <button
          type="button"
          onClick={save}
          disabled={!dirty || status === "saving"}
          style={{
            padding: "0.5rem 1.1rem",
            borderRadius: "8px",
            border: "none",
            cursor: dirty ? "pointer" : "default",
            fontSize: "0.9rem",
            fontWeight: 600,
            background: dirty
              ? "var(--theme-elevation-800)"
              : "var(--theme-elevation-100)",
            color: dirty
              ? "var(--theme-elevation-0)"
              : "var(--theme-elevation-400)",
          }}
        >
          {status === "saving" ? "Lagrer…" : "Lagre"}
        </button>
      </div>
      {status === "saved" && (
        <p
          style={{
            margin: "0.5rem 0 0",
            fontSize: "0.85rem",
            color: "var(--theme-success-500)",
          }}
        >
          Lagret — varslene går nå til {savedValue.trim() || "CONTACT_EMAIL"}.
        </p>
      )}
      {status === "error" && (
        <p
          role="alert"
          style={{
            margin: "0.5rem 0 0",
            fontSize: "0.85rem",
            color: "var(--theme-error-500)",
          }}
        >
          Klarte ikke å lagre. Prøv igjen om et øyeblikk.
        </p>
      )}
    </div>
  );
}
