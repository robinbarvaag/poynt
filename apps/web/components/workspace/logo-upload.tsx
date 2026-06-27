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
  disabled?: boolean;
  /** Bakgrunn bak forhåndsvisningen (logo kan være mørk eller lys). */
  previewClassName?: string;
}

/**
 * Gjenbrukbar bildeopplasting for merkevare-bilder (logo, moodboard). Laster
 * opp til /api/on-poynt/upload (Vercel Blob) og gir URL-en tilbake via onChange.
 */
export function LogoUpload({
  value,
  onChange,
  label = "Logo",
  hint,
  disabled,
  previewClassName,
}: LogoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const inputId = useId();

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

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <span className="font-medium text-foreground text-sm">{label}</span>
      )}
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-muted ring-1 ring-foreground/10",
            previewClassName
          )}
        >
          {value ? (
            <img
              src={value}
              alt="Logo-forhåndsvisning"
              className="size-full object-contain p-1.5"
            />
          ) : (
            <Icon name="image" className="size-7 text-muted-foreground" />
          )}
        </div>

        <div className="flex flex-wrap gap-2">
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
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled || uploading}
            onClick={() => inputRef.current?.click()}
            className="gap-2"
          >
            <Icon
              name={uploading ? "loader" : "upload"}
              className={cn("size-4", uploading && "animate-spin")}
            />
            {value ? "Bytt bilde" : "Last opp"}
          </Button>
          {value && (
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
          )}
        </div>
      </div>
      {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
    </div>
  );
}
