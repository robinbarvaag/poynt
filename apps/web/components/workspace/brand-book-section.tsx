"use client";

import { LogoUpload } from "@/components/workspace/logo-upload";
import { trpc } from "@/lib/planner/trpc";
import {
  type BrandColor,
  type BrandColorRole,
  type BrandCustomFont,
  type BrandIdentity,
  brandColorRoleLabels,
  brandColorRoles,
} from "@poynt/planner-validators";
import {
  BrandHeader,
  Button,
  FontSpecimen,
  Input,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
  Skeleton,
  SwatchGrid,
  toast,
} from "@poynt/ui";
import { Icon } from "@poynt/ui/icons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface BrandBookSectionProps {
  workspaceId: string;
  businessName: string;
  disabled?: boolean;
}

// Kuratert, men romslig utvalg av Google Fonts (sans, serif, display, mono).
// Alle lastes live i forhåndsvisningen via FontSpecimen.
const GOOGLE_FONTS = [
  "Inter",
  "Poppins",
  "Montserrat",
  "Work Sans",
  "DM Sans",
  "Space Grotesk",
  "Bricolage Grotesque",
  "Manrope",
  "Plus Jakarta Sans",
  "Figtree",
  "Outfit",
  "Sora",
  "Lexend",
  "Albert Sans",
  "Onest",
  "Geist",
  "Nunito",
  "Nunito Sans",
  "Rubik",
  "Mulish",
  "Karla",
  "Hanken Grotesk",
  "Schibsted Grotesk",
  "Playfair Display",
  "Lora",
  "Merriweather",
  "Source Serif 4",
  "Libre Baskerville",
  "Cormorant Garamond",
  "EB Garamond",
  "Spectral",
  "Fraunces",
  "Newsreader",
  "Crimson Pro",
  "Bitter",
  "PT Serif",
  "Alice",
  "DM Serif Display",
  "Abril Fatface",
  "Archivo",
  "Archivo Black",
  "Bebas Neue",
  "Anton",
  "Oswald",
  "Syne",
  "Clash Display",
  "Unbounded",
  "JetBrains Mono",
  "Space Mono",
  "IBM Plex Mono",
] as const;

// Sentinel for «ingen font valgt» — Radix Select tillater ikke tom item-verdi.
const NONE = "__none__";

const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

/** Fargerad i editoren — BrandColor med en stabil klient-id for React-keys. */
type ColorRow = BrandColor & { _id: string };

/** Felt med ledetekst + valgfri hjelpetekst (ingen placeholder-som-etikett). */
function Field({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <p className="font-medium text-sm">{label}</p>
      {description && (
        <p className="text-muted-foreground text-xs">{description}</p>
      )}
      {children}
    </div>
  );
}

/** Utleder et lesbart familienavn fra et opplastet font-filnavn. */
function familyFromFilename(name: string): string {
  return (
    name
      .replace(/\.(woff2?|ttf|otf)$/i, "")
      .replace(/[-_]+/g, " ")
      .replace(/\s+/g, " ")
      .trim() || "Egen font"
  );
}

/**
 * Font-velger: vår Select med egne opplastede fonter øverst + Google Fonts.
 */
function FontSelect({
  value,
  onChange,
  customFonts,
  disabled,
  ariaLabel,
}: {
  value: string;
  onChange: (family: string) => void;
  customFonts: BrandCustomFont[];
  disabled?: boolean;
  ariaLabel: string;
}) {
  return (
    <Select
      value={value || NONE}
      onValueChange={(v) => onChange(v === NONE ? "" : v)}
      disabled={disabled}
    >
      <SelectTrigger className="w-full" aria-label={ariaLabel}>
        <SelectValue placeholder="Velg en font" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE}>Standard (ingen)</SelectItem>
        {customFonts.length > 0 && (
          <SelectGroup>
            <SelectLabel>Dine fonter</SelectLabel>
            {customFonts.map((f) => (
              <SelectItem key={f.url} value={f.family}>
                {f.family}
              </SelectItem>
            ))}
          </SelectGroup>
        )}
        <SelectGroup>
          <SelectLabel>Google Fonts</SelectLabel>
          {GOOGLE_FONTS.map((f) => (
            <SelectItem key={f} value={f}>
              {f}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
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
  const [customFonts, setCustomFonts] = useState<BrandCustomFont[]>([]);
  const [uploadingFont, setUploadingFont] = useState(false);
  const fontInputRef = useRef<HTMLInputElement>(null);

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
    setCustomFonts(
      (identity.customFonts ?? []).filter((f): f is BrandCustomFont =>
        Boolean(f?.family && f?.url)
      )
    );
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

  // Slå opp en evt. egen-opplastet font-URL for live @font-face-forhåndsvisning.
  const customUrlByFamily = useMemo(
    () => new Map(customFonts.map((f) => [f.family, f.url])),
    [customFonts]
  );

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
      customFonts: customFonts.length > 0 ? customFonts : null,
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

  async function handleFontFile(file: File) {
    setUploadingFont(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/on-poynt/upload", { method: "POST", body });
      const data = (await res.json().catch(() => ({}))) as {
        url?: string;
        error?: string;
      };
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? "Opplasting feilet");
      }
      const family = familyFromFilename(file.name);
      setCustomFonts((fs) => {
        const without = fs.filter((f) => f.family !== family);
        return [...without, { family, url: data.url as string }];
      });
      toast.success(`«${family}» er lagt til. Velg den i font-listen.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Opplasting feilet");
    } finally {
      setUploadingFont(false);
      if (fontInputRef.current) fontInputRef.current.value = "";
    }
  }

  function removeCustomFont(family: string) {
    setCustomFonts((fs) => fs.filter((f) => f.family !== family));
    // Fjern referansen om fonten var i bruk, så vi ikke peker på noe som er borte.
    if (headingFont === family) setHeadingFont("");
    if (bodyFont === family) setBodyFont("");
  }

  // Ny farge starter UTEN hex, så den ikke dukker opp i forhåndsvisningen (og
  // dytter siden) før brukeren faktisk har valgt en farge.
  function addColor() {
    setColors((cs) => [
      ...cs,
      { hex: "", name: "", role: "primary", _id: crypto.randomUUID() },
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
              {headingFont && (
                <FontSpecimen
                  fontFamily={headingFont}
                  fontUrl={customUrlByFamily.get(headingFont) ?? null}
                  label="Overskrift"
                />
              )}
              {bodyFont && (
                <FontSpecimen
                  fontFamily={bodyFont}
                  fontUrl={customUrlByFamily.get(bodyFont) ?? null}
                  label="Brødtekst"
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* Editorer */}
      <LogoUpload
        value={logoUrl}
        onChange={handleLogo}
        disabled={disabled}
        hint="PNG, JPG, WEBP eller SVG. Maks 5 MB."
      />

      <Field
        label="Tagline"
        description="En kort setning som fanger hva merkevaren handler om."
      >
        <Input
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
          disabled={disabled}
          aria-label="Tagline"
        />
      </Field>

      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <p className="font-medium text-sm">Fargepalett</p>
            <p className="text-muted-foreground text-xs">
              Velg en farge, juster hex-koden, gi den et navn og en rolle.
              Fargene vises i boka og brukes av verktøyene.
            </p>
          </div>
          {!disabled && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addColor}
              className="shrink-0 gap-1.5"
            >
              <Icon name="plus" className="size-4" />
              Legg til farge
            </Button>
          )}
        </div>
        {colors.length > 0 && (
          <div className="space-y-2.5">
            {colors.map((c) => (
              <div
                key={c._id}
                className="flex items-center gap-2.5 rounded-2xl bg-card p-2.5 ring-1 ring-foreground/10"
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
                  className="w-28 shrink-0 font-mono uppercase"
                  aria-label="Hex-kode"
                />
                <Input
                  value={c.name ?? ""}
                  onChange={(e) => updateColor(c._id, { name: e.target.value })}
                  disabled={disabled}
                  className="min-w-0 flex-1"
                  aria-label="Fargenavn"
                />
                <Select
                  value={c.role ?? "primary"}
                  onValueChange={(v) =>
                    updateColor(c._id, { role: v as BrandColorRole })
                  }
                  disabled={disabled}
                >
                  <SelectTrigger
                    size="sm"
                    className="w-32 shrink-0"
                    aria-label="Rolle"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {brandColorRoles.map((r) => (
                      <SelectItem key={r} value={r}>
                        {brandColorRoleLabels[r]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!disabled && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeColor(c._id)}
                    className="shrink-0 text-muted-foreground"
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

      <div className="space-y-3">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Overskriftsfont"
            description="Brukes til titler og overskrifter."
          >
            <FontSelect
              value={headingFont}
              onChange={setHeadingFont}
              customFonts={customFonts}
              disabled={disabled}
              ariaLabel="Overskriftsfont"
            />
          </Field>
          <Field label="Brødtekstfont" description="Brukes til løpende tekst.">
            <FontSelect
              value={bodyFont}
              onChange={setBodyFont}
              customFonts={customFonts}
              disabled={disabled}
              ariaLabel="Brødtekstfont"
            />
          </Field>
        </div>

        {!disabled && (
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fontInputRef}
              type="file"
              accept=".woff,.woff2,.ttf,.otf,font/woff,font/woff2"
              className="hidden"
              disabled={uploadingFont}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFontFile(file);
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploadingFont}
              onClick={() => fontInputRef.current?.click()}
              className="gap-2"
            >
              <Icon
                name={uploadingFont ? "loader" : "upload"}
                className={uploadingFont ? "size-4 animate-spin" : "size-4"}
              />
              Last opp egen font
            </Button>
            <span className="text-muted-foreground text-xs">
              WOFF, WOFF2, TTF eller OTF. Maks 5 MB.
            </span>
          </div>
        )}

        {customFonts.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {customFonts.map((f) => (
              <span
                key={f.url}
                className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-sm ring-1 ring-foreground/10"
              >
                {f.family}
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => removeCustomFont(f.family)}
                    className="text-muted-foreground hover:text-foreground"
                    aria-label={`Fjern ${f.family}`}
                  >
                    <Icon name="x" className="size-3.5" />
                  </button>
                )}
              </span>
            ))}
          </div>
        )}
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
