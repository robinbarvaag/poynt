"use client";

import { Button } from "@payloadcms/ui";
import { useState } from "react";
import {
  type DuplicateResult,
  getDuplicateMedia,
} from "../../actions/media-insights";

/**
 * «Finn dubletter» over medielista. Grupperer bilder som er nøyaktig samme
 * fil, eller samme motiv i ulik utgave, basert på fingeravtrykkene som
 * beregnes ved opplasting (lib/media-hash.ts).
 *
 * Panelet sletter ingenting selv — det peker på gruppene og lar redaktøren
 * åpne hvert bilde og avgjøre. «Brukt på»-panelet inne på bildet sier hvilket
 * av dem som faktisk står et sted.
 */

function formatSize(bytes: null | number): string {
  if (!bytes) return "";
  const mb = bytes / 1024 / 1024;
  return mb >= 1
    ? `${mb.toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} kB`;
}

export const MediaDuplicatesPanel = () => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DuplicateResult | null>(null);

  const onToggle = async () => {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    if (result || loading) return;
    setLoading(true);
    setResult(await getDuplicateMedia());
    setLoading(false);
  };

  return (
    <>
      <Button
        buttonStyle="pill"
        size="small"
        margin={false}
        onClick={onToggle}
        disabled={loading}
      >
        {loading ? "Leter …" : open ? "Skjul dubletter" : "Finn dubletter"}
      </Button>

      {open && (
        <div className="poynt-dupes">
          <style>{`
            .poynt-dupes {
              flex-basis: 100%;
              margin-top: 0.4rem;
              padding: 0.9rem 1rem;
              border: 1px solid var(--theme-elevation-150);
              border-radius: var(--style-radius-m, 6px);
              background: var(--theme-elevation-50);
            }
            .poynt-dupes__group {
              padding: 0.7rem 0;
              border-top: 1px solid var(--theme-elevation-100);
            }
            .poynt-dupes__group:first-of-type { border-top: 0; padding-top: 0; }
            .poynt-dupes__kind {
              font-size: 0.72rem;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.04em;
              color: var(--theme-elevation-500);
              margin: 0 0 0.45rem;
            }
            .poynt-dupes__items {
              display: flex;
              gap: 0.6rem;
              flex-wrap: wrap;
            }
            .poynt-dupes__item {
              display: block;
              width: 128px;
              color: inherit;
              text-decoration: none;
            }
            .poynt-dupes__item img {
              width: 128px;
              height: 96px;
              object-fit: cover;
              display: block;
              border: 1px solid var(--theme-elevation-150);
              border-radius: var(--style-radius-s, 4px);
            }
            .poynt-dupes__name {
              display: block;
              font-size: 0.72rem;
              margin-top: 0.25rem;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
            .poynt-dupes__sub {
              display: block;
              font-size: 0.68rem;
              color: var(--theme-elevation-500);
            }
          `}</style>

          {loading && (
            <p style={{ margin: 0, fontSize: "0.85rem" }}>
              Sammenligner bildene …
            </p>
          )}

          {result?.ok === false && (
            <p
              style={{
                margin: 0,
                fontSize: "0.85rem",
                color: "var(--theme-error-500)",
              }}
            >
              {result.error}
            </p>
          )}

          {result?.ok && result.groups.length === 0 && (
            <p style={{ margin: 0, fontSize: "0.85rem" }}>
              Ingen dubletter funnet. Bilder som ble lastet opp før
              duplikatsjekken kom, må få fingeravtrykk først — kjør
              scripts/backfill-media-hashes.ts én gang.
            </p>
          )}

          {result?.ok && result.groups.length > 0 && (
            <>
              <p style={{ margin: "0 0 0.6rem", fontSize: "0.85rem" }}>
                {result.groups.length} grupper med mulige dubletter. Åpne et
                bilde for å se hvor det er brukt før du sletter noe.
              </p>
              {result.groups.map((group) => (
                <div
                  className="poynt-dupes__group"
                  key={group.items.map((item) => item.id).join("-")}
                >
                  <p className="poynt-dupes__kind">
                    {group.kind === "identisk"
                      ? `Samme fil · ${group.items.length} kopier`
                      : `Samme motiv · ${group.items.length} utgaver`}
                  </p>
                  <div className="poynt-dupes__items">
                    {group.items.map((item) => (
                      <a
                        className="poynt-dupes__item"
                        href={`/admin/collections/media/${item.id}`}
                        key={item.id}
                      >
                        {item.thumbnailUrl ? (
                          // Admin-only; kilden er Payloads egen thumbnail-URL.
                          <img src={item.thumbnailUrl} alt="" loading="lazy" />
                        ) : null}
                        <span className="poynt-dupes__name">
                          {item.filename ?? `Bilde ${item.id}`}
                        </span>
                        <span className="poynt-dupes__sub">
                          {formatSize(item.filesize)}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </>
  );
};
