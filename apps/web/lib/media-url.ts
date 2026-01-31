/**
 * Converts Payload media URLs to relative paths for Next.js Image optimization.
 * Handles both absolute URLs (http://localhost:3000/api/media/...) and relative paths.
 * Also decodes any pre-encoded characters to avoid double-encoding.
 */
export function getMediaUrl(url: string | undefined | null): string {
  if (!url) return "";

  // Trekk alltid ut filnavnet og returner public /media/ path
  let filename = "";
  try {
    if (url.startsWith("http://") || url.startsWith("https://")) {
      const urlObj = new URL(url);
      const parts = urlObj.pathname.split("/");
      filename = parts[parts.length - 1];
    } else if (url.startsWith("/api/media/file/")) {
      const parts = url.split("/");
      filename = parts[parts.length - 1];
    } else if (url.startsWith("/media/")) {
      const parts = url.split("/");
      filename = parts[parts.length - 1];
    } else if (!url.includes("/")) {
      filename = url;
    } else {
      // fallback: trekk ut siste del
      const parts = url.split("/");
      filename = parts[parts.length - 1];
    }
    return `/media/${decodeURIComponent(filename)}`;
  } catch {
    return url;
  }
}
