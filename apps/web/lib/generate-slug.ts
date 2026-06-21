// Flyttet til @poynt/utils. Beholdt som re-export-shim slik at eksisterende
// imports (`@/lib/generate-slug` og Payload-collections sine `../lib/generate-slug`)
// fortsetter å virke uendret.
export * from "@poynt/utils/generate-slug";
