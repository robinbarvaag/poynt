import { loadLlmsFullTxt } from "@/lib/markdown/load-markdown";

/** Alt offentlig innhold som én markdown-fil (llms.txt-konvensjonen). */
export async function GET(): Promise<Response> {
  return new Response(await loadLlmsFullTxt(), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control":
        "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
