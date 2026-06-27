"use client";

import { LogoUpload } from "@/components/workspace/logo-upload";
import { trpc } from "@/lib/planner/trpc";
import {
  type BrandColor,
  type BrandColorRole,
  type BrandIdentity,
  brandColorRoleLabels,
  brandColorRoles,
} from "@poynt/planner-validators";
import {
  BrandHeader,
  Button,
  FontSpecimen,
  Input,
  Skeleton,
  SwatchGrid,
  toast,
} from "@poynt/ui";
import { Icon } from "@poynt/ui/icons";
import { useCallback, useEffect, useState } from "react";

interface BrandBookSectionProps {
  workspaceId: string;
  businessName: string;
  disabled?: boolean;
}

// Forslag i font-velgeren (Google Fonts). Brukeren kan også skrive fritt.
const FONT_SUGGESTIONS = [
  "Bricolage Grotesque",
  "Poppins",
  "Inter",
  "Playfair Display",
  "Lora",
  "Montserrat",
  "Work Sans",
  "Space Grotesk",
  "DM Sans",
  "Alice",
  "Merriweather",
  "Source Serif 4",
];

const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

/** Fargerad i editoren — BrandColor med en stabil klient-id for React-keys. */
type ColorRow = BrandColor & { _id: string };

/** Liten feltetikett — speiler BrandBriefSection. */
function FieldLabel({ children }: { children: React.ReactNode }) {
  return <p className="font-medium text-sm">{children}</p>;
}

/**
 * Merkevare-boka: den visuelle identiteten (logo, fargepalett, fonter, tagline).
 * Live forhåndsvisning øverst, redigering under. Lagres i `brandIdentity` på
 * workspace-profilen — egen kolonne fra `brandBrief` (stemmen), så de to
 * seksjonene aldri overskriver hverandre. Farger/fonter/tagline mater også
 * AI-verktøyene (via getWorkspaceProfileBlock).
 */
export function BrandBookSection({
  workspaceId,
  businessName,
  disabled = false,
}: BrandBookSectionProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [tagline, setTagline] = useState("");
  // Fargerader bærer en stabil klient-id (_id) så React-keys er trygge ved
  // legg-til/fjern/reorder. Id-en strippes før lagring.
  const [colors, setColors] = useState<ColorRow[]>([]);
  const [headingFont, setHeadingFont] = useState("");
  const [bodyFont, setBodyFont] = useState("");

  const populate = useCallback((identity: BrandIdentity) => {
    setLogoUrl(identity.logoUrl ?? null);
    setTagline(identity.tagline ?? "");
    setColors(
      (identity.colors ?? [])
        .filter((c): c is BrandColor => Boolean(c?.hex))
        .map((c) => ({ ...c, _id: crypto.randomUUID() }))
    );
    setHeadingFont(identity.fonts?.heading ?? "");
    setBodyFont(identity.fonts?.body ?? "");
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const profile = await trpc.workspaceProfile.get.query({ workspaceId });
        if (!active) return;
        const identity = profile?.brandIdentity as
          | BrandIdentity
          | null
          | undefined;
        if (identity) populate(identity);
      } catch {
        // ignorer — vis tom editor
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [workspaceId, populate]);

  /** Bygger identiteten fra nåværende state (med valgfrie overstyringer). */
  function buildIdentity(overrides?: Partial<BrandIdentity>): BrandIdentity {
    const validColors = colors
      .filter((c) => HEX_RE.test(c.hex))
      .map(({ _id, ...c }) => c);
    return {
      logoUrl: logoUrl || null,
      tagline: tagline.trim() || null,
      colors: validColors.length > 0 ? validColors : null,
      fonts:
        headingFont || bodyFont
          ? { heading: headingFont || null, body: bodyFont || null }
          : null,
      ...overrides,
    };
  }

  async function persist(identity: BrandIdentity, quiet = false) {
    setSaving(true);
    try {
      await trpc.workspaceProfile.upsert.mutate({
        workspaceId,
        brandIdentity: identity,
      });
      if (!quiet) {
        toast.success("Merkevaren er lagret. Verktøyene bruker den nå.");
      }
    } catch {
      toast.error("Kunne ikke lagre. Prøv igjen.");
    } finally {
      setSaving(false);
    }
  }

  // Logo lagres umiddelbart etter opplasting/fjerning (resten via «Lagre»).
  function handleLogo(url: string | null) {
    setLogoUrl(url);
    persist(buildIdentity({ logoUrl: url }), true);
  }

  function addColor() {
    setColors((cs) => [
      ...cs,
      { hex: "#29664f", name: "", role: "primary", _id: crypto.randomUUID() },
    ]);
  }
  function updateColor(id: string, patch: Partial<BrandColor>) {
    setColors((cs) => cs.map((c) => (c._id === id ? { ...c, ...patch } : c)));
  }
  function removeColor(id: string) {
    setColors((cs) => cs.filter((c) => c._id !== id));
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  const previewColors = colors.filter((c) => HEX_RE.test(c.hex));
  const hasPreview =
    Boolean(logoUrl) ||
    Boolean(tagline) ||
    previewColors.length > 0 ||
    Boolean(headingFont) ||
    Boolean(bodyFont);

  return (
    <div className="space-y-8">
      {/* Live forhåndsvisning — selve «boka» */}
      {hasPreview && (
        <div className="space-y-6 rounded-3xl bg-muted/40 p-4 ring-1 ring-foreground/5 sm:p-6">
          <BrandHeader
            name={businessName}
            logoUrl={logoUrl}
            tagline={tagline || null}
            surface="cream"
          />
          {previewColors.length > 0 && <SwatchGrid colors={previewColors} />}
          {(headingFont || bodyFont) && (
            <div className="grid gap-4 sm:grid-cols-2">
              {headingFont && <FontSpecimen fontFamily={headingFont} />}
              {bodyFont && <FontSpecimen fontFamily={bodyFont} />}
            </div>
          )}
        </div>
      )}

      {/* Editorer */}
      <datalist id="brand-font-suggestions">
        {FONT_SUGGESTIONS.map((f) => (
          <option key={f} value={f} />
        ))}
      </datalist>

      <div className="space-y-2">
        <LogoUpload
          value={logoUrl}
          onChange={handleLogo}
          disabled={disabled}
          hint="PNG, JPG, WEBP eller SVG. Maks 5 MB."
        />
      </div>

      <div className="space-y-2">
        <FieldLabel>Tagline</FieldLabel>
        <Input
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
          placeholder="Kort setning som fanger merkevaren"
          disabled={disabled}
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <FieldLabel>Fargepalett</FieldLabel>
          {!disabled && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addColor}
              className="gap-1.5"
            >
              <Icon name="plus" className="size-4" />
              Legg til farge
            </Button>
          )}
        </div>
        {colors.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Ingen farger enda. Legg til merkevarens farger så de vises i boka og
            brukes av verktøyene.
          </p>
        ) : (
          <div className="space-y-2.5">
            {colors.map((c) => (
              <div
                key={c._id}
                className="flex flex-wrap items-center gap-2.5 rounded-2xl bg-card p-2.5 ring-1 ring-foreground/10"
              >
                <input
                  type="color"
                  value={HEX_RE.test(c.hex) ? c.hex : "#29664f"}
                  onChange={(e) => updateColor(c._id, { hex: e.target.value })}
                  disabled={disabled}
                  className="size-9 shrink-0 cursor-pointer rounded-lg border-0 bg-transparent p-0"
                  aria-label="Velg farge"
                />
                <Input
                  value={c.hex}
                  onChange={(e) => updateColor(c._id, { hex: e.target.value })}
                  disabled={disabled}
                  className="w-28 font-mono uppercase"
                  placeholder="#29664f"
                />
                <Input
                  value={c.name ?? ""}
                  onChange={(e) => updateColor(c._id, { name: e.target.value })}
                  disabled={disabled}
                  className="min-w-32 flex-1"
                  placeholder="Navn (f.eks. Skog)"
                />
                <select
                  value={c.role ?? "primary"}
                  onChange={(e) =>
                    updateColor(c._id, {
                      role: e.target.value as BrandColorRole,
                    })
                  }
                  disabled={disabled}
                  className="h-9 rounded-lg border border-input bg-background px-2 text-sm"
                >
                  {brandColorRoles.map((r) => (
                    <option key={r} value={r}>
                      {brandColorRoleLabels[r]}
                    </option>
                  ))}
                </select>
                {!disabled && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeColor(c._id)}
                    className="text-muted-foreground"
                    aria-label="Fjern farge"
                  >
                    <Icon name="trash" className="size-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <FieldLabel>Overskriftsfont</FieldLabel>
          <Input
            value={headingFont}
            onChange={(e) => setHeadingFont(e.target.value)}
            disabled={disabled}
            list="brand-font-suggestions"
            placeholder="f.eks. Bricolage Grotesque"
          />
        </div>
        <div className="space-y-2">
          <FieldLabel>Brødtekstfont</FieldLabel>
          <Input
            value={bodyFont}
            onChange={(e) => setBodyFont(e.target.value)}
            disabled={disabled}
            list="brand-font-suggestions"
            placeholder="f.eks. Poppins"
          />
        </div>
      </div>

      {!disabled && (
        <div className="flex items-center gap-3 pt-1">
          <Button
            type="button"
            onClick={() => persist(buildIdentity())}
            disabled={saving}
            className="gap-2"
          >
            {saving ? (
              <Icon name="loader" className="size-4 animate-spin" />
            ) : (
              <Icon name="check" className="size-4" />
            )}
            Lagre merkevaren
          </Button>
        </div>
      )}
    </div>
  );
}
