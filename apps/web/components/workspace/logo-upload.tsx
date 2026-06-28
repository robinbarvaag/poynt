"use client";

import { Button, cn, toast } from "@poynt/ui";
import { Icon } from "@poynt/ui/icons";
import { useId, useRef, useState } from "react";

interface LogoUploadProps {
  /** Nåværende bilde-URL (eller null/tom). */
  value?: string | null;
  /** Kalles med ny URL etter opplasting, eller null når bildet fjernes. */
  onChange: (url: string | null) => void;
  label?: string;
  /** Hjelpetekst under feltet. */
  hint?: string;
  /** Tekst i tom dra-og-slipp-sone. */
  dropLabel?: string;
  disabled?: boolean;
  /** Bakgrunn bak forhåndsvisningen (logo kan være mørk eller lys). */
  previewClassName?: string;
}

/**
 * Gjenbrukbar bildeopplasting for merkevare-bilder (logo, moodboard). Dra-og-
 * slipp eller klikk. Laster opp til /api/on-poynt/upload (Vercel Blob) og gir
 * URL-en tilbake via onChange. Tom tilstand er en full dra-sone; når et bilde
 * finnes vises forhåndsvisning + «Bytt bilde»/«Fjern», og hele raden tar imot
 * en ny fil ved dra-og-slipp.
 */
export function LogoUpload({
  value,
  onChange,
  label = "Logo",
  hint,
  dropLabel = "Dra logoen hit, eller klikk for å laste opp",
  disabled,
  previewClassName,
}: LogoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputId = useId();
  const interactive = !(disabled || uploading);

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/on-poynt/upload", {
        method: "POST",
        body,
      });
      const data = (await res.json().catch(() => ({}))) as {
        url?: string;
        error?: string;
      };
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? "Opplasting feilet");
      }
      onChange(data.url);
      toast.success("Bildet er lastet opp.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Opplasting feilet");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function openPicker() {
    if (interactive) inputRef.current?.click();
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (!interactive) return;
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function onDragOver(e: React.DragEvent) {
    if (!interactive) return;
    e.preventDefault();
    setDragging(true);
  }

  return (
    <div
      className="flex flex-col gap-2"
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={() => setDragging(false)}
    >
      {label && (
        <span className="font-medium text-foreground text-sm">{label}</span>
      )}

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
        className="hidden"
        disabled={disabled || uploading}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      {value ? (
        <div
          className={cn(
            "flex items-center gap-4 rounded-2xl border border-transparent p-1 transition-colors",
            dragging && "border-dashed border-primary/50 bg-primary/5"
          )}
        >
          <div
            className={cn(
              "flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-muted ring-1 ring-foreground/10",
              previewClassName
            )}
          >
            <img
              src={value}
              alt="Logo-forhåndsvisning"
              className="size-full object-contain p-2"
            />
          </div>

          <div className="flex flex-col items-start gap-2">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={disabled || uploading}
                onClick={openPicker}
                className="gap-2"
              >
                <Icon
                  name={uploading ? "loader" : "upload"}
                  className={cn("size-4", uploading && "animate-spin")}
                />
                Bytt bilde
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={disabled || uploading}
                onClick={() => onChange(null)}
                className="gap-2 text-muted-foreground"
              >
                <Icon name="trash" className="size-4" />
                Fjern
              </Button>
            </div>
            {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled || uploading}
          onClick={openPicker}
          className={cn(
            "flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-8 text-center transition-colors",
            "border-input bg-muted/30 hover:border-primary/40 hover:bg-muted/50",
            dragging && "border-primary/60 bg-primary/5",
            (disabled || uploading) && "cursor-not-allowed opacity-60"
          )}
        >
          <span className="flex size-11 items-center justify-center rounded-full bg-background ring-1 ring-foreground/10">
            <Icon
              name={uploading ? "loader" : "upload"}
              className={cn(
                "size-5 text-muted-foreground",
                uploading && "animate-spin"
              )}
            />
          </span>
          <span className="font-medium text-foreground text-sm">
            {uploading ? "Laster opp …" : dropLabel}
          </span>
          {hint && (
            <span className="text-muted-foreground text-xs">{hint}</span>
          )}
        </button>
      )}
    </div>
  );
}
