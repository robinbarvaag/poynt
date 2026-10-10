import { z } from "zod";

/**
 * Visuell merkevare-identitet — «merkevare-boka». Brukerstyrt (ikke AI-generert):
 * logo, fargepalett, fonter, tagline og evt. moodboard. Lagres på workspace-
 * profilen i en EGEN kolonne (skilt fra `brandBrief`-stemmen), slik at den
 * visuelle identiteten og den AI-genererte stemmen kan lagres uavhengig.
 *
 * Farger/fonter/tagline injiseres også i AI-verktøyene (via getWorkspaceProfileBlock)
 * som tone-signal; logo-URL-en er kun for visning.
 */

/** Rollen en farge spiller i paletten — styrer rekkefølge og bruk. */
export const brandColorRoles = [
  "primary",
  "secondary",
  "accent",
  "neutral",
] as const;
export type BrandColorRole = (typeof brandColorRoles)[number];

export const brandColorRoleLabels: Record<BrandColorRole, string> = {
  primary: "Primær",
  secondary: "Sekundær",
  accent: "Aksent",
  neutral: "Nøytral",
};

/** En enkelt farge i paletten. `hex` er påkrevd; navn/rolle er valgfrie. */
export const brandColorSchema = z.object({
  hex: z
    .string()
    .regex(
      /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/,
      "Bruk et gyldig hex (f.eks. #29664f)"
    ),
  name: z.string().max(60).nullable().optional(),
  role: z.enum(brandColorRoles).nullable().optional(),
});
export type BrandColor = z.infer<typeof brandColorSchema>;

/** Font-rollene merkevaren bruker. Lagres som familienavn (Google Fonts e.l.). */
export const brandFontsSchema = z.object({
  heading: z.string().max(120).nullable().optional(),
  body: z.string().max(120).nullable().optional(),
  accent: z.string().max(120).nullable().optional(),
});
export type BrandFonts = z.infer<typeof brandFontsSchema>;

/**
 * En egen-opplastet font (woff/woff2). `family` er navnet vi bruker i
 * font-stacken og som @font-face-familie; `url` peker på Blob-filen. Egne
 * fonter dukker opp i font-velgeren ved siden av Google Fonts-forslagene.
 */
export const brandCustomFontSchema = z.object({
  family: z.string().min(1).max(120),
  url: z.string().url(),
});
export type BrandCustomFont = z.infer<typeof brandCustomFontSchema>;

/**
 * Lagret variant er lenient (alt valgfritt) så delvis utfylling og autolagring
 * er trygt.
 */
export const brandIdentitySchema = z.object({
  logoUrl: z.string().url().nullable().optional(),
  /** Valgfri logovariant for mørk bakgrunn. */
  logoDarkUrl: z.string().url().nullable().optional(),
  tagline: z.string().max(200).nullable().optional(),
  colors: z.array(brandColorSchema).max(24).nullable().optional(),
  fonts: brandFontsSchema.nullable().optional(),
  /** Egen-opplastede fonter (woff/woff2) brukeren har lagt til. */
  customFonts: z.array(brandCustomFontSchema).max(8).nullable().optional(),
  /** Moodboard / stemnings-bilder (URL-er). */
  imagery: z.array(z.string().url()).max(24).nullable().optional(),
});

export type BrandIdentity = z.infer<typeof brandIdentitySchema>;
