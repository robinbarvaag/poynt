/**
 * Eksempeldata for {{flettefelt}} i forhåndsvisningen av skjema-e-poster —
 * samme navn som skjemafeltene våre bruker. Ukjente felt vises som
 * «(feltnavn)». Brukes av /api/email-preview (kind: "form").
 */
const SAMPLE_VALUES: Record<string, string> = {
  navn: "Kari Nordmann",
  name: "Kari Nordmann",
  fornavn: "Kari",
  epost: "kari@eksempel.no",
  email: "kari@eksempel.no",
  "e-post": "kari@eksempel.no",
};

/** Fyll {{flettefelt}} med eksempeldata; ukjente felt vises som «(feltnavn)». */
export function fillFormWildcards(text: string): string {
  return text.replace(/\{\{(.+?)\}\}/g, (_, field: string) => {
    const key = field.trim().toLowerCase();
    return SAMPLE_VALUES[key] ?? `(${field.trim()})`;
  });
}
