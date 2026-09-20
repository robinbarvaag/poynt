"use client";

import {
  Button,
  useDocumentDrawer,
  useListQuery,
  useSelection,
} from "@payloadcms/ui";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getUnusedMediaIds } from "../../actions/media-insights";
import { MediaDuplicatesPanel } from "./media-duplicates-panel";

/**
 * Rutenett-visning for Media-lista, montert som `beforeListTable`.
 *
 * Payload viser mediebiblioteket som en vanlig tabell med bittesmå
 * thumbnails. Det er et bevisst valg fra deres side — gallerivisningen ble
 * fjernet da de innførte bulk-operasjoner (payloadcms/payload#2540) — men for
 * et bildearkiv er det nesten ubrukelig. Payload har riktignok kort-grid i
 * *mappevisningen* (`ItemCardGrid`), men de komponentene er bundet til
 * folder-konteksten og kan ikke gjenbrukes her.
 *
 * Vi legger derfor rutenettet ved siden av tabellen og skjuler tabellen med
 * css når rutenettet er aktivt. Poenget er at alt Payload gjør rundt lista —
 * søk, filtre, kolonner, mapper, paginering og masse-sletting — fortsatt
 * virker, i stedet for at vi bytter ut hele listevisningen og må bygge det på
 * nytt selv.
 */

type MediaDoc = {
  /** Postgres-serial, så alltid tall her. */
  id: number;
  alt?: null | string;
  filename?: null | string;
  mimeType?: null | string;
  thumbnailURL?: null | string;
  url?: null | string;
  sizes?: null | {
    thumbnail?: null | { url?: null | string };
  };
};

type View = "grid" | "table";

const VIEW_STORAGE_KEY = "poynt-media-view";

/** Filendelsen vist på video/pdf og andre filer vi ikke kan tegne. */
function fileLabel(doc: MediaDoc): string {
  const ext = doc.filename?.split(".").pop();
  return ext ? ext.toUpperCase() : "FIL";
}

function previewSrc(doc: MediaDoc): null | string {
  return doc.thumbnailURL || doc.sizes?.thumbnail?.url || doc.url || null;
}

const MediaCard = ({
  doc,
  onSaved,
  unused,
}: {
  doc: MediaDoc;
  onSaved: () => void;
  unused: boolean;
}) => {
  const [DocumentDrawer, , { openDrawer }] = useDocumentDrawer({
    collectionSlug: "media",
    id: doc.id,
  });
  const { selected, setSelection } = useSelection();
  const [hovered, setHovered] = useState(false);

  const isSelected = selected.get(doc.id) === true;
  const isImage = Boolean(doc.mimeType?.startsWith("image/"));
  const missingAlt = isImage && !doc.alt?.trim();
  // Thumbnailen av en gif er et stillbilde. Ved hover viser vi originalen, så
  // man ser hva gif-en faktisk gjør før man velger den.
  const src =
    hovered && doc.mimeType === "image/gif" && doc.url
      ? doc.url
      : previewSrc(doc);

  return (
    <div
      className={`poynt-media-card${
        isSelected ? " poynt-media-card--selected" : ""
      }`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Avkrysningsboksen ligger som søsken til knappen, ikke inni den —
          interaktive elementer kan ikke nøstes i hverandre. */}
      <div className="poynt-media-card__select">
        <input
          type="checkbox"
          checked={isSelected}
          aria-label={`Velg ${doc.filename ?? "fil"}`}
          onChange={() => setSelection(doc.id)}
        />
      </div>

      {unused && (
        <span
          className="poynt-media-card__unused"
          title="Står ikke på noen side"
        >
          Ikke i bruk
        </span>
      )}

      <button
        type="button"
        className="poynt-media-card__open"
        onClick={openDrawer}
        title={doc.filename ?? undefined}
      >
        <span className="poynt-media-card__frame">
          {isImage && src ? (
            // Bevisst <img> og ikke next/image: kilden er Payloads egen
            // thumbnail-URL, og admin går utenom frontendens bildepipeline.
            <img src={src} alt="" loading="lazy" />
          ) : (
            <span className="poynt-media-card__filetype">{fileLabel(doc)}</span>
          )}
        </span>
        <span className="poynt-media-card__meta">
          <span className="poynt-media-card__name">
            {doc.filename ?? `Uten filnavn (${doc.id})`}
          </span>
          {missingAlt ? (
            <span className="poynt-media-card__warning">Mangler alt-tekst</span>
          ) : (
            <span className="poynt-media-card__alt">
              {doc.alt?.trim() || " "}
            </span>
          )}
        </span>
      </button>

      <DocumentDrawer onSave={onSaved} />
    </div>
  );
};

export const MediaGrid = () => {
  const { data } = useListQuery();
  const router = useRouter();
  const [view, setView] = useState<View>("grid");
  const [unusedIds, setUnusedIds] = useState<Set<number>>(new Set());

  // Lesing av lagret valg skjer etter montering, ellers spriker server- og
  // klient-render.
  useEffect(() => {
    try {
      if (localStorage.getItem(VIEW_STORAGE_KEY) === "table") setView("table");
    } catch {
      // Privat nettleservindu e.l. — rutenett er en grei standard.
    }
  }, []);

  const chooseView = (next: View) => {
    setView(next);
    try {
      localStorage.setItem(VIEW_STORAGE_KEY, next);
    } catch {
      // Valget gjelder da bare denne økta.
    }
  };

  const docs = (data?.docs ?? []) as MediaDoc[];
  const idKey = docs.map((doc) => doc.id).join(",");

  // Hvilke av bildene på denne siden som ikke står noe sted. Ett oppslag for
  // hele siden, ikke ett per kort. `idKey` er den stabile nøkkelen for docs.
  useEffect(() => {
    if (!idKey) {
      setUnusedIds(new Set());
      return;
    }
    let active = true;
    getUnusedMediaIds(idKey.split(",").map(Number)).then((res) => {
      if (active && res.ok) setUnusedIds(new Set(res.unusedIds));
    });
    return () => {
      active = false;
    };
  }, [idKey]);

  if (docs.length === 0) return null;

  const missingAltCount = docs.filter(
    (doc) => doc.mimeType?.startsWith("image/") && !doc.alt?.trim()
  ).length;

  return (
    <div className="poynt-media">
      <style>{`
        /* Tabellen skjules kun når rutenettet er på, og kun for media. */
        .collection-list--media.poynt-media-hide-table .collection-list__tables {
          display: none;
        }
        .poynt-media__toolbar {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
          margin-bottom: 1rem;
        }
        .poynt-media__hint {
          margin: 0;
          font-size: 0.8rem;
          color: var(--theme-elevation-500);
        }
        .poynt-media__grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        .poynt-media-card {
          position: relative;
          border: 1px solid var(--theme-elevation-150);
          border-radius: var(--style-radius-m, 6px);
          background: var(--theme-elevation-50);
          overflow: hidden;
          transition: border-color 0.15s ease, transform 0.15s ease;
        }
        .poynt-media-card:hover {
          border-color: var(--theme-elevation-400);
          transform: translateY(-2px);
        }
        .poynt-media-card--selected {
          border-color: var(--theme-success-500);
          box-shadow: 0 0 0 1px var(--theme-success-500);
        }
        @media (prefers-reduced-motion: reduce) {
          .poynt-media-card { transition: none; }
          .poynt-media-card:hover { transform: none; }
        }
        .poynt-media-card__select {
          position: absolute;
          top: 0.45rem;
          left: 0.45rem;
          z-index: 1;
          display: flex;
          padding: 0.2rem;
          border-radius: var(--style-radius-s, 4px);
          background: var(--theme-elevation-0);
          box-shadow: 0 0 0 1px var(--theme-elevation-150);
        }
        .poynt-media-card__unused {
          position: absolute;
          top: 0.45rem;
          right: 0.45rem;
          z-index: 1;
          padding: 0.1rem 0.35rem;
          border-radius: var(--style-radius-s, 4px);
          font-size: 0.66rem;
          font-weight: 600;
          color: var(--theme-elevation-0);
          background: var(--theme-elevation-700);
        }
        .poynt-media-card__open {
          display: block;
          width: 100%;
          padding: 0;
          border: 0;
          background: none;
          color: inherit;
          text-align: left;
          cursor: pointer;
          font: inherit;
        }
        .poynt-media-card__frame {
          display: flex;
          align-items: center;
          justify-content: center;
          aspect-ratio: 4 / 3;
          background: var(--theme-elevation-100);
          overflow: hidden;
        }
        .poynt-media-card__frame img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .poynt-media-card__filetype {
          font-size: 0.85rem;
          font-weight: 600;
          letter-spacing: 0.06em;
          color: var(--theme-elevation-500);
        }
        .poynt-media-card__meta {
          display: grid;
          gap: 0.15rem;
          padding: 0.5rem 0.6rem 0.6rem;
        }
        .poynt-media-card__name,
        .poynt-media-card__alt,
        .poynt-media-card__warning {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .poynt-media-card__name {
          font-size: 0.8rem;
          color: var(--theme-text);
        }
        .poynt-media-card__alt {
          font-size: 0.72rem;
          color: var(--theme-elevation-500);
        }
        .poynt-media-card__warning {
          font-size: 0.72rem;
          font-weight: 600;
          color: var(--theme-warning-500, #b58100);
        }
      `}</style>

      <div className="poynt-media__toolbar">
        <Button
          buttonStyle={view === "grid" ? "primary" : "pill"}
          size="small"
          margin={false}
          onClick={() => chooseView("grid")}
        >
          Rutenett
        </Button>
        <Button
          buttonStyle={view === "table" ? "primary" : "pill"}
          size="small"
          margin={false}
          onClick={() => chooseView("table")}
        >
          Tabell
        </Button>
        <MediaDuplicatesPanel />
        {view === "grid" && (
          <p className="poynt-media__hint">
            {missingAltCount > 0
              ? `${missingAltCount} av ${docs.length} bilder på denne siden mangler alt-tekst. Klikk på et bilde for å fylle den inn.`
              : "Klikk på et bilde for å redigere det uten å forlate lista."}
          </p>
        )}
      </div>

      {view === "grid" && (
        <>
          {/* Klassen som skjuler tabellen må ligge på Payloads egen wrapper. */}
          <HideDefaultTable />
          <div className="poynt-media__grid">
            {docs.map((doc) => (
              <MediaCard
                key={doc.id}
                doc={doc}
                onSaved={() => router.refresh()}
                unused={unusedIds.has(doc.id)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

/**
 * Setter klassen som skjuler standardtabellen på `.collection-list--media`,
 * og rydder opp igjen når rutenettet slås av eller lista forlates.
 */
const HideDefaultTable = () => {
  useEffect(() => {
    const list = document.querySelector(".collection-list--media");
    if (!list) return;
    list.classList.add("poynt-media-hide-table");
    return () => list.classList.remove("poynt-media-hide-table");
  }, []);
  return null;
};
