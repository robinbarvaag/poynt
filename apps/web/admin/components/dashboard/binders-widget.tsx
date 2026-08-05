"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { runRadarNow, setSuggestionStatus } from "../../actions/radar";

/**
 * «Bindersen» — klientdelen av innholdsradar-widgeten på dashbordet.
 * En animert kontorassistent (à la Office-bindersen) med snakkeboble som
 * presenterer ett forslag om gangen og lar partneren handle direkte.
 * Data hentes av serverkomponenten i radar-widget.tsx.
 */

export type {
  BindersRunInfo,
  BindersSuggestion,
} from "@/lib/radar/widget-data";
import type {
  BindersRunInfo,
  BindersSuggestion,
} from "@/lib/radar/widget-data";

// Bindersens kommentar per signaltype — lun, hverdagslig, jeg/du-form.
const kindQuips: Record<string, string> = {
  stale: "Denne har støvet litt ned i hylla. På tide med en runde?",
  stuck_draft: "Dette utkastet har ligget lenge. Skal vi gjøre det ferdig?",
  coverage_gap: "Her er det tynt i hylla. Vil du fylle på?",
  featured_rotation: "Denne har stått i vinduet en stund. Bytte ut?",
  demand: "Medlemmene spør etter dette. Smi mens jernet er varmt?",
  inspiration_gap: "Andre skriver om dette nå — kanskje du også burde?",
  popular: "Denne leses mye! Verdt å løfte fram?",
  low_quality: "Denne kan bli bedre. Skal vi pusse litt på den?",
};

const typeLabels: Record<string, string> = {
  create: "Lag nytt",
  refresh: "Oppdater",
  promote: "Promoter",
  repurpose: "Gjenbruk",
};

const doneQuips = [
  "Der, ja! Én ting mindre å tenke på.",
  "Supert! Da stryker jeg den fra lista.",
  "Flott jobba. Neste?",
];

const COLLAPSE_KEY = "poynt-binders-collapsed";

function useTypewriter(text: string): string {
  const [shown, setShown] = useState("");
  useEffect(() => {
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reduced) {
      setShown(text);
      return;
    }
    setShown("");
    let i = 0;
    const id = window.setInterval(() => {
      i += 2;
      setShown(text.slice(0, i));
      if (i >= text.length) window.clearInterval(id);
    }, 24);
    return () => window.clearInterval(id);
  }, [text]);
  return shown;
}

/** Selve figuren: en binders med øyne som blunker og følger musepekeren. */
function BindersFigure({
  pupil,
  mood,
}: {
  pupil: { x: number; y: number };
  mood: "idle" | "happy" | "thinking";
}) {
  return (
    <svg
      className={`bndr-figure bndr-mood-${mood}`}
      viewBox="0 0 120 170"
      width="86"
      height="122"
      aria-hidden="true"
      focusable="false"
    >
      <title>Bindersen</title>
      <defs>
        <linearGradient id="bndr-wire" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#9db4c9" />
          <stop offset="55%" stopColor="#6d8aa3" />
          <stop offset="100%" stopColor="#51708c" />
        </linearGradient>
      </defs>
      {/* Ståltråden */}
      <g className="bndr-body">
        <path
          d="M42,62 C42,34 84,34 84,62 L84,124 C84,150 48,150 48,124 L48,80 C48,66 66,66 66,80 L66,120"
          fill="none"
          stroke="url(#bndr-wire)"
          strokeWidth="9"
          strokeLinecap="round"
        />
        {/* Øyne */}
        <g className="bndr-eye" style={{ transformOrigin: "46px 42px" }}>
          <ellipse
            cx="46"
            cy="42"
            rx="13"
            ry="16"
            fill="var(--theme-bg, #fff)"
            stroke="var(--theme-elevation-800, #222)"
            strokeWidth="2.5"
          />
          <circle
            cx={46 + pupil.x}
            cy={44 + pupil.y}
            r="5"
            fill="var(--theme-elevation-800, #222)"
          />
        </g>
        <g className="bndr-eye" style={{ transformOrigin: "80px 42px" }}>
          <ellipse
            cx="80"
            cy="42"
            rx="13"
            ry="16"
            fill="var(--theme-bg, #fff)"
            stroke="var(--theme-elevation-800, #222)"
            strokeWidth="2.5"
          />
          <circle
            cx={80 + pupil.x}
            cy={44 + pupil.y}
            r="5"
            fill="var(--theme-elevation-800, #222)"
          />
        </g>
        {/* Øyenbryn */}
        <path
          className="bndr-brow"
          d="M36,22 Q46,17 56,21"
          fill="none"
          stroke="var(--theme-elevation-800, #222)"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          className="bndr-brow"
          d="M70,21 Q80,17 90,22"
          fill="none"
          stroke="var(--theme-elevation-800, #222)"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}

export const BindersWidget = ({
  suggestions,
  run,
  variant = "card",
  reload,
}: {
  suggestions: BindersSuggestion[];
  run: BindersRunInfo;
  /** "card" = inline på dashbordet, "floating" = inni den flytende assistenten. */
  variant?: "card" | "floating";
  /** Klienthentet data (flytende variant): kalles i stedet for router.refresh(). */
  reload?: () => Promise<void>;
}) => {
  const router = useRouter();
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [idx, setIdx] = useState(0);
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<boolean | null>(null);
  const [mood, setMood] = useState<"idle" | "happy" | "thinking">("idle");
  const [pupil, setPupil] = useState({ x: 0, y: 0 });
  const figureRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Flytende variant har egen åpne/lukke-knapp (bobla) — aldri kollapset her.
    setCollapsed(
      variant === "card"
        ? window.localStorage.getItem(COLLAPSE_KEY) === "1"
        : false
    );
  }, [variant]);

  const items = useMemo(
    () => suggestions.filter((s) => !hidden.has(s.id)),
    [suggestions, hidden]
  );
  const current = items[Math.min(idx, Math.max(items.length - 1, 0))];

  const quip = flash
    ? flash
    : current
      ? (kindQuips[current.evidenceKind ?? ""] ??
        "Jeg har lest gjennom innholdet ditt — her er noe du kan ta tak i:")
      : run
        ? "Ingenting å mase om akkurat nå — alt ser ryddig ut! Skal jeg ta en ny runde?"
        : "Hei! Jeg har ikke fått lest noe ennå. Skal jeg ta en første runde?";
  const typed = useTypewriter(quip);

  const trackEyes = useCallback((e: React.MouseEvent) => {
    const el = figureRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = el.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height * 0.3);
    const len = Math.max(Math.hypot(dx, dy), 1);
    setPupil({ x: (dx / len) * 3.5, y: (dy / len) * 3 });
  }, []);

  function toggleCollapsed(next: boolean) {
    setCollapsed(next);
    window.localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
  }

  async function act(status: "done" | "snoozed" | "dismissed") {
    if (!current || busy) return;
    setBusy(true);
    setMood("thinking");
    try {
      await setSuggestionStatus(current.id, status);
      setHidden((prev) => new Set(prev).add(current.id));
      setIdx(0);
      setMood("happy");
      setFlash(
        status === "done"
          ? doneQuips[Math.floor(Math.random() * doneQuips.length)]
          : status === "snoozed"
            ? "Snooze aktivert — jeg minner deg på den senere."
            : "Den er strøket. Jeg maser aldri om den igjen."
      );
      window.setTimeout(() => {
        setFlash(null);
        setMood("idle");
      }, 3200);
      if (reload) await reload();
      else router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function handleRun() {
    if (busy) return;
    setBusy(true);
    setMood("thinking");
    try {
      const res = await runRadarNow();
      setFlash(
        res.success
          ? "Da tar jeg en runde! Det tar et par minutter — kikk innom radaren etterpå."
          : `Hmm, det gikk ikke: ${res.error ?? "ukjent feil"}`
      );
      setMood(res.success ? "happy" : "idle");
      window.setTimeout(() => {
        setFlash(null);
        setMood("idle");
      }, 6000);
    } finally {
      setBusy(false);
    }
  }

  // Unngå hopp før localStorage er lest.
  if (collapsed === null)
    return variant === "card" ? <div className="bndr-placeholder" /> : null;

  if (collapsed && variant === "card") {
    return (
      <div className="bndr-root">
        <BindersStyles />
        <button
          type="button"
          className="bndr-collapsed"
          onClick={() => toggleCollapsed(false)}
        >
          <svg viewBox="0 0 120 170" width="20" height="28" aria-hidden="true">
            <path
              d="M42,62 C42,34 84,34 84,62 L84,124 C84,150 48,150 48,124 L48,80 C48,66 66,66 66,80 L66,120"
              fill="none"
              stroke="currentColor"
              strokeWidth="12"
              strokeLinecap="round"
            />
          </svg>
          <span>
            {items.length > 0
              ? `Bindersen har ${items.length} forslag til deg`
              : "Bindersen tar en pause"}
          </span>
          <span className="bndr-expand">Vis</span>
        </button>
      </div>
    );
  }

  const targetHref =
    current?.targetCollection && current?.targetId
      ? `/admin/collections/${current.targetCollection}/${current.targetId}`
      : "/admin/radar";

  return (
    <div className={`bndr-root bndr-${variant}`}>
      <BindersStyles />
      <div className="bndr-card" onMouseMove={trackEyes}>
        <div className="bndr-figure-wrap" ref={figureRef}>
          <BindersFigure pupil={pupil} mood={mood} />
          <div className="bndr-shadow" />
        </div>

        <div className="bndr-bubble">
          <div className="bndr-quip">
            {typed}
            <span className="bndr-caret" />
          </div>

          {current && !flash && (
            <div className="bndr-suggestion">
              <div className="bndr-pills">
                <span
                  className={`bndr-pill ${
                    current.priority >= 80
                      ? "bndr-pill-hot"
                      : current.priority >= 60
                        ? "bndr-pill-warm"
                        : ""
                  }`}
                >
                  Prioritet {current.priority}
                </span>
                <span className="bndr-pill">
                  {typeLabels[current.type] ?? current.type}
                </span>
                {items.length > 1 && (
                  <span className="bndr-counter">
                    {items.indexOf(current) + 1} av {items.length}
                  </span>
                )}
              </div>
              <div className="bndr-title">{current.title}</div>
              <div className="bndr-rationale">{current.rationale}</div>
              <div className="bndr-actions">
                <a href={targetHref} className="bndr-btn bndr-btn-primary">
                  Vis meg
                </a>
                <button
                  type="button"
                  className="bndr-btn"
                  disabled={busy}
                  onClick={() => act("done")}
                >
                  Ferdig
                </button>
                <button
                  type="button"
                  className="bndr-btn"
                  disabled={busy}
                  onClick={() => act("snoozed")}
                >
                  Snooze
                </button>
                <button
                  type="button"
                  className="bndr-btn bndr-btn-quiet"
                  disabled={busy}
                  onClick={() => act("dismissed")}
                >
                  Avvis
                </button>
                {items.length > 1 && (
                  <button
                    type="button"
                    className="bndr-btn bndr-btn-quiet"
                    onClick={() => setIdx((idx + 1) % items.length)}
                  >
                    Neste →
                  </button>
                )}
              </div>
            </div>
          )}

          {!current && !flash && (
            <div className="bndr-actions">
              <button
                type="button"
                className="bndr-btn bndr-btn-primary"
                disabled={busy}
                onClick={handleRun}
              >
                {busy ? "Starter…" : "Kjør radaren nå"}
              </button>
            </div>
          )}
        </div>

        <div className="bndr-meta">
          {run && (
            <span className="bndr-run">
              Sist: {run.label} · {run.signals} signaler → {run.total} forslag
            </span>
          )}
          <a href="/admin/radar" className="bndr-link">
            Åpne radaren →
          </a>
          {variant === "card" && (
            <button
              type="button"
              className="bndr-hide"
              onClick={() => toggleCollapsed(true)}
              title="Skjul Bindersen"
            >
              Skjul
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export function BindersStyles() {
  return (
    <style>{`
.bndr-root { margin-bottom: 1.5rem; }
.bndr-placeholder { min-height: 3rem; margin-bottom: 1.5rem; }
.bndr-card {
  position: relative;
  display: grid;
  grid-template-columns: auto 1fr;
  grid-template-rows: 1fr auto;
  gap: 0 1.25rem;
  align-items: end;
  padding: 1.25rem 1.5rem 0.75rem;
  border: 1px solid var(--theme-elevation-150);
  border-radius: var(--style-radius-m);
  background:
    radial-gradient(circle at 12% 88%, var(--theme-elevation-100) 0%, transparent 42%),
    var(--theme-elevation-50);
  overflow: hidden;
}
.bndr-figure-wrap { position: relative; align-self: end; padding-bottom: 0.35rem; }
.bndr-figure { display: block; animation: bndr-bob 4.2s ease-in-out infinite; }
.bndr-figure-wrap:hover .bndr-figure { animation: bndr-wiggle 0.7s ease-in-out; }
.bndr-mood-happy { animation: bndr-hop 0.55s ease-out !important; }
.bndr-mood-thinking .bndr-brow { transform: translateY(-2px); }
.bndr-eye { animation: bndr-blink 5.2s infinite; }
.bndr-eye:last-of-type { animation-delay: 0.05s; }
.bndr-brow { transition: transform 0.25s ease; }
.bndr-shadow {
  width: 56px; height: 9px; margin: 0 auto;
  border-radius: 50%;
  background: var(--theme-elevation-200);
  opacity: 0.7;
  animation: bndr-shadow 4.2s ease-in-out infinite;
}
.bndr-bubble {
  position: relative;
  align-self: start;
  background: var(--theme-bg);
  border: 1px solid var(--theme-elevation-200);
  border-radius: var(--style-radius-m);
  padding: 0.9rem 1.1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  animation: bndr-pop 0.35s ease-out;
}
.bndr-bubble::before, .bndr-bubble::after {
  content: "";
  position: absolute;
  left: -9px; bottom: 22px;
  border-style: solid;
  border-width: 8px 10px 8px 0;
  border-color: transparent var(--theme-elevation-200) transparent transparent;
}
.bndr-bubble::after {
  left: -7.5px;
  border-right-color: var(--theme-bg);
}
.bndr-quip {
  font-size: 0.92em;
  font-style: italic;
  color: var(--theme-elevation-650);
  min-height: 1.3em;
  margin-bottom: 0.35rem;
}
.bndr-caret {
  display: inline-block;
  width: 2px; height: 0.95em;
  margin-left: 2px;
  vertical-align: text-bottom;
  background: var(--theme-elevation-500);
  animation: bndr-caret 1s steps(1) infinite;
}
.bndr-pills { display: flex; flex-wrap: wrap; gap: 0.4rem; align-items: center; margin-bottom: 0.4rem; }
.bndr-pill {
  padding: 0.12rem 0.5rem;
  border-radius: var(--style-radius-s);
  font-size: 0.76em; font-weight: 600;
  background: var(--theme-elevation-100);
  color: var(--theme-elevation-600);
  white-space: nowrap;
}
.bndr-pill-hot { background: var(--theme-error-100); color: var(--theme-error-700); }
.bndr-pill-warm { background: var(--theme-warning-100); color: var(--theme-warning-700); }
.bndr-counter { font-size: 0.76em; color: var(--theme-elevation-450); }
.bndr-title { font-weight: 600; margin-bottom: 0.2rem; }
.bndr-rationale { font-size: 0.88em; color: var(--theme-elevation-650); margin-bottom: 0.65rem; }
.bndr-actions { display: flex; flex-wrap: wrap; gap: 0.45rem; }
.bndr-btn {
  padding: 0.28rem 0.8rem;
  border: 1px solid var(--theme-elevation-200);
  border-radius: var(--style-radius-s);
  background: var(--theme-elevation-50);
  color: var(--theme-text);
  font-size: 0.85em;
  cursor: pointer;
  text-decoration: none;
  transition: transform 0.12s ease, background 0.12s ease;
}
.bndr-btn:hover:not(:disabled) { transform: translateY(-1px); background: var(--theme-elevation-100); }
.bndr-btn:disabled { opacity: 0.55; cursor: default; }
.bndr-btn-primary {
  background: var(--theme-success-600);
  border-color: var(--theme-success-600);
  color: white; font-weight: 600;
}
.bndr-btn-primary:hover:not(:disabled) { background: var(--theme-success-500); }
.bndr-btn-quiet { border-color: transparent; background: transparent; color: var(--theme-elevation-500); }
.bndr-meta {
  grid-column: 1 / -1;
  display: flex; flex-wrap: wrap; gap: 0.4rem 1rem;
  align-items: baseline; justify-content: flex-end;
  margin-top: 0.6rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--theme-elevation-100);
  font-size: 0.8em;
}
.bndr-run { color: var(--theme-elevation-450); margin-right: auto; }
.bndr-link { color: var(--theme-success-600); font-weight: 600; text-decoration: none; white-space: nowrap; }
.bndr-hide {
  border: none; background: none; cursor: pointer;
  color: var(--theme-elevation-400); font-size: 1em; padding: 0;
}
.bndr-hide:hover { color: var(--theme-elevation-600); }
.bndr-collapsed {
  display: flex; align-items: center; gap: 0.6rem;
  width: 100%;
  padding: 0.55rem 1rem;
  border: 1px solid var(--theme-elevation-150);
  border-radius: var(--style-radius-m);
  background: var(--theme-elevation-50);
  color: var(--theme-text);
  font-size: 0.88em;
  cursor: pointer;
  text-align: left;
}
.bndr-collapsed svg { color: var(--theme-elevation-500); flex-shrink: 0; }
.bndr-collapsed:hover { background: var(--theme-elevation-100); }
.bndr-expand { margin-left: auto; color: var(--theme-success-600); font-weight: 600; }
@keyframes bndr-bob {
  0%, 100% { transform: translateY(0) rotate(-1deg); }
  50% { transform: translateY(-6px) rotate(1.5deg); }
}
@keyframes bndr-shadow {
  0%, 100% { transform: scaleX(1); opacity: 0.7; }
  50% { transform: scaleX(0.82); opacity: 0.45; }
}
@keyframes bndr-blink {
  0%, 93%, 100% { transform: scaleY(1); }
  95.5% { transform: scaleY(0.08); }
}
@keyframes bndr-wiggle {
  0%, 100% { transform: rotate(0); }
  25% { transform: rotate(-6deg); }
  60% { transform: rotate(5deg); }
}
@keyframes bndr-hop {
  0%, 100% { transform: translateY(0); }
  40% { transform: translateY(-14px) rotate(3deg); }
  70% { transform: translateY(0); }
  85% { transform: translateY(-4px); }
}
@keyframes bndr-pop {
  0% { opacity: 0; transform: translateX(-6px) scale(0.97); }
  100% { opacity: 1; transform: none; }
}
@keyframes bndr-caret {
  0%, 49% { opacity: 1; }
  50%, 100% { opacity: 0; }
}
.bndr-floating { margin-bottom: 0; }
.bndr-floating .bndr-card { box-shadow: 0 12px 36px rgba(0,0,0,0.18); }
/* --- Den flytende maskot-knappen ------------------------------------- */
.bndr-fab {
  position: fixed;
  right: 1.5rem; bottom: 1.5rem;
  z-index: 120;
  width: 76px; height: 92px;
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
  animation: bndr-fab-enter 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
.bndr-fab-stage {
  position: absolute;
  inset: 0;
  display: block;
  /* Figuren skal aldri «stjele» eller miste hover når den animeres — knappen
     alene definerer hover-flaten. Uten dette flimrer hover-tilstanden. */
  pointer-events: none;
}
/* Myk bakkeskygge — gir figuren tyngde uten en boks rundt seg */
.bndr-fab-shadow {
  position: absolute;
  left: 50%; bottom: 4px;
  width: 38px; height: 8px;
  margin-left: -19px;
  border-radius: 50%;
  background: rgba(0,0,0,0.28);
  filter: blur(3px);
  animation: bndr-fab-shadow 5.5s ease-in-out 1s infinite;
}
/* Inngangsanimasjonen — egen wrapper, se kommentaren i binders-fab.tsx */
.bndr-fab-enter {
  position: absolute;
  inset: 0;
  display: block;
  animation: bndr-fab-peek 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) both 0.15s;
}
.bndr-fab-mascot {
  position: absolute;
  left: 50%; bottom: 8px;
  width: 52px; height: 95px;
  margin-left: -26px;
  overflow: visible;
  transform-origin: 50% 100%;
  animation: bndr-fab-idle 5.5s ease-in-out 1s infinite;
  filter: drop-shadow(0 2px 3px rgba(0,0,0,0.18));
}
.bndr-fab:hover .bndr-fab-mascot {
  animation: bndr-fab-excited 0.9s ease-in-out infinite;
}
/* Åpent panel: hun trekker seg litt tilbake, men blir stående (ingen boks å
   dukke ned i lenger). Må stå etter :hover-regelen for å vinne. */
.bndr-fab-open .bndr-fab-mascot,
.bndr-fab-open:hover .bndr-fab-mascot {
  animation: none;
  transform: scale(0.88) translateY(3px);
  opacity: 0.75;
  transition: transform 0.25s ease, opacity 0.25s ease;
}
.bndr-fab-pupil { fill: #22303c; }
.bndr-fab-eye { animation: bndr-blink 4.6s infinite; transform-origin: 40px 52px; }
.bndr-fab-eye-r { transform-origin: 68px 52px; animation-delay: 0.06s; }
/* Blikket vandrer litt rundt i ro, låser seg på deg ved hover */
.bndr-fab-pupil { animation: bndr-fab-glance 7s ease-in-out infinite; }
.bndr-fab:hover .bndr-fab-pupil { animation: none; }
.bndr-fab-brow { transition: transform 0.25s ease; }
.bndr-fab:hover .bndr-fab-brow { transform: translateY(-4px); }
.bndr-fab-smile { opacity: 0; transition: opacity 0.25s ease; }
.bndr-fab:hover .bndr-fab-smile { opacity: 1; }
.bndr-fab-arm {
  transform-origin: 78px 96px;
  animation: bndr-fab-wave 3s ease-in-out 1.2s infinite;
}
.bndr-badge {
  position: absolute;
  top: 8px; right: -2px;
  min-width: 21px; height: 21px;
  display: flex; align-items: center; justify-content: center;
  padding: 0 5px;
  border-radius: 11px;
  background: var(--theme-error-500);
  color: white;
  font-size: 0.7rem; font-weight: 700;
  box-shadow: 0 2px 6px rgba(0,0,0,0.2);
}
.bndr-badge-ring {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  border: 2px solid var(--theme-error-500);
  animation: bndr-badge-ring 2.4s ease-out infinite;
}
@keyframes bndr-fab-enter {
  0% { opacity: 0; transform: translateY(28px); }
  100% { opacity: 1; transform: none; }
}
@keyframes bndr-fab-peek {
  0% { opacity: 0; transform: translateY(22px) scale(0.85); }
  100% { opacity: 1; transform: none; }
}
@keyframes bndr-fab-shadow {
  0%, 72%, 100% { transform: scaleX(1); opacity: 1; }
  78% { transform: scaleX(0.86); opacity: 0.75; }
  90% { transform: scaleX(0.94); opacity: 0.88; }
}
@keyframes bndr-fab-idle {
  0%, 72%, 100% { transform: translateY(0) rotate(0); }
  78% { transform: translateY(-3px) rotate(-5deg); }
  84% { transform: translateY(-1px) rotate(4deg); }
  90% { transform: translateY(-2px) rotate(-2deg); }
}
/* Starter og slutter på nøyaktig samme posisjon som idle hviler i, ellers
   hopper figuren i det hover slår inn og ut. */
@keyframes bndr-fab-excited {
  0%, 100% { transform: translateY(0) rotate(0); }
  35% { transform: translateY(-6px) rotate(-4deg); }
  70% { transform: translateY(-3px) rotate(4deg); }
}
@keyframes bndr-fab-glance {
  0%, 40%, 100% { transform: translateX(0); }
  50%, 62% { transform: translateX(-2.5px); }
  74%, 86% { transform: translateX(2.5px); }
}
@keyframes bndr-fab-wave {
  0%, 62%, 100% { transform: rotate(0); }
  72% { transform: rotate(-18deg); }
  82% { transform: rotate(6deg); }
  92% { transform: rotate(-11deg); }
}
@keyframes bndr-badge-ring {
  0% { transform: scale(1); opacity: 0.9; }
  70%, 100% { transform: scale(1.9); opacity: 0; }
}
.bndr-panel {
  position: fixed;
  right: 1.5rem; bottom: 7.2rem;
  z-index: 120;
  width: min(420px, calc(100vw - 2rem));
  max-height: calc(100vh - 8rem);
  overflow: auto;
  animation: bndr-panel-in 0.25s ease-out;
}
@keyframes bndr-panel-in {
  0% { opacity: 0; transform: translateY(10px) scale(0.98); }
  100% { opacity: 1; transform: none; }
}
@media (max-width: 640px) {
  .bndr-card { grid-template-columns: 1fr; }
  .bndr-figure-wrap { display: none; }
  .bndr-bubble::before, .bndr-bubble::after { display: none; }
}
@media (prefers-reduced-motion: reduce) {
  .bndr-figure, .bndr-eye, .bndr-shadow, .bndr-bubble, .bndr-caret,
  .bndr-fab, .bndr-panel, .bndr-mood-happy, .bndr-fab-mascot, .bndr-fab-arm,
  .bndr-fab-enter, .bndr-fab-shadow, .bndr-fab-eye, .bndr-fab-pupil,
  .bndr-badge-ring {
    animation: none !important;
  }
  .bndr-btn { transition: none; }
}
`}</style>
  );
}
