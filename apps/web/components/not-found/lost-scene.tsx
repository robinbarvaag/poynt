"use client";

import compass from "@/public/404/compass.png";
import sock from "@/public/404/sock.png";
import {
  type MotionValue,
  motion,
  motionValue,
  useReducedMotion,
  useSpring,
} from "framer-motion";
import Image from "next/image";
import type React from "react";
import { useRef, useState } from "react";

/**
 * To klistremerker som følger pekeren med ulikt etterslep: kompasset tett på,
 * sokken et stykke bak. Hjem-posisjon i prosent av scenen; der de står stille
 * når musa er utenfor, på berøring og ved prefers-reduced-motion.
 */
const stickers = [
  {
    key: "compass",
    src: compass,
    size: 96,
    home: { left: 78, top: 22 },
    offset: { x: 36, y: -36 },
    spring: { stiffness: 120, damping: 20 },
    rotate: -6,
  },
  {
    key: "sock",
    src: sock,
    size: 72,
    home: { left: 14, top: 68 },
    offset: { x: -80, y: 40 },
    spring: { stiffness: 60, damping: 18 },
    rotate: 8,
  },
] as const;

type Sticker = (typeof stickers)[number];

function TrailSticker({
  sticker,
  targetX,
  targetY,
}: {
  sticker: Sticker;
  targetX: MotionValue<number>;
  targetY: MotionValue<number>;
}) {
  const x = useSpring(targetX, sticker.spring);
  const y = useSpring(targetY, sticker.spring);

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none absolute z-0 hidden select-none sm:block"
      style={{
        left: `${sticker.home.left}%`,
        top: `${sticker.home.top}%`,
        width: sticker.size,
        x,
        y,
        rotate: sticker.rotate,
      }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <Image
        src={sticker.src}
        alt=""
        sizes={`${sticker.size}px`}
        className="h-auto w-full drop-shadow-[0_8px_16px_rgba(0,64,41,0.12)]"
        draggable={false}
        priority
      />
    </motion.div>
  );
}

/**
 * Scenen for 404-siden: rolig flate der et par klistremerker følger pekeren.
 * Innholdet (barn) ligger over. Ingen bevegelse med prefers-reduced-motion.
 */
export function LostScene({ children }: { children: React.ReactNode }) {
  const sceneRef = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const [targets] = useState(() =>
    stickers.map(() => ({ x: motionValue(0), y: motionValue(0) }))
  );

  function onPointerMove(event: React.PointerEvent<HTMLElement>) {
    if (reduce || event.pointerType !== "mouse") return;
    const scene = sceneRef.current;
    if (!scene) return;
    const rect = scene.getBoundingClientRect();
    const px = event.clientX - rect.left;
    const py = event.clientY - rect.top;

    for (const [i, sticker] of stickers.entries()) {
      const homeX = (rect.width * sticker.home.left) / 100;
      const homeY = (rect.height * sticker.home.top) / 100;
      targets[i].x.set(px - homeX - sticker.size / 2 + sticker.offset.x);
      targets[i].y.set(py - homeY - sticker.size / 2 + sticker.offset.y);
    }
  }

  function onPointerLeave() {
    for (const t of targets) {
      t.x.set(0);
      t.y.set(0);
    }
  }

  return (
    <section
      ref={sceneRef}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      className="relative isolate overflow-hidden"
    >
      {stickers.map((sticker, i) => (
        <TrailSticker
          key={sticker.key}
          sticker={sticker}
          targetX={targets[i].x}
          targetY={targets[i].y}
        />
      ))}
      <div className="relative z-10 mx-auto flex min-h-[calc(100svh-4rem)] max-w-2xl flex-col items-center justify-center px-4 py-16 text-center sm:px-6">
        {children}
      </div>
    </section>
  );
}
