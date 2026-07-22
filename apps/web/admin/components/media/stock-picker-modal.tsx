"use client";

import { Drawer, useModal } from "@payloadcms/ui";
import { useCallback, useState } from "react";
import {
  type StockImage,
  type StockSource,
  importStockImage,
  searchGiphy,
  searchPexels,
} from "../../actions/stock-media";

/**
 * Delt søke-skuff (Payload `Drawer`) for stock-bilder (Pexels foto + Giphy GIF).
 * Brukes av to wrappere: `StockMediaPicker` (Media-liste / media-skjema) og
 * `StockFieldButton` (auto-velg på upload-felt).
 *
 * Vi bruker Payloads innebygde `Drawer` framfor en egen overlay: den matcher
 * admin-stilen og — viktig — portaleres ut av dokument-skjemaet, så vi unngår
 * et ulovlig `<form>`-i-`<form>`. Av samme grunn er søkefeltet en `<div>` med
 * Enter-håndtering, ikke et `<form>`.
 *
 * `mode` styrer hjelpetekst + om skuffen lukkes etter valg:
 *  - "library": bildet legges i Media-biblioteket (skuffen blir stående åpen).
 *  - "select": bildet velges rett inn i feltet (skuffen lukkes).
 */

const tabs: {
  value: StockSource;
  icon: string;
  title: string;
  subtitle: string;
  placeholder: string;
}[] = [
  {
    value: "pexels",
    icon: "📷",
    title: "Pexels",
    subtitle: "Gratis foto",
    placeholder: "F.eks. «kontor», «natur», «team»…",
  },
  {
    value: "giphy",
    icon: "🎞️",
    title: "Giphy",
    subtitle: "Animerte GIF-er",
    placeholder: "F.eks. «celebration», «thumbs up»…",
  },
];

export type StockPickerDrawerProps = {
  drawerSlug: string;
  onImported: (res: { id: string | number; filename: string }) => void;
  mode: "library" | "select";
};

export const StockPickerDrawer = ({
  drawerSlug,
  onImported,
  mode,
}: StockPickerDrawerProps) => {
  const { closeModal } = useModal();
  const [tab, setTab] = useState<StockSource>("pexels");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [images, setImages] = useState<StockImage[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importingId, setImportingId] = useState<string | null>(null);
  const [importedIds, setImportedIds] = useState<Set<string>>(new Set());
  const [notice, setNotice] = useState<string | null>(null);

  const runSearch = useCallback(
    async (nextPage: number, append: boolean) => {
      if (!query.trim()) return;
      setLoading(true);
      setError(null);
      const fn = tab === "pexels" ? searchPexels : searchGiphy;
      const result = await fn(query, nextPage);
      setLoading(false);
      if (!result.ok) {
        setError(result.error);
        if (!append) setImages([]);
        return;
      }
      setHasMore(result.hasMore);
      setPage(nextPage);
      setImages((prev) =>
        append ? [...prev, ...result.images] : result.images
      );
    },
    [query, tab]
  );

  const switchTab = (next: StockSource) => {
    if (next === tab) return;
    setTab(next);
    setImages([]);
    setError(null);
    setHasMore(false);
    setPage(1);
  };

  const onImport = async (image: StockImage) => {
    setImportingId(image.id);
    setError(null);
    setNotice(null);
    const result = await importStockImage(image);
    setImportingId(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setImportedIds((prev) => new Set(prev).add(image.id));
    setNotice(
      mode === "select"
        ? `«${result.filename}» er valgt ✓`
        : `Importert «${result.filename}» til Media.`
    );
    onImported(result);
    if (mode === "select") {
      closeModal(drawerSlug);
    }
  };

  return (
    <Drawer slug={drawerSlug} title="Finn gratis bilde">
      <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
        {/* Kilde-valg — tydelig segmentert kontroll */}
        <div>
          <span
            style={{
              display: "block",
              marginBottom: "0.45rem",
              fontSize: "0.8em",
              fontWeight: 600,
              color: "var(--theme-elevation-500)",
            }}
          >
            Velg kilde
          </span>
          <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
            {tabs.map((t) => {
              const active = tab === t.value;
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => switchTab(t.value)}
                  aria-pressed={active}
                  style={{
                    flex: "1 1 180px",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.65rem",
                    textAlign: "left",
                    padding: "0.7rem 0.9rem",
                    cursor: "pointer",
                    borderRadius: "var(--style-radius-m, 6px)",
                    border: active
                      ? "2px solid var(--theme-success-500)"
                      : "1px solid var(--theme-elevation-150)",
                    background: active
                      ? "var(--theme-success-50, var(--theme-elevation-100))"
                      : "var(--theme-elevation-50)",
                    color: "var(--theme-text)",
                  }}
                >
                  <span
                    style={{ fontSize: "1.5em", lineHeight: 1 }}
                    aria-hidden
                  >
                    {t.icon}
                  </span>
                  <span
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.1rem",
                    }}
                  >
                    <strong style={{ fontSize: "0.95em" }}>{t.title}</strong>
                    <span
                      style={{
                        fontSize: "0.78em",
                        color: "var(--theme-elevation-500)",
                      }}
                    >
                      {t.subtitle}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Søk — bevisst en <div>, ikke <form>, for å aldri havne i <form>-i-<form> */}
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                runSearch(1, false);
              }
            }}
            placeholder={tabs.find((t) => t.value === tab)?.placeholder}
            className="field-type text"
            style={{
              flex: 1,
              padding: "0.5rem 0.75rem",
              borderRadius: "var(--style-radius-s, 4px)",
              border: "1px solid var(--theme-elevation-150)",
              background: "var(--theme-input-bg, var(--theme-elevation-50))",
              color: "var(--theme-text)",
            }}
          />
          <button
            type="button"
            onClick={() => runSearch(1, false)}
            disabled={loading || !query.trim()}
            className="btn btn--style-primary btn--size-medium"
            style={{ margin: 0 }}
          >
            {loading ? "Søker…" : "Søk"}
          </button>
        </div>

        {/* Notices */}
        {error && (
          <p
            style={{
              margin: 0,
              padding: "0.6rem 0.85rem",
              borderRadius: "var(--style-radius-s, 4px)",
              background: "var(--theme-error-100)",
              color: "var(--theme-error-700)",
              fontSize: "0.88em",
            }}
          >
            {error}
          </p>
        )}
        {notice && (
          <p
            style={{
              margin: 0,
              padding: "0.6rem 0.85rem",
              borderRadius: "var(--style-radius-s, 4px)",
              background: "var(--theme-success-100)",
              color: "var(--theme-success-700)",
              fontSize: "0.88em",
            }}
          >
            {notice}
            {mode === "library"
              ? " Oppdater siden for å se det i lista, eller velg det direkte i et bildefelt."
              : ""}
          </p>
        )}

        {/* Results */}
        {images.length === 0 && !loading && (
          <p
            style={{
              color: "var(--theme-elevation-500)",
              fontSize: "0.9em",
              margin: 0,
            }}
          >
            Søk etter et motiv for å se forslag.{" "}
            {tab === "pexels"
              ? "Gratis foto fra Pexels."
              : "Animerte GIF-er fra Giphy."}
          </p>
        )}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
            gap: "0.75rem",
          }}
        >
          {images.map((img) => {
            const done = importedIds.has(img.id);
            const busy = importingId === img.id;
            return (
              <button
                key={`${img.source}-${img.id}`}
                type="button"
                onClick={() => !busy && !done && onImport(img)}
                disabled={busy || done}
                title={img.credit}
                style={{
                  position: "relative",
                  padding: 0,
                  border: done
                    ? "2px solid var(--theme-success-500)"
                    : "1px solid var(--theme-elevation-150)",
                  borderRadius: "var(--style-radius-s, 4px)",
                  overflow: "hidden",
                  cursor: busy || done ? "default" : "pointer",
                  background: "var(--theme-elevation-50)",
                  aspectRatio: "1 / 1",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.thumbUrl}
                  alt={img.alt}
                  loading="lazy"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
                <span
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background:
                      busy || done ? "rgba(0,0,0,0.45)" : "transparent",
                    color: "#fff",
                    fontSize: "0.85em",
                    fontWeight: 600,
                  }}
                >
                  {busy ? "Importerer…" : done ? "✓ Importert" : ""}
                </span>
                <span
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: 0,
                    padding: "0.2rem 0.4rem",
                    fontSize: "0.7em",
                    color: "#fff",
                    background: "linear-gradient(transparent, rgba(0,0,0,0.7))",
                    textAlign: "left",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {img.credit}
                </span>
              </button>
            );
          })}
        </div>

        {hasMore && (
          <div style={{ textAlign: "center" }}>
            <button
              type="button"
              onClick={() => runSearch(page + 1, true)}
              disabled={loading}
              className="btn btn--style-secondary btn--size-medium"
            >
              {loading ? "Laster…" : "Vis flere"}
            </button>
          </div>
        )}

        <p
          style={{
            margin: 0,
            fontSize: "0.78em",
            color: "var(--theme-elevation-400)",
          }}
        >
          Klikk på et bilde for å {mode === "select" ? "velge" : "importere"}{" "}
          det. Kreditering lagres automatisk. Foto fra Pexels og GIF-er fra
          Giphy er gratis å bruke.
        </p>
      </div>
    </Drawer>
  );
};
