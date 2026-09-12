import { loadLlmsTxt } from "@/lib/markdown/load-markdown";

/** https://llmstxt.org — oversikt over nettstedet for språkmodeller. */
export async function GET(): Promise<Response> {
  return new Response(await loadLlmsTxt(), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control":
        "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
