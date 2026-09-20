"use client";

import { HONEYPOT_FIELD } from "@/lib/spam-heuristics";
import { Button, Input } from "@poynt/ui";
import { CheckCircle, Loader2 } from "lucide-react";
import { useState } from "react";
import { PrivacyNotice } from "./privacy-notice";
import { RecaptchaNotice, recaptchaHeader, useRecaptcha } from "./recaptcha";

interface NewsletterFormProps {
  buttonText?: string;
}

export function NewsletterForm({
  buttonText = "Abonner",
}: NewsletterFormProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");
  // Honningkrukke: fylles bare ut av roboter som leser HTML-en.
  const [website, setWebsite] = useState("");
  const getRecaptchaToken = useRecaptcha("nyhetsbrev");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) return;

    setStatus("loading");
    setErrorMessage("");

    try {
      const token = await getRecaptchaToken();
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...recaptchaHeader(token),
        },
        // Stien dokumenteres i samtykkeloggen (hvor påmeldingen skjedde).
        body: JSON.stringify({
          email,
          path: window.location.pathname,
          [HONEYPOT_FIELD]: website,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Noe gikk galt");
      }

      setStatus("success");
      setEmail("");
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Noe gikk galt");
    }
  };

  if (status === "success") {
    // Suksess-øyeblikket får et lite pop på ikonet og en myk inntoning av
    // teksten — samme grammatikk som FormSuccess/kvitteringssiden.
    return (
      <div className="flex items-center justify-center gap-2 text-primary py-2">
        <CheckCircle className="animate-success-pop h-5 w-5" />
        <span className="motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-1 motion-safe:animate-in font-medium motion-safe:duration-300 motion-safe:delay-150 motion-safe:ease-soft motion-safe:fill-mode-both">
          Takk! Du er nå påmeldt.
        </span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Input sizeVariant="lg" og Button size="lg" deler høyde via
          CONTROL_HEIGHTS — bruk alltid parene, ikke et rått <input>. */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          type="email"
          sizeVariant="lg"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Din e-postadresse"
          aria-label="E-postadresse for nyhetsbrev"
          required
          disabled={status === "loading"}
          className="flex-1 rounded-2xl border-0 bg-background text-foreground shadow-none"
        />
        <Button type="submit" size="lg" disabled={status === "loading"}>
          {status === "loading" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            buttonText
          )}
        </Button>
      </div>

      {/* Honningkrukke — skjult for mennesker og skjermlesere. */}
      <div
        aria-hidden="true"
        className="absolute left-[-9999px] h-0 overflow-hidden"
      >
        <label htmlFor={`newsletter-${HONEYPOT_FIELD}`}>Nettside</label>
        <input
          id={`newsletter-${HONEYPOT_FIELD}`}
          name={HONEYPOT_FIELD}
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>
      {status === "error" && (
        <p role="alert" className="swap-in mt-2 text-destructive text-sm">
          {errorMessage}
        </p>
      )}
      <PrivacyNotice
        purpose="Vi bruker e-posten kun til nyhetsbrevet, og du kan melde deg av når som helst."
        className="mt-3"
      />
      <RecaptchaNotice className="mt-1" />
    </form>
  );
}
