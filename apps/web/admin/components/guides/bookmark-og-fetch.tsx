"use client";

import { ogStatusText } from "@/lib/og";
import { useField } from "@payloadcms/ui";
import { useEffect, useRef, useState } from "react";

type Og = { title?: string; description?: string; image?: string };

/**
 * Live OG-henting montert som `afterInput` på URL-feltet i bokmerke-blokken.
 * Når en gyldig lenke limes inn (debouncet), kalles /api/og og søsker-feltene
 * (tittel/beskrivelse/OG-bilde/status) fylles på direkten – med en spinner –
 * uten å vente på lagring. Tomme felter fylles; manuelle verdier overstyres
 * ikke. «Hent på nytt» tvinger en ny henting.
 *
 * `path` er full sti til URL-feltet, f.eks. `content.0.items.1.url`; søskenes
 * stier utledes ved å bytte ut siste segment.
 */
export const BookmarkOgFetch = ({ path }: { path: string }) => {
  const base = path.replace(/\.url$/, "");
  const { value: url } = useField<string>({ path });
  const title = useField<string>({ path: `${base}.title` });
  const description = useField<string>({ path: `${base}.description` });
  const imageUrl = useField<string>({ path: `${base}.imageUrl` });
  const manualImage = useField<unknown>({ path: `${base}.image` });
  const ogStatus = useField<string>({ path: `${base}.ogStatus` });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastFetched = useRef<string | null>(null);

  // Hold siste fetch-logikk i en ref, så både debounce-effekten og knappen
  // alltid kjører mot ferske feltverdier uten å være effekt-avhengigheter.
  const runRef = useRef<(force: boolean) => Promise<void>>(async () => {});
  runRef.current = async (force: boolean) => {
    const u = (url ?? "").trim();
    if (!u || !/^https?:\/\//i.test(u)) return;
    if (!force && (lastFetched.current === u || imageUrl.value)) return;

    lastFetched.current = u;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/og?url=${encodeURIComponent(u)}`);
      if (!res.ok) throw new Error(String(res.status));
      const og = (await res.json()) as Og;

      if (og.title && !title.value) title.setValue(og.title);
      if (og.description && !description.value) {
        description.setValue(og.description);
      }
      if (og.image) imageUrl.setValue(og.image);

      ogStatus.setValue(
        ogStatusText(og, {
          title: Boolean(og.title || title.value),
          description: Boolean(og.description || description.value),
          image: Boolean(og.image || imageUrl.value || manualImage.value),
        })
      );
    } catch {
      setError("Kunne ikke hente info fra lenken.");
    } finally {
      setLoading(false);
    }
  };

  // Auto-hent når URL-en endrer seg og vi ikke allerede har et OG-bilde.
  const hasImageUrl = Boolean(imageUrl.value);
  useEffect(() => {
    const u = (url ?? "").trim();
    if (!/^https?:\/\//i.test(u) || hasImageUrl || lastFetched.current === u) {
      return;
    }
    const t = setTimeout(() => runRef.current(false), 800);
    return () => clearTimeout(t);
  }, [url, hasImageUrl]);

  const validUrl = /^https?:\/\//i.test((url ?? "").trim());

  return (
    <div
      style={{
        marginTop: "0.4rem",
        display: "flex",
        alignItems: "center",
        gap: "0.6rem",
        minHeight: "1.4rem",
        fontSize: "0.8rem",
      }}
    >
      {loading ? (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
          }}
        >
          <Spinner /> Henter forhåndsvisning…
        </span>
      ) : (
        <button
          type="button"
          onClick={() => runRef.current(true)}
          disabled={!validUrl}
          className="btn btn--style-secondary btn--size-small"
          style={{ margin: 0 }}
        >
          {hasImageUrl ? "Hent på nytt" : "Hent forhåndsvisning"}
        </button>
      )}
      {error && (
        <span style={{ color: "var(--theme-error-500)" }}>{error}</span>
      )}
    </div>
  );
};

function Spinner() {
  return (
    <span
      aria-hidden
      style={{
        width: "0.9rem",
        height: "0.9rem",
        border: "2px solid var(--theme-elevation-200)",
        borderTopColor: "var(--theme-elevation-800)",
        borderRadius: "50%",
        display: "inline-block",
        animation: "spin 0.7s linear infinite",
      }}
    >
      <style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style>
    </span>
  );
}
