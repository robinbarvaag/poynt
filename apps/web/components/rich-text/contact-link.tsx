"use client";

import { Popover, PopoverAnchor, PopoverContent, cn } from "@poynt/ui";
import { Check, Copy, PhoneCall, Send } from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";

const TEXT = {
  email: {
    action: "Send e-post",
    copy: "Kopier e-postadresse",
    copied: "E-postadressen er kopiert",
  },
  phone: {
    action: "Ring",
    copy: "Kopier telefonnummer",
    copied: "Nummeret er kopiert",
  },
} as const;

const itemClass =
  "flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm text-foreground no-underline outline-hidden select-none hover:bg-accent hover:text-accent-foreground hover:opacity-100 focus-visible:bg-accent focus-visible:text-accent-foreground [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground";

interface ContactLinkProps {
  kind: "email" | "phone";
  /** `mailto:`/`tel:`-adressen. */
  href: string;
  /** Adressen/nummeret slik det skal kopieres. */
  value: string;
  className?: string;
  children: ReactNode;
}

/**
 * E-post- og telefonlenke i rik tekst. Uten JavaScript er den en vanlig
 * `mailto:`/`tel:`-lenke; med JavaScript åpner klikket en liten meny med
 * «Send e-post»/«Ring» og «Kopier». Mange vil bare kopiere adressen i stedet
 * for å få opp e-postklienten, så begge valgene ligger like langt unna.
 */
export function ContactLink({
  kind,
  href,
  value,
  className,
  children,
}: ContactLinkProps) {
  const [open, setOpen] = useState(false);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">(
    "idle"
  );
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const anchorRef = useRef<HTMLAnchorElement>(null);
  const text = TEXT[kind];

  useEffect(() => {
    return () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    };
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopyState("copied");
    } catch {
      // Blir stående åpen så adressen (merkbar tekst øverst) kan kopieres
      // manuelt.
      setCopyState("failed");
      return;
    }
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => {
      setOpen(false);
      setCopyState("idle");
    }, 1400);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setCopyState("idle");
      }}
    >
      {/*
        Lenka er anker (ikke Radix-trigger): triggeren dropper sin egen
        åpne/lukke-logikk når klikket er preventDefault-et, og vi må stoppe
        navigasjonen til mailto:/tel:. Cmd/Ctrl/Shift-klikk og høyreklikk
        går rett til adressen som en vanlig lenke.
      */}
      <PopoverAnchor asChild>
        <a
          ref={anchorRef}
          href={href}
          className={className}
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={(event) => {
            if (event.metaKey || event.ctrlKey || event.shiftKey) return;
            event.preventDefault();
            setOpen((current) => !current);
          }}
        >
          {children}
        </a>
      </PopoverAnchor>
      <PopoverContent
        align="start"
        sideOffset={6}
        className="w-auto min-w-52 max-w-xs p-1 not-prose"
        onPointerDownOutside={(event) => {
          // Klikk på lenka igjen skal lukke via onClick over, ikke lukkes av
          // «utenfor»-logikken først og så åpnes på nytt.
          if (anchorRef.current?.contains(event.target as Node)) {
            event.preventDefault();
          }
        }}
      >
        <p className="select-all truncate px-2 py-1.5 text-xs text-muted-foreground">
          {value}
        </p>
        <a href={href} className={itemClass} onClick={() => setOpen(false)}>
          {kind === "email" ? <Send /> : <PhoneCall />}
          {text.action}
        </a>
        <button
          type="button"
          className={cn(itemClass, copyState === "copied" && "text-primary")}
          onClick={copy}
          aria-live="polite"
        >
          {copyState === "copied" ? <Check /> : <Copy />}
          {copyState === "copied"
            ? text.copied
            : copyState === "failed"
              ? "Kunne ikke kopiere – merk teksten over"
              : text.copy}
        </button>
      </PopoverContent>
    </Popover>
  );
}
