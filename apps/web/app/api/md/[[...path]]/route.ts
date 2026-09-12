import { renderMarkdownDocument } from "@/lib/markdown/document-to-markdown";
import { loadMarkdownDocument } from "@/lib/markdown/load-markdown";
import { markdownPathFor } from "@/lib/markdown/negotiation";
import { SITE_URL } from "@/lib/seo";

/**
 * Markdown-versjonen av en offentlig side. Nås via `proxy.ts` fra
 * `/<sti>.md`, `/<sti>?format=md` eller `Accept: text/markdown` — adressen i
 * nettleseren/agenten forblir den offentlige.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ path?: string[] }> }
): Promise<Response> {
  const { path } = await context.params;
  const segments = path ?? [];
  // Samme eksklusjoner som proxyen (medlemsområde, kasse, admin …).
  const pathname = markdownPathFor({
    pathname: `/${segments.length ? segments.join("/") : "index"}.md`,
  });

  const doc = pathname ? await loadMarkdownDocument(pathname) : null;
  if (!doc) {
    return new Response("# Ikke funnet\n\nSiden finnes ikke.\n", {
      status: 404,
      headers: { "Content-Type": "text/markdown; charset=utf-8" },
    });
  }

  const headers = new Headers({
    "Content-Type": "text/markdown; charset=utf-8",
    Vary: "Accept",
    Link: `<${doc.url || SITE_URL}>; rel="canonical"`,
    "Cache-Control":
      "public, max-age=0, s-maxage=300, stale-while-revalidate=86400",
  });
  if (doc.noIndex) headers.set("X-Robots-Tag", "noindex");

  return new Response(renderMarkdownDocument(doc, { siteUrl: SITE_URL }), {
    status: 200,
    headers,
  });
}
