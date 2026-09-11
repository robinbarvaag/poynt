"use client";

import { DriftingBlob } from "@poynt/ui/motion";
import {
  type MotionValue,
  motion,
  motionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  useVelocity,
} from "framer-motion";
import Image from "next/image";
import type React from "react";
import { useRef, useState } from "react";

/**
 * Klistremerkene som «har stukket av» sammen med siden. Hver har en hjem-
 * posisjon (prosent av scenen) og en egen fjær: stivere fjær = tettere på
 * pekeren, slappere = lenger bak i rekka. Sammen gir det en konga-rekke som
 * følger musa rundt på siden.
 */
const stickers = [
  {
    src: "/404/compass.png",
    alt: "",
    size: 150,
    home: { left: 74, top: 18 },
    offset: { x: 60, y: -40 },
    spring: { stiffness: 170, damping: 18 },
    rotate: -8,
  },
  {
    src: "/404/map.png",
    alt: "",
    size: 190,
    home: { left: 10, top: 12 },
    offset: { x: -150, y: -110 },
    spring: { stiffness: 110, damping: 17 },
    rotate: 6,
  },
  {
    src: "/404/paper-plane.png",
    alt: "",
    size: 130,
    home: { left: 84, top: 62 },
    offset: { x: 120, y: 70 },
    spring: { stiffness: 80, damping: 15 },
    rotate: 12,
  },
  {
    src: "/404/magnifier.png",
    alt: "",
    size: 140,
    home: { left: 6, top: 66 },
    offset: { x: -130, y: 90 },
    spring: { stiffness: 60, damping: 14 },
    rotate: -14,
  },
  {
    src: "/404/sock.png",
    alt: "",
    size: 110,
    home: { left: 46, top: 84 },
    offset: { x: 20, y: 150 },
    spring: { stiffness: 45, damping: 13 },
    rotate: 18,
  },
] as const;

type Sticker = (typeof stickers)[number];

/** Ett klistremerke: fjær mot målpunktet + lener seg i fartsretningen. */
function TrailSticker({
  sticker,
  index,
  targetX,
  targetY,
  active,
  drift,
}: {
  sticker: Sticker;
  index: number;
  targetX: MotionValue<number>;
  targetY: MotionValue<number>;
  active: boolean;
  drift: boolean;
}) {
  const x = useSpring(targetX, sticker.spring);
  const y = useSpring(targetY, sticker.spring);
  // Fart → helning: klistremerket «lener seg inn» når det svinger.
  const vx = useVelocity(x);
  const lean = useTransform(vx, [-1500, 1500], [-22, 22]);
  const rotate = useTransform(lean, (v) => sticker.rotate + v);

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none absolute z-0 select-none"
      style={{
        left: `${sticker.home.left}%`,
        top: `${sticker.home.top}%`,
        width: sticker.size,
        x,
        y,
        rotate,
      }}
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        delay: 0.15 + index * 0.08,
        type: "spring",
        stiffness: 200,
        damping: 16,
      }}
    >
      <motion.div
        animate={
          drift && !active
            ? { y: [0, -10, 0], rotate: [0, index % 2 ? 3 : -3, 0] }
            : { y: 0, rotate: 0 }
        }
        transition={{
          duration: 5 + index,
          ease: "easeInOut",
          repeat: Number.POSITIVE_INFINITY,
        }}
        className="drop-shadow-[0_12px_24px_rgba(0,64,41,0.18)]"
      >
        <Image
          src={sticker.src}
          alt={sticker.alt}
          width={sticker.size}
          height={sticker.size}
          sizes={`${sticker.size}px`}
          draggable={false}
          priority={index < 2}
        />
      </motion.div>
    </motion.div>
  );
}

/**
 * Scenen for 404-siden: full-bredde flate med drivende former, en rekke
 * klistremerker som følger pekeren, og innholdet (barn) over. Med berøring
 * eller prefers-reduced-motion står klistremerkene hjemme og dupper rolig.
 */
export function LostScene({ children }: { children: React.ReactNode }) {
  const sceneRef = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const [active, setActive] = useState(false);

  // Ett målpunkt per klistremerke (relativt til hjem-posisjonen). Lages én
  // gang med motionValue-fabrikken, så vi slipper hooks inne i map.
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
    if (!active) setActive(true);

    for (const [i, sticker] of stickers.entries()) {
      const homeX = (rect.width * sticker.home.left) / 100;
      const homeY = (rect.height * sticker.home.top) / 100;
      targets[i].x.set(px - homeX - sticker.size / 2 + sticker.offset.x);
      targets[i].y.set(py - homeY - sticker.size / 2 + sticker.offset.y);
    }
  }

  function onPointerLeave() {
    setActive(false);
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
      className="-mt-16 relative isolate min-h-svh overflow-hidden bg-accent-1/45"
    >
      <DriftingBlob
        className="-top-24 -left-20 size-[28rem] bg-accent-2/70"
        duration={22}
      />
      <DriftingBlob
        className="-right-24 top-1/3 size-[26rem] bg-accent-3/70"
        duration={19}
      />
      <DriftingBlob
        className="-bottom-32 left-1/3 size-[30rem] bg-accent-5/40"
        duration={25}
      />

      {stickers.map((sticker, i) => (
        <TrailSticker
          key={sticker.src}
          sticker={sticker}
          index={i}
          targetX={targets[i].x}
          targetY={targets[i].y}
          active={active}
          drift={!reduce}
        />
      ))}

      <div className="relative z-10 mx-auto flex min-h-svh max-w-5xl flex-col items-center justify-center px-4 pt-24 pb-16 text-center sm:px-6 lg:px-8">
        {children}
      </div>
    </section>
  );
}
