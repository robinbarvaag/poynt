"use client";

import { STORE_STATUS_OPTIONS, labelFor } from "@/lib/boksalg/constants";
import type { StoreRow } from "@/lib/boksalg/dashboard";
import { Button } from "@poynt/ui";
import { MaximizeIcon, MinusIcon, PlusIcon } from "lucide-react";
import {
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { EXACT, STATUS_COLORS } from "./chart-tokens";
import { NORWAY_PATH, NORWAY_VIEWBOX, projectNorway } from "./norway-map";

/**
 * Norgeskart med en prikk per butikk. Størrelsen på prikken følger antall
 * eksemplarer; fargen følger status (har boka / gått tom / ikke hatt) og står
 * alltid sammen med tekst i legenden og tooltipen — aldri farge alene.
 * Butikker som har solgt de siste sju dagene får en pulserende ring.
 *
 * Klikk på en prikk velger fylket: tabellen under filtreres, og kartet zoomer
 * inn på butikkene i fylket. Deretter: hjul eller pluss/minus for å zoome
 * videre, dra for å flytte, «hele landet» nullstiller. Tett på (fra ~10×)
 * tones omrisset ned og butikknavnene skrives ut — det er der Oslo-butikkene
 * kan skilles fra hverandre.
 *
 * Zoomen er en SVG-transform på en <g>, animert med requestAnimationFrame.
 * Ikke CSS-transition med vilje: Chrome rasteriserer et CSS-transformert lag
 * i lav oppløsning mens det beveger seg, og ved 40× blir kartet grøt.
 * SVG-attributtet tegnes som vektor hver frame. Prikker og streker deles på
 * skalaen så de holder synlig størrelse.
 */

const { width: W, height: H } = NORWAY_VIEWBOX;
const MIN_ZOOM = 1;
const MAX_ZOOM = 80;
const ZOOM_STEP = 2;
/** Luft rundt butikkene i et fylke, i kartenheter. */
const REGION_PAD = 28;
/** Fylkesutsnittet stopper her — nærmere er en manuell handling. */
const REGION_MAX_ZOOM = 12;
/** Fra denne zoomen skrives butikknavnene ut og omrisset tones ned. */
const LABEL_ZOOM = 10;
const LABEL_SIZE = 10;
const ANIMATION_MS = 550;

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

interface Label {
  x: number;
  y: number;
  anchor: "start" | "middle" | "end";
}

function radius(qty: number): number {
  if (qty <= 0) return 2.6;
  return Math.min(9, 3.5 + Math.sqrt(qty) * 1.4);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function sameView(a: View, b: View): boolean {
  return a.scale === b.scale && a.cx === b.cx && a.cy === b.cy;
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
    scale: clamp(Math.min(W / boxW, H / boxH), MIN_ZOOM, REGION_MAX_ZOOM),
    cx: (minX + maxX) / 2,
    cy: (minY + maxY) / 2,
  };
}

/**
 * Plasserer butikknavn uten at de ligger oppå hverandre: prøv høyre, venstre,
 * under, over — og dropp navnet hvis ingen plass er ledig. Grådig og enkelt;
 * det holder for 22 butikker i Oslo. Regnes i viewBox-enheter på skjermen.
 */
function placeLabels(
  dots: { id: number; name: string; sx: number; sy: number; r: number }[]
): Map<number, Label> {
  const placed: { x1: number; y1: number; x2: number; y2: number }[] = [];
  const result = new Map<number, Label>();
  const h = LABEL_SIZE * 1.15;

  for (const dot of [...dots].sort((a, b) => a.sy - b.sy)) {
    const w = dot.name.length * LABEL_SIZE * 0.56;
    const gap = dot.r + 2.5;
    const options: (Label & {
      x1: number;
      y1: number;
      x2: number;
      y2: number;
    })[] = [
      {
        x: dot.sx + gap,
        y: dot.sy,
        anchor: "start",
        x1: dot.sx + gap,
        y1: dot.sy - h / 2,
        x2: dot.sx + gap + w,
        y2: dot.sy + h / 2,
      },
      {
        x: dot.sx - gap,
        y: dot.sy,
        anchor: "end",
        x1: dot.sx - gap - w,
        y1: dot.sy - h / 2,
        x2: dot.sx - gap,
        y2: dot.sy + h / 2,
      },
      {
        x: dot.sx,
        y: dot.sy + gap + h * 0.7,
        anchor: "middle",
        x1: dot.sx - w / 2,
        y1: dot.sy + gap,
        x2: dot.sx + w / 2,
        y2: dot.sy + gap + h,
      },
      {
        x: dot.sx,
        y: dot.sy - gap - h * 0.3,
        anchor: "middle",
        x1: dot.sx - w / 2,
        y1: dot.sy - gap - h,
        x2: dot.sx + w / 2,
        y2: dot.sy - gap,
      },
    ];
    for (const option of options) {
      const free =
        option.x1 >= 0 &&
        option.x2 <= W &&
        !placed.some(
          (box) =>
            option.x1 < box.x2 &&
            option.x2 > box.x1 &&
            option.y1 < box.y2 &&
            option.y2 > box.y1
        );
      if (free) {
        placed.push(option);
        result.set(dot.id, { x: option.x, y: option.y, anchor: option.anchor });
        break;
      }
    }
  }
  return result;
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
  const svgRef = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<StoreRow | null>(null);
  // Manuell zoom/panorering gjelder bare for fylket den ble satt i; bytter
  // fylket, gjelder fylkets eget utsnitt igjen.
  const [manual, setManual] = useState<{
    region: string | null;
    view: View;
  } | null>(null);
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const lastDragMoved = useRef(false);

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

  /** Målet: der kartet skal ende. */
  const target =
    manual && manual.region === selectedRegion
      ? manual.view
      : (regionView ?? WHOLE_COUNTRY);

  /** Det som faktisk tegnes akkurat nå — animeres mot målet. */
  const [shown, setShown] = useState<View>(WHOLE_COUNTRY);
  const shownRef = useRef<View>(WHOLE_COUNTRY);
  const frame = useRef(0);

  useEffect(() => {
    cancelAnimationFrame(frame.current);
    const from = shownRef.current;
    if (sameView(from, target)) return;
    if (dragging) {
      shownRef.current = target;
      setShown(target);
      return;
    }
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / ANIMATION_MS);
      const e = 1 - (1 - t) ** 3;
      // Skalaen interpoleres logaritmisk — lineært føles som et rykk mot slutten.
      const next: View = {
        scale: Math.exp(
          Math.log(from.scale) +
            (Math.log(target.scale) - Math.log(from.scale)) * e
        ),
        cx: from.cx + (target.cx - from.cx) * e,
        cy: from.cy + (target.cy - from.cy) * e,
      };
      shownRef.current = t === 1 ? target : next;
      setShown(shownRef.current);
      if (t < 1) frame.current = requestAnimationFrame(step);
    };
    frame.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame.current);
  }, [target, dragging]);

  const { scale } = shown;
  const tx = W / 2 - scale * shown.cx;
  const ty = H / 2 - scale * shown.cy;

  const setView = (next: View) => {
    const s = clamp(next.scale, MIN_ZOOM, MAX_ZOOM);
    setManual({
      region: selectedRegion,
      view:
        s === MIN_ZOOM ? WHOLE_COUNTRY : { scale: s, cx: next.cx, cy: next.cy },
    });
  };

  /** Piksler i nettleseren → kartenheter (viewBox skalerer med bredden). */
  const unitsPerPixel = () => {
    const rect = svgRef.current?.getBoundingClientRect();
    return rect && rect.width > 0 ? W / rect.width : 1;
  };

  /** Zoom med faktoren, og hold punktet (px, py i kartenheter) i ro. */
  const zoomAt = (factor: number, px = W / 2, py = H / 2) => {
    const s2 = clamp(target.scale * factor, MIN_ZOOM, MAX_ZOOM);
    if (s2 === target.scale) return;
    const ttx = W / 2 - target.scale * target.cx;
    const tty = H / 2 - target.scale * target.cy;
    const wx = (px - ttx) / target.scale;
    const wy = (py - tty) / target.scale;
    setView({
      scale: s2,
      cx: wx - (px - W / 2) / s2,
      cy: wy - (py - H / 2) / s2,
    });
  };

  const reset = () => {
    setManual(null);
    onSelectRegion(null);
  };

  // Hjulet må kunne stoppe sidescrollen — det krever en ikke-passiv lytter,
  // og React sine onWheel er passive. Uten avhengighetsliste med vilje: den
  // bindes på nytt hver render, så den alltid ser gjeldende zoom.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const rect = svg.getBoundingClientRect();
      const upp = W / rect.width;
      zoomAt(
        Math.exp(-event.deltaY * 0.0015),
        (event.clientX - rect.left) * upp,
        (event.clientY - rect.top) * upp
      );
    };
    svg.addEventListener("wheel", onWheel, { passive: false });
    return () => svg.removeEventListener("wheel", onWheel);
  });

  // Uten pointer capture med vilje: med capture går click-hendelsen til
  // svg-en i stedet for prikken, og klikk på butikker slutter å virke.
  const onPointerDown = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (event.button !== 0) return;
    drag.current = { x: event.clientX, y: event.clientY, moved: false };
    lastDragMoved.current = false;
  };
  const onPointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
    const start = drag.current;
    if (!start) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (!start.moved && Math.hypot(dx, dy) < 4) return;
    start.moved = true;
    setDragging(true);
    const upp = unitsPerPixel();
    setView({
      scale: target.scale,
      cx: target.cx - (dx * upp) / target.scale,
      cy: target.cy - (dy * upp) / target.scale,
    });
    drag.current = { x: event.clientX, y: event.clientY, moved: true };
  };
  const onPointerUp = () => {
    // click kommer ETTER pointerup — husk om dette var et drag, så prikkens
    // onClick kan ignorere det.
    lastDragMoved.current = drag.current?.moved ?? false;
    drag.current = null;
    setDragging(false);
  };

  const counts = useMemo(() => {
    const result = { har_boka: 0, gatt_tom: 0, ikke_hatt: 0 };
    for (const store of stores) result[store.status] += 1;
    return result;
  }, [stores]);
  const recentCount = stores.filter((store) => store.recentSales > 0).length;

  const inSelectedRegion = selectedRegion
    ? stores.filter((store) => store.region === selectedRegion).length
    : 0;

  // Prikkene vokser litt med zoomen (tak på 1,8×): synlige når man er tett
  // på, uten å dekke naboene.
  const dotScale = Math.min(1.8, Math.sqrt(scale));
  const showLabels = scale >= LABEL_ZOOM;
  const outlineOpacity = clamp(1 - (scale - 6) / 14, 0.25, 1);

  const labels = useMemo(() => {
    if (!showLabels) return new Map<number, Label>();
    return placeLabels(
      dots
        .filter(
          ({ store }) =>
            selectedRegion === null || store.region === selectedRegion
        )
        .map(({ store, x, y }) => ({
          id: store.id,
          name: store.name,
          sx: tx + scale * x,
          sy: ty + scale * y,
          r: radius(store.currentQty) * dotScale,
        }))
        .filter(
          (dot) =>
            dot.sx > -50 && dot.sx < W + 50 && dot.sy > -20 && dot.sy < H + 20
        )
    );
  }, [showLabels, dots, selectedRegion, tx, ty, scale, dotScale]);

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
        {recentCount > 0 && (
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block size-3 rounded-full ring-2 ring-offset-1"
              style={{
                background: EXACT,
                ["--tw-ring-color" as string]: `${EXACT}66`,
              }}
              aria-hidden
            />
            <span className="text-muted-foreground">
              Solgt siste uke{" "}
              <strong className="text-foreground tabular-nums">
                {recentCount}
              </strong>
            </span>
          </span>
        )}
      </div>

      <div className="relative mx-auto w-full max-w-105">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className={`bg-background h-auto w-full touch-none overflow-hidden rounded-xl select-none ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
          role="img"
          aria-label={`Kart over Norge med ${stores.length} butikker. ${counts.har_boka} har boka, ${counts.gatt_tom} har gått tom, ${counts.ikke_hatt} har ikke hatt den.${selectedRegion ? ` Zoomet inn på ${selectedRegion}.` : ""}`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <title>Butikker i Norge</title>
          <g transform={`translate(${tx} ${ty}) scale(${scale})`}>
            <path
              d={NORWAY_PATH}
              fill="var(--muted)"
              stroke="var(--border)"
              strokeWidth={0.8 / scale}
              strokeLinejoin="round"
              opacity={outlineOpacity}
            />
            {dots.map(({ store, x, y }) => {
              const dimmed =
                selectedRegion !== null && store.region !== selectedRegion;
              const r = (radius(store.currentQty) * dotScale) / scale;
              const select = () =>
                onSelectRegion(
                  store.region === selectedRegion ? null : store.region
                );
              return (
                <g key={store.id}>
                  {store.recentSales > 0 && !dimmed && (
                    // Pulserende ring: «her ble det solgt i det siste».
                    <circle
                      cx={x}
                      cy={y}
                      fill="none"
                      stroke={EXACT}
                      strokeWidth={1.2 / scale}
                      pointerEvents="none"
                      aria-hidden
                    >
                      <animate
                        attributeName="r"
                        values={`${r};${r * 3.2}`}
                        dur="2s"
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="opacity"
                        values="0.8;0"
                        dur="2s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  )}
                  <circle
                    cx={x}
                    cy={y}
                    r={r}
                    fill={STATUS_COLORS[store.status]}
                    fillOpacity={
                      dimmed ? 0.18 : store.status === "ikke_hatt" ? 0.55 : 0.9
                    }
                    stroke="#ffffff"
                    strokeWidth={(store.currentQty > 0 ? 1.2 : 0.6) / scale}
                    // Standard fokusramme tegnes som en boks rundt sirkelen og
                    // skaleres med zoomen — bruk streken som fokusmarkør.
                    className="focus-visible:stroke-foreground cursor-pointer outline-none"
                    role="button"
                    tabIndex={0}
                    aria-label={`${store.name}, ${store.city ?? ""}: ${labelFor(STORE_STATUS_OPTIONS, store.status)}${store.currentQty > 0 ? `, ${store.currentQty} eksemplarer` : ""}${store.recentSales > 0 ? `, ${store.recentSales} solgt siste uke` : ""}`}
                    onMouseEnter={() => setHover(store)}
                    onMouseLeave={() => setHover(null)}
                    onFocus={() => setHover(store)}
                    onBlur={() => setHover(null)}
                    onClick={() => {
                      // Et drag som endte på en prikk er ikke et klikk.
                      if (lastDragMoved.current) return;
                      select();
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        select();
                      }
                    }}
                  />
                </g>
              );
            })}
          </g>

          {/* Navnene tegnes utenfor zoom-gruppa, i skjermenheter, så de kan
              plasseres uten overlapp og holder samme størrelse. */}
          {labels.size > 0 && (
            <g pointerEvents="none" aria-hidden>
              {dots.map(({ store }) => {
                const label = labels.get(store.id);
                if (!label) return null;
                return (
                  <text
                    key={store.id}
                    x={label.x}
                    y={label.y + LABEL_SIZE * 0.35}
                    fontSize={LABEL_SIZE}
                    textAnchor={label.anchor}
                    fill="var(--foreground)"
                    stroke="var(--background)"
                    strokeWidth={3}
                    paintOrder="stroke"
                    className={hover?.id === store.id ? "font-semibold" : ""}
                  >
                    {store.name}
                  </text>
                );
              })}
            </g>
          )}
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
            onClick={() => zoomAt(ZOOM_STEP)}
            disabled={target.scale >= MAX_ZOOM}
            aria-label="Zoom inn"
          >
            <PlusIcon className="size-4" aria-hidden />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={() => zoomAt(1 / ZOOM_STEP)}
            disabled={target.scale <= MIN_ZOOM}
            aria-label="Zoom ut"
          >
            <MinusIcon className="size-4" aria-hidden />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={reset}
            disabled={target.scale === MIN_ZOOM && selectedRegion === null}
            aria-label="Vis hele landet"
          >
            <MaximizeIcon className="size-4" aria-hidden />
          </Button>
        </div>

        <p className="text-muted-foreground pointer-events-none absolute bottom-2 left-2 text-[10px]">
          Hjul for å zoome · dra for å flytte
        </p>

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
            {hover.recentSales > 0 && (
              <p className="text-primary mt-1 text-xs font-medium">
                {hover.recentSales} solgt siste uke
              </p>
            )}
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
