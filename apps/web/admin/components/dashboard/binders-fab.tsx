"use client";

import { useEffect, useState } from "react";

/**
 * Selve «knappen» til den flytende Bindersen — en maskot som står fritt i
 * hjørnet, blunker, ser seg rundt og vinker med en notatlapp når hun har noe
 * på hjertet. Bevisst ren SVG + CSS (ingen Lottie-runtime i admin-panelet),
 * men rigget som en figur: kropp, øyne, bryn og arm animeres hver for seg.
 *
 * To fallgruver som er fikset her, ikke gjeninnfør dem:
 * 1. Hover håndteres KUN i CSS (:hover på knappen), og figuren har
 *    pointer-events: none. Ellers flimrer den — figuren animeres vekk fra
 *    musepekeren, knappen mister hover, figuren går tilbake, og det looper.
 * 2. Inngangsanimasjonen ligger på en egen wrapper. Legges den på samme
 *    element som idle/hover, overskriver hover-animasjonen sluttposisjonen
 *    og hele inngangen spilles om igjen — figuren spretter opp nedenfra.
 */

type Props = {
  count: number;
  open: boolean;
  onClick: () => void;
};

export const BindersFab = ({ count, open, onClick }: Props) => {
  // Små, uforutsigbare «livstegn» så hun ikke føles som en løkke på repeat.
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let timer: number;
    const schedule = () => {
      // Mellom 7 og 15 sekunder til neste lille rykk.
      timer = window.setTimeout(
        () => {
          setTick((t) => t + 1);
          schedule();
        },
        7000 + Math.random() * 8000
      );
    };
    schedule();
    return () => window.clearTimeout(timer);
  }, []);

  const waving = count > 0 && !open;

  return (
    <button
      type="button"
      className={`bndr-fab${open ? " bndr-fab-open" : ""}`}
      onClick={onClick}
      title={open ? "Lukk Bindersen" : "Åpne Bindersen"}
      aria-label={
        open
          ? "Lukk Bindersen"
          : count > 0
            ? `Åpne Bindersen — ${count} forslag`
            : "Åpne Bindersen"
      }
      aria-expanded={open}
    >
      <span className="bndr-fab-stage">
        {/* Inngangsanimasjonen bor på wrapperen, idle/hover på selve figuren.
            Deler de samme elementet, «mister» hover sluttposisjonen og hele
            inngangen spilles om igjen — figuren spretter da opp nedenfra. */}
        <span className="bndr-fab-enter">
          {/* «key» på tick gir henne et nytt rykk med jevne mellomrom */}
          <svg
            key={tick}
            className="bndr-fab-mascot"
            viewBox="0 0 110 200"
            aria-hidden="true"
            focusable="false"
          >
            <title>Bindersen</title>
            <defs>
              <linearGradient id="bndr-fab-wire" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#b3c6d8" />
                <stop offset="50%" stopColor="#7d99b1" />
                <stop offset="100%" stopColor="#54738d" />
              </linearGradient>
            </defs>

            {/* Arm + notatlapp i én gruppe, så de vinker sammen fra «skulderen» */}
            {waving && (
              <g className="bndr-fab-arm">
                <path
                  d="M78,96 C96,88 104,74 101,60"
                  fill="none"
                  stroke="url(#bndr-fab-wire)"
                  strokeWidth="6"
                  strokeLinecap="round"
                />
                <g transform="rotate(14 101 52)">
                  <rect
                    x="86"
                    y="30"
                    width="30"
                    height="34"
                    rx="3"
                    fill="#fffdf5"
                    stroke="#c9bfa8"
                    strokeWidth="2"
                  />
                  <path
                    d="M92,40h18M92,47h18M92,54h11"
                    stroke="#c9bfa8"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </g>
              </g>
            )}

            {/* Ståltråden — én sammenhengende binders-form */}
            <g className="bndr-fab-body">
              <path
                d="M28,66 L28,150 A24,24 0 0 0 76,150 L76,52 A17,17 0 0 0 42,52 L42,140"
                fill="none"
                stroke="url(#bndr-fab-wire)"
                strokeWidth="7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              <g className="bndr-fab-face">
                <g className="bndr-fab-eye">
                  <ellipse
                    cx="40"
                    cy="52"
                    rx="12"
                    ry="14"
                    fill="#fff"
                    stroke="#22303c"
                    strokeWidth="2.5"
                  />
                  <circle className="bndr-fab-pupil" cx="41" cy="54" r="4.5" />
                </g>
                <g className="bndr-fab-eye bndr-fab-eye-r">
                  <ellipse
                    cx="68"
                    cy="52"
                    rx="12"
                    ry="14"
                    fill="#fff"
                    stroke="#22303c"
                    strokeWidth="2.5"
                  />
                  <circle className="bndr-fab-pupil" cx="69" cy="54" r="4.5" />
                </g>
                <path
                  className="bndr-fab-brow"
                  d="M30,33 Q40,28 50,32"
                  fill="none"
                  stroke="#22303c"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <path
                  className="bndr-fab-brow"
                  d="M58,32 Q68,28 78,33"
                  fill="none"
                  stroke="#22303c"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                {/* Lite smil, dukker opp på hover */}
                <path
                  className="bndr-fab-smile"
                  d="M46,74 Q54,81 62,74"
                  fill="none"
                  stroke="#22303c"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </g>
            </g>
          </svg>
        </span>
        {/* Myk skygge i stedet for en boks — figuren står fritt */}
        <span className="bndr-fab-shadow" />
      </span>

      {waving && (
        <span className="bndr-badge">
          <span className="bndr-badge-ring" />
          {count}
        </span>
      )}
    </button>
  );
};
