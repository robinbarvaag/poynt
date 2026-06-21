import type { Media } from "@/payload-types";

export { resolveMediaUrl } from "@/components/payload-image";

/**
 * Payload typer relasjons- og opplastingsfelt som unioner (`number | T`): du får
 * ID-en ved `depth: 0` og hele objektet ved høyere `depth`. Disse helperne
 * sentraliserer narrowingen så kallstedene slipper å gjenta `typeof x === "object"`.
 */

/** Trekker ut et populert relasjonsobjekt; returnerer `null` for rene id-er. */
export function resolveRelation<T>(
  value: number | T | null | undefined
): T | null {
  return value && typeof value === "object" ? (value as T) : null;
}

/** Trekker ut alle populerte relasjonsobjekter fra en liste (dropper rene id-er). */
export function resolveRelations<T>(
  value: (number | T)[] | null | undefined
): T[] {
  return (value ?? []).filter(
    (item): item is T => typeof item === "object" && item !== null
  );
}

/** Trekker ut et populert Payload-media; returnerer `null` for rene id-er. */
export function resolveMedia(
  value: number | Media | null | undefined
): Media | null {
  return value && typeof value === "object" ? value : null;
}
