/**
 * Innholdsforhandling for markdown-versjonen av nettsidene (for AI-agenter og
 * LLM-verktøy). Rene funksjoner uten avhengigheter, så de kan kjøres i
 * `proxy.ts` og testes isolert.
 *
 * En side kan hentes som markdown på tre måter:
 * - `.md` på slutten av adressen (`/tjenester/radgivning.md`, forsiden: `/index.md`)
 * - `?format=md`
 * - `Accept: text/markdown` med høyere (eller lik) prioritet enn HTML
 */

/** Stier som ikke har en offentlig markdown-versjon. */
const EXCLUDED_PREFIXES = [
  "/api",
  "/admin",
  "/_next",
  "/on-poynt/",
  "/forhandsvisning",
  "/handlekurv",
  "/kvittering",
];

/** Q-verdien (0–1) for én medietype i en Accept-header, eller 0 om den mangler. */
function qualityFor(accept: string, types: string[]): number {
  let best = 0;
  for (const part of accept.split(",")) {
    const [rawType, ...params] = part.trim().split(";");
    const type = rawType.trim().toLowerCase();
    if (!types.includes(type)) continue;
    let q = 1;
    for (const param of params) {
      const [key, value] = param.trim().split("=");
      if (key === "q") {
        const parsed = Number.parseFloat(value);
        q = Number.isNaN(parsed) ? 0 : parsed;
      }
    }
    best = Math.max(best, q);
  }
  return best;
}

/**
 * Ber klienten om markdown framfor HTML? Nettlesere sender aldri
 * `text/markdown`, så det må stå eksplisitt. Ved lik prioritet vinner
 * markdown — da har klienten bevisst listet det.
 */
export function prefersMarkdown(accept: string | null | undefined): boolean {
  if (!accept) return false;
  const markdown = qualityFor(accept, ["text/markdown", "text/x-markdown"]);
  if (markdown <= 0) return false;
  const html = qualityFor(accept, ["text/html", "application/xhtml+xml"]);
  return markdown >= html;
}

/**
 * Prefiks med avsluttende `/` gjelder bare undersidene (`/on-poynt/` er
 * medlemsområdet, mens `/on-poynt` er den offentlige salgssiden).
 */
function isExcluded(pathname: string): boolean {
  return EXCLUDED_PREFIXES.some((prefix) =>
    prefix.endsWith("/")
      ? pathname.startsWith(prefix)
      : pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

/**
 * Sidestien (uten `.md`) når forespørselen gjelder markdown, ellers `null`.
 * `/index.md` er forsiden.
 */
export function markdownPathFor(request: {
  pathname: string;
  format?: string | null;
  accept?: string | null;
}): string | null {
  let { pathname } = request;
  let wanted = false;

  if (pathname.endsWith(".md")) {
    pathname = pathname.slice(0, -".md".length);
    if (pathname === "/index" || pathname === "") pathname = "/";
    wanted = true;
  } else if (request.format === "md" || prefersMarkdown(request.accept)) {
    wanted = true;
  }

  if (!wanted) return null;
  if (pathname.length > 1) pathname = pathname.replace(/\/+$/, "");
  if (isExcluded(pathname)) return null;
  return pathname;
}

/** Intern rute som rendrer markdown for en sidesti. */
export function markdownRewritePath(pathname: string): string {
  return pathname === "/" ? "/api/md" : `/api/md${pathname}`;
}

/** Offentlig `.md`-adresse for en sidesti (forsiden → `/index.md`). */
export function markdownUrlFor(siteUrl: string, pathname: string): string {
  const clean = pathname === "/" || pathname === "" ? "/index" : pathname;
  return `${siteUrl}${clean}.md`;
}
