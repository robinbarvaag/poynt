/**
 * Converts Payload media URLs to relative paths for Next.js Image optimization.
 * Handles both absolute URLs (http://localhost:3000/api/media/...) and relative paths.
 * Also decodes any pre-encoded characters to avoid double-encoding.
 */
export function getMediaUrl(url: string | undefined | null): string {
  if (!url) return "";

  // If it's an absolute URL, extract just the pathname
  if (url.startsWith("http://") || url.startsWith("https://")) {
    try {
      const urlObj = new URL(url);
      // Decode the pathname to avoid double-encoding in Next.js Image
      return decodeURIComponent(urlObj.pathname);
    } catch {
      return url;
    }
  }

  // If it's already relative, just decode it
  try {
    return decodeURIComponent(url);
  } catch {
    return url;
  }
}
