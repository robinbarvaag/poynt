/**
 * Normalizes Payload media URLs for use with Next.js Image component.
 *
 * Handles:
 * - Vercel Blob URLs (returns as-is for CDN delivery)
 * - Local development URLs (converts to /media/ path)
 * - API paths (/api/media/file/...)
 * - Relative paths (/media/...)
 */
export function getMediaUrl(url: string | undefined | null): string {
  if (!url) return "";

  try {
    // Vercel Blob URLs - returner direkte for CDN
    if (url.includes("blob.vercel-storage.com")) {
      return url;
    }

    // Allerede en full ekstern URL (annen CDN, etc.)
    if (url.startsWith("https://") && !url.includes("localhost")) {
      return url;
    }

    // Lokal utvikling: konverter til /media/ path
    let filename = "";
    if (url.startsWith("http://") || url.startsWith("https://")) {
      const urlObj = new URL(url);
      const parts = urlObj.pathname.split("/");
      filename = parts[parts.length - 1];
    } else if (url.startsWith("/api/media/file/")) {
      const parts = url.split("/");
      filename = parts[parts.length - 1];
    } else if (url.startsWith("/media/")) {
      return url; // Allerede korrekt format
    } else if (!url.includes("/")) {
      filename = url;
    } else {
      const parts = url.split("/");
      filename = parts[parts.length - 1];
    }

    return `/media/${decodeURIComponent(filename)}`;
  } catch {
    return url;
  }
}
