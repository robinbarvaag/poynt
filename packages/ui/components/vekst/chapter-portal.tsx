"use client";

import type { ReactNode } from "react";
import { Icon } from "../../icons";
import { UILink } from "../../lib/link";
import { cn } from "../../lib/utils";
import {
  type ChapterPalette,
  POYNT_CHAPTER_PALETTE,
} from "../marketing/chapter-rotator";
import { SectionHeader } from "../section-header";
import { vekstVars } from "./palette";
import { useStoredState } from "./use-stored-state";

export interface PortalDoor {
  /** Bokstaven på døra. Default: første bokstav i tittelen. */
  letter?: string;
  title: string;
  text?: string;
  /** Typisk et #anker til verktøyet lenger ned, eller en side. */
  href?: string;
  linkLabel?: string;
}

export interface ChapterPortalProps {
  eyebrow?: string;
  title?: string;
  intro?: string;
  doors: PortalDoor[];
  palette?: ChapterPalette;
  className?: string;
}

const STORAGE_KEY = "vekst-portal-besokt";

/** Buet dørtopp. Elliptisk radius (med «/») tåler ikke Tailwinds klassesyntaks. */
const DOOR_ARCH = "50% 50% 1rem 1rem / 38% 38% 1rem 1rem";

function DoorShell({
  href,
  onVisit,
  className,
  children,
}: {
  href?: string;
  onVisit: () => void;
  className: string;
  children: ReactNode;
}) {
  if (!href) return <div className={className}>{children}</div>;
  return (
    <UILink href={href} onClick={onVisit} className={className}>
      {children}
    </UILink>
  );
}

/**
 * Kapittelportalen: én dør per bokstav i VEKST. Døra svinger opp når du peker
 * på den, og dører du alt har gått gjennom står på gløtt med en hake.
 */
export function ChapterPortal({
  eyebrow,
  title,
  intro,
  doors,
  palette = POYNT_CHAPTER_PALETTE,
  className,
}: ChapterPortalProps) {
  const [visited, setVisited] = useStoredState<string[]>(
    STORAGE_KEY,
    [],
    (raw) =>
      Array.isArray(raw)
        ? raw.filter((v): v is string => typeof v === "string")
        : null
  );

  if (doors.length === 0) return null;

  return (
    <div style={vekstVars(palette)} className={className}>
      <SectionHeader eyebrow={eyebrow} title={title} intro={intro} />

      <ul className="grid grid-cols-[repeat(auto-fit,minmax(9rem,1fr))] gap-x-4 gap-y-8">
        {doors.map((door) => {
          const letter = (
            door.letter?.trim() || door.title.trim().charAt(0)
          ).toUpperCase();
          const seen = visited.includes(door.title);
          return (
            <li key={door.title}>
              <DoorShell
                href={door.href}
                onVisit={() =>
                  setVisited((v) =>
                    v.includes(door.title) ? v : [...v, door.title]
                  )
                }
                className="group flex h-full flex-col gap-3 rounded-3xl focus-visible:outline-none"
              >
                <span
                  className="relative block aspect-[3/4] w-full overflow-hidden bg-[var(--vk-accent)] ring-[3px] ring-[var(--vk-surface)] perspective-[900px] group-focus-visible:ring-ring"
                  style={{ borderRadius: DOOR_ARCH }}
                >
                  {/* Lyset bak døra. */}
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 grid place-items-center text-[var(--vk-accent-ink)]"
                  >
                    <Icon
                      name="arrow-right"
                      className="size-7 translate-x-3 transition-transform duration-500 group-hover:translate-x-5"
                    />
                  </span>
                  <span
                    aria-hidden="true"
                    className={cn(
                      "absolute inset-0 origin-left bg-[var(--vk-surface)] text-[var(--vk-ink)] shadow-[inset_-6px_0_12px_-8px_rgba(0,0,0,0.35)] transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
                      seen && "[transform:rotateY(-22deg)]",
                      "group-hover:[transform:rotateY(-64deg)] group-focus-visible:[transform:rotateY(-64deg)]"
                    )}
                    style={{ borderRadius: DOOR_ARCH }}
                  >
                    <span className="absolute inset-x-0 top-[34%] text-center font-extrabold font-heading text-6xl leading-none">
                      {letter}
                    </span>
                    <span className="absolute top-[60%] right-[14%] size-2.5 rounded-full bg-[var(--vk-accent)]" />
                  </span>
                  {seen && (
                    <span className="absolute top-3 right-3 grid size-7 place-items-center rounded-full bg-card text-foreground shadow">
                      <Icon name="check" className="size-4" />
                      <span className="sr-only">Besøkt</span>
                    </span>
                  )}
                </span>
                <span className="flex flex-col gap-1 px-1">
                  <span className="font-bold font-heading text-lg leading-snug">
                    {door.title}
                  </span>
                  {door.text && (
                    <span className="text-muted-foreground text-sm leading-relaxed">
                      {door.text}
                    </span>
                  )}
                  {door.href && (
                    <span className="mt-1 inline-flex items-center gap-1 font-heading font-semibold text-sm group-hover:underline group-hover:underline-offset-4">
                      {door.linkLabel || "Gå inn"}
                      <Icon name="arrow-right" className="size-3.5" />
                    </span>
                  )}
                </span>
              </DoorShell>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
