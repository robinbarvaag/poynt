/**
 * SEO-analyse for MCP-serveren. Rene funksjoner (ingen Payload/fetch) så
 * reglene kan testes isolert. Speiler frontend-logikken: tittel/beskrivelse-
 * fallback i `generateMetadata`-rutene, delingsbilde-valget i `lib/seo.ts`
 * (`resolveOgImage`) og lengde-grensene i admin-panelet SeoPreview.
 */

export const SITE_NAME = "Poynt";

/** Samme grenser som SeoPreview i admin (tittel teller med «| Poynt»). */
export const SEO_LIMITS = {
  title: { min: 40, max: 60 },
  description: { min: 120, max: 160 },
  ogWidth: 1200,
  ogHeight: 630,
} as const;

const OG_RATIO = SEO_LIMITS.ogWidth / SEO_LIMITS.ogHeight;

/** Innholdstyper med SEO-felt. `writable` = har utkast, kan endres via MCP. */
export const SEO_COLLECTIONS = {
  pages: { label: "Side", writable: true },
  "blog-posts": { label: "Blogginnlegg", writable: true },
  "case-studies": { label: "Kundehistorie", writable: true },
  services: { label: "Tjeneste", writable: true },
  products: { label: "Produkt", writable: false },
} as const;

export type SeoCollection = keyof typeof SEO_COLLECTIONS;
export type WritableSeoCollection = {
  [K in SeoCollection]: (typeof SEO_COLLECTIONS)[K]["writable"] extends true
    ? K
    : never;
}[SeoCollection];

export type SeoMedia = {
  id: number;
  url?: string | null;
  alt?: string | null;
  width?: number | null;
  height?: number | null;
  mimeType?: string | null;
  filename?: string | null;
  sizes?: { og?: { url?: string | null } | null } | null;
};

export type SeoFinding = {
  level: "feil" | "advarsel" | "tips";
  field: string;
  message: string;
};

export function pathFor(collection: SeoCollection | "homepage", slug = "") {
  switch (collection) {
    case "homepage":
      return "/";
    case "pages":
      return slug === "forside" ? "/" : `/${slug}`;
    case "blog-posts":
      return `/blogg/${slug}`;
    case "case-studies":
      return `/kundehistorier/${slug}`;
    case "services":
      return `/tjenester/${slug}`;
    case "products":
      return `/produkter/${slug}`;
  }
}

export function stripSiteSuffix(title: string): string {
  return title
    .replace(new RegExp(`\\s*[|–-]\\s*${SITE_NAME}\\s*$`, "i"), "")
    .trim();
}

/** Felt-uavhengig utdrag av et dokument, fylt ut av kallstedet. */
export type SeoInput = {
  collection: SeoCollection | "homepage";
  /** Innholdets egen tittel (title/name). */
  title: string;
  slug?: string;
  metaTitle?: string | null;
  metaDescription?: string | null;
  /** Utdrag/kort beskrivelse — frontend-fallback for beskrivelsen. */
  excerpt?: string | null;
  noIndex?: boolean | null;
  canonicalUrl?: string | null;
  /** Skjult side (QR-kode) — alltid noindex i frontend. */
  unlisted?: boolean | null;
  /** SEO-fanens delingsbilde. */
  metaImage?: SeoMedia | null;
  /** Hovedbilde / hero-bilde — fallback når metaImage mangler. */
  fallbackImage?: SeoMedia | null;
  /** Innholdet som markdown (blogg/kundehistorie) for struktur-sjekker. */
  contentMarkdown?: string;
};

export type OgImageChoice =
  | { kind: "bilde"; media: SeoMedia; source: "delingsbilde" | "hovedbilde" }
  | {
      kind: "merkevarekort-med-bilde";
      media: SeoMedia;
      source: "delingsbilde" | "hovedbilde";
    }
  | { kind: "merkevarekort" };

/** Hvilket delingsbilde frontend faktisk bruker (speiler resolveOgImage). */
export function resolveOgImageChoice(input: SeoInput): OgImageChoice {
  const media = input.metaImage?.url
    ? input.metaImage
    : input.fallbackImage?.url
      ? input.fallbackImage
      : null;
  if (!media) return { kind: "merkevarekort" };
  const source = media === input.metaImage ? "delingsbilde" : "hovedbilde";
  const ratio = media.width && media.height ? media.width / media.height : null;
  const nearOg = ratio !== null && Math.abs(ratio - OG_RATIO) / OG_RATIO <= 0.1;
  return nearOg
    ? { kind: "bilde", media, source }
    : { kind: "merkevarekort-med-bilde", media, source };
}

/** Tittel/beskrivelse slik frontend rendrer dem (med fallback). */
export function effectiveSeo(input: SeoInput) {
  const fallbackTitle =
    input.collection === "services"
      ? `${input.title} | Tjenester`
      : input.collection === "products"
        ? `${input.title} | Produkter`
        : input.title;
  const title = stripSiteSuffix(input.metaTitle?.trim() || fallbackTitle);
  const absolute = input.collection === "homepage";
  const fullTitle = absolute ? title : `${title} | ${SITE_NAME}`;
  // Sider har ingen utdrag-fallback: tom meta-beskrivelse = ingen beskrivelse.
  const description =
    input.metaDescription?.trim() ||
    (input.collection === "pages" || input.collection === "homepage"
      ? ""
      : input.excerpt?.trim() || "");
  return {
    title,
    fullTitle,
    titleSource: input.metaTitle?.trim() ? "meta-tittel" : "innholdets tittel",
    description,
    descriptionSource: input.metaDescription?.trim()
      ? "meta-beskrivelse"
      : description
        ? "utdrag"
        : "mangler",
    noIndex: Boolean(input.noIndex || input.unlisted),
    path: pathFor(input.collection, input.slug),
  };
}

function wordCount(markdown: string) {
  return markdown.split(/\s+/).filter((w) => /\p{L}/u.test(w)).length;
}

export function analyseSeo(input: SeoInput): SeoFinding[] {
  const findings: SeoFinding[] = [];
  const add = (level: SeoFinding["level"], field: string, message: string) =>
    findings.push({ level, field, message });
  const seo = effectiveSeo(input);
  const { title, description } = SEO_LIMITS;

  // Tittel
  if (input.metaTitle && /[|–-]\s*poynt\s*$/i.test(input.metaTitle.trim())) {
    add(
      "advarsel",
      "metaTitle",
      "Meta-tittelen slutter på «| Poynt». Suffikset legges på automatisk — fjern det."
    );
  }
  if (seo.fullTitle.length > title.max) {
    add(
      "advarsel",
      "metaTitle",
      `Tittelen i søketreffet er ${seo.fullTitle.length} tegn med «| Poynt» (maks ${title.max}). Google kutter den — skriv en kortere meta-tittel.`
    );
  } else if (seo.fullTitle.length < title.min) {
    add(
      "tips",
      "metaTitle",
      `Tittelen i søketreffet er bare ${seo.fullTitle.length} tegn. ${title.min}–${title.max} gir plass til søkeordet og en grunn til å klikke.`
    );
  }

  // Beskrivelse
  if (!seo.description) {
    add(
      input.collection === "pages" || input.collection === "homepage"
        ? "feil"
        : "advarsel",
      "metaDescription",
      input.collection === "pages" || input.collection === "homepage"
        ? "Ingen meta-beskrivelse. Sider har ikke utdrag å falle tilbake på, så Google finner på en tekst selv."
        : "Verken meta-beskrivelse eller utdrag. Google finner på en tekst selv."
    );
  } else if (seo.description.length > description.max) {
    add(
      "advarsel",
      "metaDescription",
      `Beskrivelsen er ${seo.description.length} tegn (${seo.descriptionSource}); Google kutter etter ca. ${description.max}.`
    );
  } else if (seo.description.length < description.min) {
    add(
      "tips",
      "metaDescription",
      `Beskrivelsen er bare ${seo.description.length} tegn (${seo.descriptionSource}). ${description.min}–${description.max} tegn gir et fyldigere søketreff.`
    );
  }
  if (
    seo.description &&
    stripSiteSuffix(seo.title).toLowerCase() === seo.description.toLowerCase()
  ) {
    add(
      "advarsel",
      "metaDescription",
      "Beskrivelsen er lik tittelen — den bør utdype, ikke gjenta."
    );
  }

  // Indeksering
  if (input.unlisted) {
    add(
      "tips",
      "noIndex",
      "Skjult side: alltid skjult for søkemotorer. Riktig for QR-kode-sider — ikke optimaliser for søk."
    );
  } else if (input.noIndex) {
    add(
      "advarsel",
      "noIndex",
      "«Skjul fra søkemotorer» er på — siden vil ikke dukke opp på Google. Stemmer det?"
    );
  }
  if (input.canonicalUrl?.trim()) {
    add(
      "advarsel",
      "canonicalUrl",
      `Canonical peker til ${input.canonicalUrl.trim()}. Da ber vi Google indeksere den adressen i stedet — bare riktig hvis innholdet er en kopi.`
    );
  }

  // Delingsbilde
  const og = resolveOgImageChoice(input);
  if (og.kind === "merkevarekort") {
    add(
      "tips",
      "metaImage",
      "Ingen bilde — delingskortet blir et automatisk Poynt-kort med tittelen. Et ekte bilde (1200×630) gir flere klikk i sosiale medier."
    );
  } else {
    const { media } = og;
    const mime = media.mimeType ?? "";
    if (mime && !mime.startsWith("image/")) {
      add(
        "feil",
        "metaImage",
        `Delingsbildet er ${mime}, ikke et bilde. Sosiale medier kan ikke vise det.`
      );
    } else if (mime === "image/svg+xml") {
      add(
        "advarsel",
        "metaImage",
        "Delingsbildet er SVG. Facebook/LinkedIn støtter ikke SVG — bruk JPG/PNG."
      );
    }
    if (og.kind === "merkevarekort-med-bilde") {
      add(
        "tips",
        "metaImage",
        `${og.source === "delingsbilde" ? "Delingsbildet" : "Hovedbildet"} er ${media.width ?? "?"}×${media.height ?? "?"}, ikke 1,91:1 — det vises inni et Poynt-kort i stedet for å fylle hele kortet. Last opp et 1200×630-bilde som delingsbilde for full bredde.`
      );
    } else if (media.width && media.width < SEO_LIMITS.ogWidth) {
      add(
        "advarsel",
        "metaImage",
        `Delingsbildet er bare ${media.width} px bredt (anbefalt ${SEO_LIMITS.ogWidth}) og kan bli uskarpt.`
      );
    }
    if (!media.alt?.trim()) {
      add(
        "advarsel",
        "alt",
        `Bildet (media #${media.id}) mangler alt-tekst. Bra for tilgjengelighet og bildesøk — bruk update_media_alt.`
      );
    }
  }

  // Struktur i løpende tekst (blogg/kundehistorie)
  if (input.contentMarkdown !== undefined) {
    const words = wordCount(input.contentMarkdown);
    const h2 = input.contentMarkdown.match(/^##\s/gm)?.length ?? 0;
    const h1 = input.contentMarkdown.match(/^#\s/gm)?.length ?? 0;
    if (h1 > 0) {
      add(
        "advarsel",
        "content",
        "Innholdet har #-overskrift (H1). Tittelen er allerede H1 — bruk ## for mellomtitler."
      );
    }
    if (words > 300 && h2 === 0) {
      add(
        "advarsel",
        "content",
        `${words} ord uten mellomtitler (##). Mellomtitler hjelper både skumlesere og Google å forstå temaene.`
      );
    }
    if (words > 0 && words < 300 && input.collection === "blog-posts") {
      add(
        "tips",
        "content",
        `Innlegget er ${words} ord. Tynne tekster rangerer sjelden — 600+ ord med konkrete eksempler står seg bedre.`
      );
    }
    const links = input.contentMarkdown.match(/\]\((?!mailto:|tel:)[^)]+\)/g);
    if (words > 200 && !links?.length) {
      add(
        "tips",
        "content",
        "Ingen lenker i teksten. Lenk til en relevant tjeneste, guide eller kundehistorie — internlenker hjelper SEO og gir leseren et neste steg."
      );
    }
  }
  if (
    (input.collection === "blog-posts" ||
      input.collection === "case-studies") &&
    !input.excerpt?.trim()
  ) {
    add(
      "tips",
      "excerpt",
      "Mangler utdrag. Det vises i lister og er fallback for meta-beskrivelsen."
    );
  }

  return findings;
}

/** Finner dokumenter som deler tittel eller beskrivelse i søketreffet. */
export function findDuplicates(
  items: { key: string; fullTitle: string; description: string }[]
) {
  const group = (pick: (i: (typeof items)[number]) => string) => {
    const map = new Map<string, string[]>();
    for (const item of items) {
      const value = pick(item).trim().toLowerCase();
      if (!value) continue;
      map.set(value, [...(map.get(value) ?? []), item.key]);
    }
    return [...map.entries()]
      .filter(([, keys]) => keys.length > 1)
      .map(([value, keys]) => ({ value, documents: keys }));
  };
  return {
    titles: group((i) => i.fullTitle),
    descriptions: group((i) => i.description),
  };
}

export type RenderedSeo = {
  title?: string;
  description?: string;
  canonical?: string;
  robots?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogImageWidth?: string;
  ogImageHeight?: string;
  ogUrl?: string;
  ogType?: string;
  twitterCard?: string;
  h1Count: number;
  jsonLdTypes: string[];
};

/** Analyserer det som faktisk står i <head> på en publisert side. */
export function analyseRendered(
  rendered: RenderedSeo,
  expectedUrl: string
): SeoFinding[] {
  const findings: SeoFinding[] = [];
  const add = (level: SeoFinding["level"], field: string, message: string) =>
    findings.push({ level, field, message });

  if (!rendered.title) add("feil", "title", "Mangler <title>.");
  if (!rendered.description)
    add("feil", "description", "Mangler meta description.");
  if (!rendered.ogImage) add("feil", "og:image", "Mangler og:image.");
  if (!rendered.ogTitle) add("advarsel", "og:title", "Mangler og:title.");
  if (!rendered.twitterCard)
    add("tips", "twitter:card", "Mangler twitter:card.");
  if (!rendered.canonical) {
    add("advarsel", "canonical", "Mangler canonical-lenke.");
  } else if (
    rendered.canonical.replace(/\/$/, "") !== expectedUrl.replace(/\/$/, "")
  ) {
    add(
      "advarsel",
      "canonical",
      `Canonical (${rendered.canonical}) er ikke sidens egen adresse (${expectedUrl}).`
    );
  }
  if (rendered.robots && /noindex/i.test(rendered.robots)) {
    add(
      "advarsel",
      "robots",
      `robots = «${rendered.robots}» — siden er skjult for søkemotorer.`
    );
  }
  if (rendered.h1Count === 0) {
    add("advarsel", "h1", "Ingen <h1> på siden.");
  } else if (rendered.h1Count > 1) {
    add(
      "tips",
      "h1",
      `${rendered.h1Count} <h1>-overskrifter. Én tydelig H1 er ryddigst.`
    );
  }
  if (!rendered.jsonLdTypes.length) {
    add(
      "tips",
      "json-ld",
      "Ingen strukturert data (JSON-LD). FAQ-feltet på sider/tjenester gir FAQPage-data."
    );
  }
  return findings;
}

/** Leser <link rel="canonical">, <h1>-antall og JSON-LD-typer fra HTML. */
export function parseHeadExtras(html: string) {
  const canonical =
    /<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']+)["']/i.exec(
      html
    )?.[1] ??
    /<link[^>]+href=["']([^"']+)["'][^>]*rel=["']canonical["']/i.exec(
      html
    )?.[1];
  const h1Count = html.match(/<h1[\s>]/gi)?.length ?? 0;
  const jsonLdTypes: string[] = [];
  for (const m of html.matchAll(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  )) {
    try {
      const parsed = JSON.parse(m[1]);
      const collect = (node: unknown) => {
        if (Array.isArray(node)) {
          for (const n of node) collect(n);
        } else if (node && typeof node === "object") {
          const obj = node as { "@type"?: unknown; "@graph"?: unknown };
          if (typeof obj["@type"] === "string") jsonLdTypes.push(obj["@type"]);
          if (obj["@graph"]) collect(obj["@graph"]);
        }
      };
      collect(parsed);
    } catch {
      jsonLdTypes.push("(ugyldig JSON-LD)");
    }
  }
  return { canonical, h1Count, jsonLdTypes };
}
