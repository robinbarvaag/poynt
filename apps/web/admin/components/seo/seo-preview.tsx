"use client";

import { useFormFields } from "@payloadcms/ui";
import { type CSSProperties, useEffect, useState } from "react";

/**
 * Live SEO-forhåndsvisning i admin: Google-utseende (SERP) + delingskort
 * (Open Graph) basert på feltene i SEO-fanen. Montert som UI-felt inne i
 * `meta`-gruppen — både seoPlugin-collections (pages/products/blog-posts) og
 * globals med `seoMetaField` bruker samme gruppenavn, så komponenten virker
 * begge steder.
 *
 * Uten valgt delingsbilde vises det dynamiske merkevare-kortet fra
 * `/api/og-image` — nøyaktig det sosiale medier vil vise.
 */

const SITE_NAME = "Poynt";
const OG_RATIO = 1200 / 630;

type MediaDoc = {
  url?: string | null;
  width?: number | null;
  height?: number | null;
  filesize?: number | null;
  mimeType?: string | null;
  sizes?: {
    og?: { url?: string | null } | null;
  } | null;
};

function useMetaValue(path: string): unknown {
  return useFormFields(([fields]) => fields[path]?.value);
}

function lengthHint(
  len: number,
  min: number,
  max: number,
  what: string
): { text: string; ok: boolean } {
  if (len === 0) {
    return { text: `${what} mangler`, ok: false };
  }
  if (len < min) {
    return {
      text: `${len} tegn — litt kort, sikt på ${min}–${max}`,
      ok: false,
    };
  }
  if (len > max) {
    return {
      text: `${len} tegn — kan bli avkortet (maks ~${max})`,
      ok: false,
    };
  }
  return { text: `${len} tegn — bra`, ok: true };
}

export const SeoPreview = () => {
  const title = (useMetaValue("meta.title") as string) || "";
  const description = (useMetaValue("meta.description") as string) || "";
  const imageId = useMetaValue("meta.image") as
    | number
    | string
    | { id?: number | string }
    | null
    | undefined;

  const [media, setMedia] = useState<MediaDoc | null>(null);
  // Cache-buster: nytt tidsstempel per åpning (og per «Oppdater»-klikk) så
  // nettleseren ikke viser et gammelt cachet delingskort.
  const [refreshKey, setRefreshKey] = useState(() => Date.now());

  const resolvedImageId =
    imageId && typeof imageId === "object" ? imageId.id : imageId;

  useEffect(() => {
    if (!resolvedImageId) {
      setMedia(null);
      return;
    }
    let cancelled = false;
    fetch(`/api/media/${resolvedImageId}`, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((doc: MediaDoc | null) => {
        if (!cancelled) setMedia(doc);
      })
      .catch(() => {
        if (!cancelled) setMedia(null);
      });
    return () => {
      cancelled = true;
    };
  }, [resolvedImageId]);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const displayHost = origin.replace(/^https?:\/\//, "") || "poynt.no";

  // Titler som selv starter med merkenavnet (f.eks. forsiden, som bruker
  // absolutt tittel) får ikke «| Poynt»-suffikset i frontend — speil det her.
  const startsWithBrand = title.toLowerCase().startsWith("poynt");
  const fullTitle = title
    ? startsWithBrand
      ? title
      : `${title} | ${SITE_NAME}`
    : "";
  const titleHint = lengthHint(fullTitle.length, 40, 60, "Tittel");
  const descHint = lengthHint(description.length, 120, 160, "Beskrivelse");

  // Speiler frontend-logikken i lib/seo.ts (resolveOgImage): bilder som
  // allerede er ~1,91:1 brukes direkte; alt annet vises i merkevare-kortet
  // med tittel + CTA i stedet for å beskjæres.
  const w = media?.width ?? 0;
  const h = media?.height ?? 0;
  const ratio = w && h ? w / h : null;
  const nearOgRatio =
    ratio !== null && Math.abs(ratio - OG_RATIO) / OG_RATIO <= 0.1;

  let cardImage: string;
  let composited = false;
  if (media?.url && nearOgRatio) {
    cardImage = media.sizes?.og?.url || media.url;
  } else if (media?.url) {
    composited = true;
    const fit =
      ratio !== null && ratio >= 0.75 && ratio <= 1.72 ? "cover" : "contain";
    cardImage = `/api/og-image?title=${encodeURIComponent(title || SITE_NAME)}&img=${encodeURIComponent(media.url)}&fit=${fit}&_=${refreshKey}`;
  } else {
    cardImage = `/api/og-image?title=${encodeURIComponent(title || SITE_NAME)}&_=${refreshKey}`;
  }

  const mutedStyle: CSSProperties = {
    fontSize: "0.75rem",
    color: "var(--theme-elevation-500)",
    margin: "0.15rem 0 0",
  };

  return (
    <div
      style={{
        border: "1px solid var(--theme-elevation-150)",
        borderRadius: "8px",
        padding: "1rem",
        marginBottom: "1.5rem",
        display: "grid",
        gap: "1.25rem",
      }}
    >
      <div>
        <p
          style={{
            fontSize: "0.8rem",
            fontWeight: 600,
            margin: "0 0 0.5rem",
            color: "var(--theme-elevation-600)",
          }}
        >
          Slik kan siden se ut i Google
        </p>
        <div
          style={{
            background: "var(--theme-elevation-0)",
            border: "1px solid var(--theme-elevation-100)",
            borderRadius: "8px",
            padding: "0.85rem 1rem",
          }}
        >
          <p style={{ fontSize: "0.75rem", margin: 0, color: "#202124" }}>
            <span style={{ color: "var(--theme-elevation-800)" }}>
              {displayHost}
            </span>
          </p>
          <p
            style={{
              color: "#1a0dab",
              fontSize: "1.05rem",
              margin: "0.15rem 0",
              lineHeight: 1.3,
            }}
          >
            {fullTitle || "(Ingen meta-tittel satt)"}
          </p>
          <p
            style={{
              color: "#4d5156",
              fontSize: "0.85rem",
              margin: 0,
              lineHeight: 1.45,
            }}
          >
            {description ||
              "Ingen meta-beskrivelse — Google velger selv tekst fra siden."}
          </p>
        </div>
        <p
          style={{
            ...mutedStyle,
            color: titleHint.ok
              ? "var(--theme-success-500)"
              : "var(--theme-warning-600, #b45309)",
          }}
        >
          Tittel (med «| Poynt»): {titleHint.text}
        </p>
        <p
          style={{
            ...mutedStyle,
            color: descHint.ok
              ? "var(--theme-success-500)"
              : "var(--theme-warning-600, #b45309)",
          }}
        >
          Beskrivelse: {descHint.text}
        </p>
      </div>

      <div>
        <p
          style={{
            fontSize: "0.8rem",
            fontWeight: 600,
            margin: "0 0 0.5rem",
            color: "var(--theme-elevation-600)",
          }}
        >
          Slik kan delingskortet se ut (Facebook/LinkedIn/X)
        </p>
        <div
          style={{
            maxWidth: "480px",
            border: "1px solid var(--theme-elevation-150)",
            borderRadius: "10px",
            overflow: "hidden",
            background: "var(--theme-elevation-0)",
          }}
        >
          <img
            src={cardImage}
            alt=""
            style={{
              width: "100%",
              aspectRatio: "1200 / 630",
              objectFit: "cover",
              display: "block",
              background: "var(--theme-elevation-100)",
            }}
          />
          <div style={{ padding: "0.6rem 0.85rem" }}>
            <p
              style={{
                fontSize: "0.7rem",
                textTransform: "uppercase",
                color: "var(--theme-elevation-500)",
                margin: 0,
              }}
            >
              {displayHost}
            </p>
            <p
              style={{
                fontSize: "0.9rem",
                fontWeight: 600,
                margin: "0.15rem 0 0",
              }}
            >
              {fullTitle || SITE_NAME}
            </p>
            {description && (
              <p style={{ ...mutedStyle, fontSize: "0.8rem" }}>{description}</p>
            )}
          </div>
        </div>
        {!resolvedImageId && (
          <p style={mutedStyle}>
            Ingen delingsbilde valgt — det automatiske Poynt-kortet over brukes
            i stedet. Det er helt fint, men et eget bilde kan gi flere klikk.
          </p>
        )}
        {composited && (
          <p style={mutedStyle}>
            Bildet er {w}×{h} (ikke 1,91:1), så det vises inne i Poynt-kortet
            sammen med tittel og lenke — i stedet for å beskjæres. Utseendet
            styres under Nettsted-innstillinger → Delingsbilder.
          </p>
        )}
        <button
          type="button"
          onClick={() => setRefreshKey(Date.now())}
          className="btn btn--style-secondary btn--size-small"
          style={{ marginTop: "0.6rem" }}
        >
          Oppdater forhåndsvisning
        </button>
      </div>
    </div>
  );
};
