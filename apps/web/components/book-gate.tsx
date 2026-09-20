"use client";

import {
  BOOK_STORES_DISPLAY,
  type BookStore,
  DEFAULT_BOOK_STORE,
} from "@/lib/book-stores";
import { NEWSLETTER_CONSENT_TEXTS } from "@/lib/newsletter-consent-texts";
import { Button, Checkbox, Input, Label } from "@poynt/ui";
import { BookOpen, Loader2, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PrivacyNotice } from "./privacy-notice";
import { RecaptchaNotice, recaptchaHeader, useRecaptcha } from "./recaptcha";

/**
 * Døra foran en side som krever bokkjøp. Ordrenummer + butikk er alt som
 * trengs; e-post er frivillig. Ved suksess setter API-et en cookie og siden
 * lastes på nytt med innholdet.
 */
export function BookGate({ pageId, title }: { pageId: number; title: string }) {
  const router = useRouter();
  const [store, setStore] = useState<BookStore>(DEFAULT_BOOK_STORE);
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [newsletter, setNewsletter] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");
  const getRecaptchaToken = useRecaptcha("boktilgang");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setError("");

    try {
      const token = await getRecaptchaToken();
      const response = await fetch("/api/book-access", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...recaptchaHeader(token),
        },
        body: JSON.stringify({ pageId, orderNumber, store, email, newsletter }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Noe gikk galt");
      router.refresh();
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Noe gikk galt");
    }
  };

  const loading = status === "loading";

  return (
    <section className="flex min-h-[70vh] items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-3xl border bg-card p-8 shadow-sm">
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <BookOpen className="h-6 w-6" />
        </div>
        <h1 className="font-semibold text-2xl tracking-tight">{title}</h1>
        <p className="mt-2 text-muted-foreground">
          Denne siden er for deg som har kjøpt boka. Skriv inn ordrenummeret
          ditt, så er du inne — du trenger bare gjøre det én gang på denne
          enheten.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
          <fieldset className="flex flex-col gap-2" disabled={loading}>
            <legend className="mb-2 font-medium text-sm">Kjøpt hos</legend>
            <div className="grid grid-cols-3 gap-2">
              {BOOK_STORES_DISPLAY.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  aria-pressed={store === s.value}
                  onClick={() => setStore(s.value)}
                  className="rounded-xl border px-3 py-2 text-sm transition-colors hover:bg-muted aria-pressed:border-primary aria-pressed:bg-primary/10 aria-pressed:font-medium aria-pressed:text-primary"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="flex flex-col gap-2">
            <Label htmlFor="book-order">Ordrenummer</Label>
            <Input
              id="book-order"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="Står i ordrebekreftelsen"
              autoComplete="off"
              required
              disabled={loading}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="book-email">
              E-post{" "}
              {!newsletter && (
                <span className="font-normal text-muted-foreground">
                  (frivillig)
                </span>
              )}
            </Label>
            <Input
              id="book-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="navn@eksempel.no"
              autoComplete="email"
              required={newsletter}
              disabled={loading}
            />
          </div>

          {/* Alltid synlig: å krysse av gjør e-posten påkrevd. */}
          <div className="flex items-center gap-3">
            <Checkbox
              id="book-newsletter"
              checked={newsletter}
              onCheckedChange={(checked) => setNewsletter(checked === true)}
              disabled={loading}
            />
            <Label
              htmlFor="book-newsletter"
              className="font-normal text-muted-foreground text-sm"
            >
              {NEWSLETTER_CONSENT_TEXTS.bookAccess}
            </Label>
          </div>

          <PrivacyNotice
            purpose="Ordrenummeret brukes bare til å gi deg tilgang. E-posten brukes kun til nyhetsbrevet hvis du krysser av, og du kan melde deg av når som helst."
            className="text-muted-foreground"
          />
          <RecaptchaNotice className="text-muted-foreground" />

          {status === "error" && (
            <p role="alert" className="swap-in text-destructive text-sm">
              {error}
            </p>
          )}

          <Button type="submit" size="lg" disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <span className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Lås opp
              </span>
            )}
          </Button>
        </form>
      </div>
    </section>
  );
}
