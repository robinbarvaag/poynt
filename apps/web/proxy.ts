import {
  markdownPathFor,
  markdownRewritePath,
} from "@/lib/markdown/negotiation";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Serverer markdown-versjonen av sidene til AI-agenter (se
 * lib/markdown/negotiation.ts). Matcheren under gjør at proxyen bare kjører
 * for forespørsler som faktisk kan gjelde markdown — vanlige sidevisninger
 * går rett forbi.
 */
export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const path = markdownPathFor({
    pathname,
    format: searchParams.get("format"),
    accept: request.headers.get("accept"),
  });
  if (!path) return NextResponse.next();

  const target = request.nextUrl.clone();
  target.pathname = markdownRewritePath(path);
  target.search = "";
  return NextResponse.rewrite(target);
}

export const config = {
  matcher: [
    // `/tjenester/radgivning.md`, `/index.md`
    "/((?!_next/|api/|admin).*\\.md)",
    // `?format=md` og Accept-headeren gjelder bare sider: stier der siste
    // ledd har filendelse (`/llms.txt`, `/sitemap.xml`, `/favicon.ico`)
    // slipper forbi proxyen. Metadata-ruter uten filendelse stoppes i
    // `markdownPathFor`. Punktum skrives `[.]` fordi path-to-regexp spiser
    // omvendt skråstrek inne i grupper.
    {
      source: "/((?!_next/|api/|admin|.*[.][^/]*$).*)",
      has: [{ type: "query", key: "format", value: "md" }],
    },
    {
      source: "/((?!_next/|api/|admin|.*[.][^/]*$).*)",
      has: [{ type: "header", key: "accept", value: ".*markdown.*" }],
    },
  ],
};
