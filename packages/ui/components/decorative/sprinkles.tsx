import { cn } from "../../lib/utils";

interface SprinklesProps {
  className?: string;
}

/**
 * Spredte redaksjonelle «stickers» — ring, prikk, pluss, squiggle, blob — i
 * merkefargene, fordelt langs kantene så de krydrer en seksjon uten å havne
 * oppå innholdet. Bygger på form-systemet i docs/DESIGN-PLAN.md §4. Legg i en
 * `relative`-container og gi innholdet `relative z-10` over. Rent dekorativ
 * (aria-hidden, pointer-events-none), driver sakte med `float-*`.
 */
export function Sprinkles({ className }: SprinklesProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 z-0 overflow-hidden",
        className
      )}
    >
      {/* Ring — oppe til venstre */}
      <span className="absolute top-[16%] left-[9%] size-9 animate-float-slow rounded-full border-[3px] border-salmon" />
      {/* Liten fylt prikk — øvre midt-venstre */}
      <span className="absolute top-[26%] left-[34%] size-2.5 animate-float-fast rounded-full bg-saffron" />
      {/* Pluss — oppe til høyre */}
      <svg
        className="absolute top-[14%] right-[11%] size-6 rotate-12 animate-float-medium text-primary"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      >
        <title>pluss</title>
        <path d="M12 5v14M5 12h14" />
      </svg>
      {/* Liten ring — høyre kant */}
      <span className="absolute top-[44%] right-[7%] size-4 animate-float-slow rounded-full border-2 border-primary/60" />
      {/* Squiggle — nede til venstre */}
      <svg
        className="absolute bottom-[20%] left-[12%] w-14 -rotate-6 animate-float-medium text-accent"
        viewBox="0 0 56 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      >
        <title>squiggle</title>
        <path d="M2 9C6 1 11 1 15 9s9 8 13 0 9-8 13 0 9 8 11 0" />
      </svg>
      {/* Blob — nede til høyre */}
      <span className="absolute right-[13%] bottom-[16%] size-10 animate-float-slow rounded-[60%_40%_55%_45%/50%_60%_40%_50%] bg-mint" />
      {/* Fylt prikk — nedre midt */}
      <span className="absolute bottom-[12%] left-[44%] size-3 animate-float-fast rounded-full bg-salmon" />
    </div>
  );
}
