/**
 * Lager en URL-vennlig slug fra fritekst. Håndterer norske tegn (æ/ø/å).
 *
 * Brukes både av Payload-collections (artikler, sider, produkter osv.) og av
 * planner-api (workspace/bedrift-slugs). Workspace-slugs vil ha en lengdegrense
 * — send `{ maxLength: 50 }` for det.
 */
export function generateSlug(
  text: string,
  options?: { maxLength?: number }
): string {
  const slug = text
    .toLowerCase()
    .trim()
    .replace(/[æ]/g, "ae")
    .replace(/[ø]/g, "o")
    .replace(/[å]/g, "a")
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (options?.maxLength) {
    return slug.slice(0, options.maxLength).replace(/-+$/, "");
  }
  return slug;
}
