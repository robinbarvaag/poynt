"use client";

import { STORE_STATUS_OPTIONS, labelFor } from "@/lib/boksalg/constants";
import type { StoreRow } from "@/lib/boksalg/dashboard";
import { Button } from "@poynt/ui";
import { MaximizeIcon, MinusIcon, PlusIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { STATUS_COLORS } from "./chart-tokens";
import { NORWAY_PATH, NORWAY_VIEWBOX, projectNorway } from "./norway-map";

/**
 * Norgeskart med en prikk per butikk. Størrelsen på prikken følger antall
 * eksemplarer; fargen følger status (har boka / gått tom / ikke hatt) og står
 * alltid sammen med tekst i legenden og tooltipen — aldri farge alene.
 *
 * Klikk på en prikk velger fylket: tabellen under filtreres, og kartet zoomer
 * inn på butikkene i fylket. Pluss/minus zoomer videre rundt samme punkt;
 * «Hele landet» nullstiller alt.
 *
 * Zoomen er en CSS-transform på en <g>, ikke en ny viewBox — da kan den
 * animeres, og prikkene beholder synlig størrelse ved å dele på skalaen.
 */

const { width: W, height: H } = NORWAY_VIEWBOX;
const MIN_ZOOM = 1;
const MAX_ZOOM = 7;
const ZOOM_STEP = 1.5;
/** Luft rundt butikkene i et fylke, i kartenheter. */
const REGION_PAD = 28;

interface View {
  scale: number;
  cx: number;
  cy: number;
}

const WHOLE_COUNTRY: View = { scale: 1, cx: W / 2, cy: H / 2 };

interface Dot {
  store: StoreRow;
  x: number;
  y: number;
}

function radius(qty: number): number {
  if (qty <= 0) return 2.6;
  return Math.min(9, 3.5 + Math.sqrt(qty) * 1.4);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Utsnittet som viser alle butikkene i fylket, med litt luft rundt. */
function viewForRegion(dots: Dot[], region: string): View | null {
  const inRegion = dots.filter((dot) => dot.store.region === region);
  if (inRegion.length === 0) return null;

  let minX = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  for (const dot of inRegion) {
    minX = Math.min(minX, dot.x);
    maxX = Math.max(maxX, dot.x);
    minY = Math.min(minY, dot.y);
    maxY = Math.max(maxY, dot.y);
  }

  const boxW = maxX - minX + REGION_PAD * 2;
  const boxH = maxY - minY + REGION_PAD * 2;
  return {
    scale: clamp(Math.min(W / boxW, H / boxH), MIN_ZOOM, MAX_ZOOM),
    cx: (minX + maxX) / 2,
    cy: (minY + maxY) / 2,
  };
}

export function StoreMap({
  stores,
  selectedRegion,
  onSelectRegion,
}: {
  stores: StoreRow[];
  selectedRegion: string | null;
  onSelectRegion: (region: string | null) => void;
}) {
  const [hover, setHover] = useState<StoreRow | null>(null);
  // Manuell zoom (pluss/minus) gjelder bare for fylket den ble satt i; bytter
  // fylket, gjelder fylkets eget utsnitt igjen.
  const [manual, setManual] = useState<{
    region: string | null;
    view: View;
  } | null>(null);

  const dots = useMemo<Dot[]>(
    () =>
      stores
        .filter((store) => store.latitude !== null && store.longitude !== null)
        // Tegn butikkene med boka sist, så de ligger øverst.
        .sort((a, b) => a.currentQty - b.currentQty)
        .map((store) => ({
          store,
          ...projectNorway(store.latitude ?? 0, store.longitude ?? 0),
        })),
    [stores]
  );

  const regionView = useMemo(
    () => (selectedRegion ? viewForRegion(dots, selectedRegion) : null),
    [dots, selectedRegion]
  );

  const view =
    manual && manual.region === selectedRegion
      ? manual.view
      : (regionView ?? WHOLE_COUNTRY);

  const zoomBy = (factor: number) => {
    const scale = clamp(view.scale * factor, MIN_ZOOM, MAX_ZOOM);
    setManual({
      region: selectedRegion,
      view:
        scale === MIN_ZOOM
          ? WHOLE_COUNTRY
          : { scale, cx: view.cx, cy: view.cy },
    });
  };

  const reset = () => {
    setManual(null);
    onSelectRegion(null);
  };

  const counts = useMemo(() => {
    const result = { har_boka: 0, gatt_tom: 0, ikke_hatt: 0 };
    for (const store of stores) result[store.status] += 1;
    return result;
  }, [stores]);

  const inSelectedRegion = selectedRegion
    ? stores.filter((store) => store.region === selectedRegion).length
    : 0;

  const { scale } = view;
  const tx = W / 2 - scale * view.cx;
  const ty = H / 2 - scale * view.cy;
  // Prikkene vokser med kvadratroten av zoomen: synlige når man er tett på,
  // uten å bli klumper.
  const dotScale = Math.sqrt(scale);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        {STORE_STATUS_OPTIONS.map((option) => (
          <span key={option.value} className="flex items-center gap-1.5">
            <span
              className="inline-block size-3 rounded-full"
              style={{ background: STATUS_COLORS[option.value] }}
              aria-hidden
            />
            <span className="text-muted-foreground">
              {option.label}{" "}
              <strong className="text-foreground tabular-nums">
                {counts[option.value]}
              </strong>
            </span>
          </span>
        ))}
      </div>

      <div className="relative mx-auto w-full max-w-105">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="bg-background h-auto w-full overflow-hidden rounded-xl"
          role="img"
          aria-label={`Kart over Norge med ${stores.length} butikker. ${counts.har_boka} har boka, ${counts.gatt_tom} har gått tom, ${counts.ikke_hatt} har ikke hatt den.${selectedRegion ? ` Zoomet inn på ${selectedRegion}.` : ""}`}
        >
          <title>Butikker i Norge</title>
          <g
            style={{
              transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
              transformOrigin: "0 0",
              transition: "transform 600ms cubic-bezier(0.2, 0.8, 0.2, 1)",
            }}
          >
            <path
              d={NORWAY_PATH}
              fill="var(--muted)"
              stroke="var(--border)"
              strokeWidth={0.8 / scale}
              strokeLinejoin="round"
            />
            {dots.map(({ store, x, y }) => {
              const dimmed =
                selectedRegion !== null && store.region !== selectedRegion;
              return (
                <circle
                  key={store.id}
                  cx={x}
                  cy={y}
                  r={(radius(store.currentQty) * dotScale) / scale}
                  fill={STATUS_COLORS[store.status]}
                  fillOpacity={
                    dimmed ? 0.18 : store.status === "ikke_hatt" ? 0.55 : 0.9
                  }
                  stroke="#ffffff"
                  strokeWidth={(store.currentQty > 0 ? 1.2 : 0.6) / scale}
                  // Standard fokusramme tegnes som en boks rundt sirkelen og
                  // skaleres med zoomen — bruk streken som fokusmarkør i stedet.
                  className="focus-visible:stroke-foreground cursor-pointer outline-none transition-opacity"
                  role="button"
                  tabIndex={0}
                  aria-label={`${store.name}, ${store.city ?? ""}: ${labelFor(STORE_STATUS_OPTIONS, store.status)}${store.currentQty > 0 ? `, ${store.currentQty} eksemplarer` : ""}`}
                  onMouseEnter={() => setHover(store)}
                  onMouseLeave={() => setHover(null)}
                  onFocus={() => setHover(store)}
                  onBlur={() => setHover(null)}
                  onClick={() =>
                    onSelectRegion(
                      store.region === selectedRegion ? null : store.region
                    )
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onSelectRegion(
                        store.region === selectedRegion ? null : store.region
                      );
                    }
                  }}
                />
              );
            })}
          </g>
        </svg>

        {selectedRegion && (
          <div className="bg-card/90 border-border absolute top-2 right-2 rounded-lg border px-2.5 py-1.5 text-xs shadow-sm backdrop-blur-sm">
            <span className="font-semibold">{selectedRegion}</span>{" "}
            <span className="text-muted-foreground tabular-nums">
              · {inSelectedRegion}{" "}
              {inSelectedRegion === 1 ? "butikk" : "butikker"}
            </span>
          </div>
        )}

        <div className="absolute right-2 bottom-2 flex flex-col gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={() => zoomBy(ZOOM_STEP)}
            disabled={scale >= MAX_ZOOM}
            aria-label="Zoom inn"
          >
            <PlusIcon className="size-4" aria-hidden />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={() => zoomBy(1 / ZOOM_STEP)}
            disabled={scale <= MIN_ZOOM}
            aria-label="Zoom ut"
          >
            <MinusIcon className="size-4" aria-hidden />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={reset}
            disabled={scale === MIN_ZOOM && selectedRegion === null}
            aria-label="Vis hele landet"
          >
            <MaximizeIcon className="size-4" aria-hidden />
          </Button>
        </div>

        {hover && (
          <div className="bg-card border-border pointer-events-none absolute top-2 left-2 max-w-60 rounded-lg border px-3 py-2 text-sm shadow-md">
            <p className="font-semibold">{hover.name}</p>
            <p className="text-muted-foreground">
              {[hover.city, hover.region].filter(Boolean).join(" · ")}
            </p>
            <p className="mt-1">
              <span
                className="mr-1.5 inline-block size-2.5 rounded-full align-middle"
                style={{ background: STATUS_COLORS[hover.status] }}
                aria-hidden
              />
              {labelFor(STORE_STATUS_OPTIONS, hover.status)}
              {hover.currentQty > 0 && (
                <>
                  {" "}
                  · <strong className="tabular-nums">{hover.currentQty}</strong>{" "}
                  {hover.currentQty === 1 ? "eksemplar" : "eksemplarer"}
                </>
              )}
              {hover.soldEstimate > 0 && (
                <>
                  {" "}
                  ·{" "}
                  <strong className="tabular-nums">{hover.soldEstimate}</strong>{" "}
                  solgt
                </>
              )}
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              {hover.region === selectedRegion
                ? "Klikk for å vise hele landet"
                : `Klikk for å zoome inn på ${hover.region}`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
