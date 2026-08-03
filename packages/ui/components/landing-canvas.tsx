import type { ReactNode } from "react";
import { cn } from "../lib/utils";
import { ReadingProgress } from "./guide/reading-progress";

export interface LandingCanvasProps {
  children: ReactNode;
  /** Tynn fremdriftsbar i toppen. Default true. */
  progress?: boolean;
  className?: string;
}

/**
 * Rammen rundt en landingsside («Sidetype: landingsside» på Sider). Den gjør
 * to ting og bare to: legger en rolig fargevask bak hele siden, og viser hvor
 * langt ned man har kommet. Alt annet «liv» hører hjemme i blokkene — en side
 * der bakgrunnen også beveger seg blir urolig å lese.
 */
export function LandingCanvas({
  children,
  progress = true,
  className,
}: LandingCanvasProps) {
  return (
    <div className={cn("relative", className)}>
      {progress && <ReadingProgress />}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(60rem_40rem_at_15%_-5%,color-mix(in_oklab,var(--color-accent-1)_55%,transparent),transparent),radial-gradient(50rem_35rem_at_95%_10%,color-mix(in_oklab,var(--color-accent-2)_45%,transparent),transparent)]"
      />
      {children}
    </div>
  );
}
