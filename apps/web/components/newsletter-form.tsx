"use client";

import { Button } from "@poynt/ui";
import { CheckCircle, Loader2 } from "lucide-react";
import { useState } from "react";

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) return;

    setStatus("loading");
    setErrorMessage("");

    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
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
    return (
      <div className="flex items-center justify-center gap-2 text-primary py-2">
        <CheckCircle className="h-5 w-5" />
        <span className="font-medium">Takk! Du er nå påmeldt.</span>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="relative flex flex-col gap-3 sm:flex-row"
    >
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Din e-postadresse"
        required
        disabled={status === "loading"}
        className="flex-1 rounded-2xl border-0 bg-background px-5 py-3 text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
      />
      <Button type="submit" size="lg" disabled={status === "loading"}>
        {status === "loading" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          buttonText
        )}
      </Button>
      {status === "error" && (
        <p className="absolute -bottom-6 left-0 text-sm text-destructive">
          {errorMessage}
        </p>
      )}
    </form>
  );
}
