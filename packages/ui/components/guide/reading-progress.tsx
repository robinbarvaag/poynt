"use client";

import { useEffect, useState } from "react";
import { cn } from "../../lib/utils";

export interface ReadingProgressProps {
  /** Klasse på den fylte baren (default: bg-primary). */
  barClassName?: string;
  className?: string;
}

/**
 * Tynn lesefremdrifts-bar festet i toppen av viewporten. Fylles etter hvor langt
 * man har scrollet i dokumentet. Liten, rolig detalj som gir følelse av
 * progresjon i lange guider/artikler.
 */
export function ReadingProgress({
  barClassName,
  className,
}: ReadingProgressProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const update = () => {
      const el = document.documentElement;
      const max = el.scrollHeight - el.clientHeight;
      setProgress(max > 0 ? Math.min(100, (el.scrollTop / max) * 100) : 0);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div
      className={cn("fixed inset-x-0 top-0 z-50 h-1 bg-transparent", className)}
      aria-hidden="true"
    >
      <div
        className={cn(
          "h-full origin-left bg-primary transition-[width] duration-150 ease-out",
          barClassName
        )}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
