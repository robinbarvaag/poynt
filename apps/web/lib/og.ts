/**
 * Henter Open Graph-metadata (tittel, beskrivelse, bilde) fra en URL via enkel
 * regex på <meta>-taggene – ingen ekstern avhengighet. Returnerer et tomt
 * objekt ved feil/timeout/ikke-HTML, så henting aldri blokkerer lagring.
 */
export interface OgMeta {
  title?: string;
  description?: string;
  image?: string;
}

const USER_AGENT = "Mozilla/5.0 (compatible; PoyntBot/1.0; +https://poynt.no)";
const TIMEOUT_MS = 6000;
const MAX_HTML_BYTES = 500_000; // nok til å dekke <head>

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#x27;/gi, "'")
    .replace(/&#0?39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

/** Leser content fra en <meta>-tag uavhengig av attributt-rekkefølge. */
function attrMeta(
  html: string,
  key: string,
  attr: "property" | "name"
): string | undefined {
  const k = escapeRe(key);
  const attrFirst = new RegExp(
    `<meta[^>]+${attr}=["']${k}["'][^>]*content=["']([^"']*)["']`,
    "i"
  );
  const contentFirst = new RegExp(
    `<meta[^>]+content=["']([^"']*)["'][^>]*${attr}=["']${k}["']`,
    "i"
  );
  const m = html.match(attrFirst) ?? html.match(contentFirst);
  return m?.[1] ? decodeEntities(m[1].trim()) : undefined;
}

/** og:* bruker `property`, twitter:* og description bruker `name`. */
function pickMeta(html: string, key: string): string | undefined {
  return attrMeta(html, key, "property") ?? attrMeta(html, key, "name");
}

function titleTag(html: string): string | undefined {
  const m = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return m?.[1] ? decodeEntities(m[1].trim()) : undefined;
}

function absolutize(src: string, base: string): string {
  try {
    return new URL(src, base).toString();
  } catch {
    return src;
  }
}

/**
 * Bygger en lesbar «hva ble hentet / hva mangler»-status til admin. `present`
 * sier om hvert felt ender opp utfylt (hentet ELLER manuelt), så teksten blir
 * lik enten den lages live i admin eller i lagrings-hooken.
 */
export function ogStatusText(
  og: OgMeta,
  present: { title: boolean; description: boolean; image: boolean }
): string {
  const found: string[] = [];
  if (og.title) found.push("tittel");
  if (og.description) found.push("beskrivelse");
  if (og.image) found.push("bilde");

  if (found.length === 0) {
    return "Fant ingen OG-data på lenken (nettstedet eksponerer ikke meta, eller er en ren JS-app). Fyll inn tittel/beskrivelse manuelt og last opp et forhåndsvisningsbilde.";
  }

  const missing: string[] = [];
  if (!present.title) missing.push("tittel");
  if (!present.description) missing.push("beskrivelse");
  if (!present.image) missing.push("og:image");

  const hentet = `Hentet: ${found.join(", ")}.`;
  if (missing.length === 0) return hentet;
  return `${hentet} Mangler: ${missing.join(", ")} – fyll inn manuelt for et rikere kort.`;
}

/**
 * Enkel SSRF-vakt: kun http(s), og aldri mot localhost/interne nett. Hindrer
 * at en URL i admin (eller /api/og) brukes til å lese interne tjenester.
 * Hostnavn som DNS-peker internt fanges ikke — dette er en rimelig brems,
 * ikke en vanntett garanti.
 */
export function isFetchableUrl(url: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;

  const host = parsed.hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost") || host === "[::1]") {
    return false;
  }
  // Interne IPv4-områder: 127/8, 10/8, 192.168/16, 172.16–31/12, 169.254/16, 0.0.0.0
  if (
    /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|0\.0\.0\.0)/.test(
      host
    )
  ) {
    return false;
  }
  return true;
}

export async function fetchOgMeta(url: string): Promise<OgMeta> {
  if (!isFetchableUrl(url)) return {};
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    let res: Response;
    try {
      res = await fetch(url, {
        signal: controller.signal,
        redirect: "follow",
        headers: { "user-agent": USER_AGENT, accept: "text/html,*/*" },
      });
    } finally {
      clearTimeout(timer);
    }
    if (!res.ok) return {};
    if (!(res.headers.get("content-type") ?? "").includes("text/html")) {
      return {};
    }
    const html = (await res.text()).slice(0, MAX_HTML_BYTES);
    const finalUrl = res.url || url;

    const rawImage =
      pickMeta(html, "og:image") ??
      pickMeta(html, "og:image:url") ??
      pickMeta(html, "twitter:image");

    return {
      title:
        pickMeta(html, "og:title") ??
        pickMeta(html, "twitter:title") ??
        titleTag(html),
      description:
        pickMeta(html, "og:description") ??
        pickMeta(html, "twitter:description") ??
        pickMeta(html, "description"),
      image: rawImage ? absolutize(rawImage, finalUrl) : undefined,
    };
  } catch {
    return {};
  }
}
