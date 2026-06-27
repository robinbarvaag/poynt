"use client";

import { useState } from "react";
import { Icon } from "../../icons";
import { cn } from "../../lib/utils";

export interface ColorSwatchProps {
  /** Hex-verdi, f.eks. «#29664f». */
  hex: string;
  /** Valgfritt navn på fargen («Skog», «Saffran»). */
  name?: string | null;
  /** Valgfri rolle-etikett («Primær», «Aksent»). */
  role?: string | null;
  /** Skjul kopiér-knappen (f.eks. i en ren visningskontekst). */
  hideCopy?: boolean;
  className?: string;
}

/** Velger lesbar tekstfarge (mørk/lys) ut fra fargens opplevde lyshet. */
function readableInk(hex: string): string {
  const m = hex.replace("#", "");
  const full =
    m.length === 3
      ? m
          .split("")
          .map((c) => c + c)
          .join("")
      : m;
  if (full.length !== 6) return "#1a1a1a";
  const r = Number.parseInt(full.slice(0, 2), 16);
  const g = Number.parseInt(full.slice(2, 4), 16);
  const b = Number.parseInt(full.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.62 ? "#1a1a1a" : "#ffffff";
}

/**
 * Ett fargekort i merkevare-paletten: stor fargeflate (squircle) med rolle og
 * hex/navn under. Klikk på flaten kopierer hex-en til utklippstavlen.
 */
export function ColorSwatch({
  hex,
  name,
  role,
  hideCopy = false,
  className,
}: ColorSwatchProps) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (hideCopy || typeof navigator === "undefined") return;
    try {
      await navigator.clipboard.writeText(hex);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      // stille — kopiering er en bonus
    }
  }

  const ink = readableInk(hex);

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <button
        type="button"
        onClick={copy}
        disabled={hideCopy}
        style={{ backgroundColor: hex, color: ink }}
        className={cn(
          "group relative flex h-24 w-full items-end justify-between rounded-2xl p-3 ring-1 ring-foreground/10 transition",
          !hideCopy && "cursor-pointer hover:ring-foreground/25"
        )}
        aria-label={hideCopy ? hex : `Kopier ${hex}`}
      >
        {role && (
          <span className="font-medium text-[0.65rem] uppercase tracking-[0.14em] opacity-80">
            {role}
          </span>
        )}
        {!hideCopy && (
          <span className="ml-auto opacity-0 transition group-hover:opacity-90">
            <Icon name={copied ? "check" : "copy"} className="size-4" />
          </span>
        )}
      </button>
      <div className="flex flex-col">
        {name && (
          <span className="font-medium text-foreground text-sm">{name}</span>
        )}
        <code className="text-muted-foreground text-xs uppercase">{hex}</code>
      </div>
    </div>
  );
}
