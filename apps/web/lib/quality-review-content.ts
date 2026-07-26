import type { BlogPost, CaseStudy, Page, Service } from "@/payload-types";
import { lexicalToMarkdown } from "./serialize-guide-content";

/**
 * Serialisering av Sider (blokk-layout) og Blogginnlegg til lesbar tekst for
 * AI-kvalitetsvurderingen (/api/ai/quality-review). Søsteren til
 * `serialize-guide-content.ts` (guider). Poenget er å gjøre STRUKTUREN synlig
 * for modellen: blokktyper, oppsett-valg (variant/kolonner), overskrifter,
 * bildebruk og CTA-mål — slik at den kan vurdere komposisjon og rytme, ikke
 * bare prosa.
 */

const BLOCK_LABELS: Record<string, string> = {
  hero: "Hero",
  ctaSection: "CTA-seksjon",
  statsBand: "Tall-bånd",
  newsletter: "Nyhetsbrev",
  featureGrid: "Innholdskort",
  pathCards: "Veivalg-kort",
  testimonials: "Kundeomtaler",
  productArchive: "Produktliste",
  podcastArchive: "Podkastliste",
  servicesArchive: "Tjenesteliste",
  logoCloud: "Logo-stripe",
  content: "Innholdsblokk",
  media: "Mediablokk",
  form: "Skjema",
};

// Nøkler med innholdstekst vi vil vise for modellen, i visningsrekkefølge.
const TEXT_KEYS = [
  "eyebrow",
  "title",
  "subtitle",
  "intro",
  "description",
  "text",
  "quote",
  "author",
  "role",
  "company",
  "label",
  "statLabel",
  "linkLabel",
  "ctaLabel",
  "buttonText",
  "tagsLabel",
  "caption",
  "name",
];

// Oppsett-valg som sier noe om komposisjon (sentrert/venstre, panel/rolig …).
const LAYOUT_KEYS = [
  "variant",
  "layout",
  "columns",
  "align",
  "size",
  "surface",
];

function isMediaObject(value: unknown): value is { alt?: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    ("filename" in value || "mimeType" in value)
  );
}

function isLexical(value: unknown): boolean {
  return (
    typeof value === "object" &&
    value !== null &&
    "root" in (value as Record<string, unknown>)
  );
}

/** Flater en blokk (eller et array-element i en blokk) ut til tekstlinjer. */
function serializeObject(obj: Record<string, unknown>, lines: string[]): void {
  const layoutBits = LAYOUT_KEYS.filter(
    (k) => typeof obj[k] === "string" && obj[k]
  ).map((k) => `${k}=${obj[k]}`);
  if (layoutBits.length) lines.push(`[oppsett: ${layoutBits.join(", ")}]`);

  for (const key of TEXT_KEYS) {
    const value = obj[key];
    if (typeof value === "string" && value.trim()) {
      lines.push(`${key}: ${value.trim()}`);
    }
  }

  for (const [key, value] of Object.entries(obj)) {
    if (value == null) continue;
    if (isMediaObject(value)) {
      lines.push(
        `[Bilde/medie (${key})${value.alt ? `: ${value.alt}` : " – mangler alt-tekst"}]`
      );
    } else if (isLexical(value)) {
      const md = lexicalToMarkdown(value);
      if (md.trim()) lines.push(md);
    } else if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === "object" && item !== null) {
          serializeObject(item as Record<string, unknown>, lines);
        }
      }
    } else if (
      typeof value === "object" &&
      key !== "id" &&
      !TEXT_KEYS.includes(key)
    ) {
      // Grupper som primaryCta/secondaryCta/cta — vis tekst + mål samlet.
      const group = value as Record<string, unknown>;
      const text = typeof group.text === "string" ? group.text : undefined;
      const url = typeof group.url === "string" ? group.url : undefined;
      if (text || url) {
        lines.push(`[Knapp (${key}): «${text ?? ""}» → ${url ?? "?"}]`);
      } else {
        serializeObject(group, lines);
      }
    }
  }
}

/** Serialiserer en blokk-bygget side (Sider/Forside) til lesbar tekst. */
export function serializePageContent(page: Page): string {
  const parts: string[] = [`# ${page.title}`];
  if (page.meta?.description)
    parts.push(`_Meta-beskrivelse:_ ${page.meta.description}`);

  (page.layout ?? []).forEach((block, i) => {
    const label = BLOCK_LABELS[block.blockType] ?? block.blockType;
    const lines: string[] = [];
    serializeObject(block as unknown as Record<string, unknown>, lines);
    parts.push(`## [Seksjon ${i + 1}: ${label}]\n${lines.join("\n")}`);
  });

  const faq = page.faq ?? [];
  if (faq.length) {
    parts.push(
      `## [FAQ (strukturert data)]\n${faq
        .map((f) => `Sp: ${f.question}\nSv: ${f.answer}`)
        .join("\n")}`
    );
  }

  return parts.join("\n\n");
}

/** Serialiserer en kundehistorie (case-studies) til lesbar markdown. */
export function serializeCaseStudyContent(story: CaseStudy): string {
  const parts: string[] = [`# ${story.title}`, `Kunde: ${story.customer}`];
  if (story.excerpt) parts.push(`_Oppsummering:_ ${story.excerpt}`);

  const image = story.featuredImage;
  parts.push(
    isMediaObject(image)
      ? `[Hovedbilde${image.alt ? `: ${image.alt}` : " – mangler alt-tekst"}]`
      : "[Mangler hovedbilde]"
  );

  const results = story.results ?? [];
  if (results.length) {
    parts.push(
      `[Resultater i tall]\n${results.map((r) => `- ${r.value} ${r.label}`).join("\n")}`
    );
  } else {
    parts.push("[Ingen resultat-tall oppgitt]");
  }

  parts.push(lexicalToMarkdown(story.content));

  if (story.quote?.text) {
    parts.push(
      `> «${story.quote.text}» — ${[story.quote.author, story.quote.role].filter(Boolean).join(", ")}`
    );
  } else {
    parts.push("[Ingen kundesitat]");
  }

  return parts.filter(Boolean).join("\n\n");
}

const PRICE_TYPE_LABELS: Record<string, string> = {
  fixed: "fast pris",
  from: "fra-pris",
  monthly: "per måned",
  contact: "ta kontakt for pris",
};

/** Serialiserer en tjeneste (services) til lesbar markdown. */
export function serializeServiceContent(service: Service): string {
  const parts: string[] = [`# ${service.name}`];
  if (service.shortDescription)
    parts.push(`_Kort beskrivelse:_ ${service.shortDescription}`);

  const priceLabel = PRICE_TYPE_LABELS[service.priceType] ?? service.priceType;
  parts.push(
    service.priceType === "contact" || service.price == null
      ? `[Pris: ${priceLabel}]`
      : `[Pris: ${service.price} kr (${priceLabel})${service.includesVat ? " + mva" : ""}]`
  );

  const image = service.image;
  parts.push(
    isMediaObject(image)
      ? `[Bilde${image.alt ? `: ${image.alt}` : " – mangler alt-tekst"}]`
      : "[Mangler bilde]"
  );

  if (service.content) {
    parts.push(lexicalToMarkdown(service.content));
  } else {
    parts.push("[Ingen detaljert beskrivelse]");
  }

  const faq = service.faq ?? [];
  if (faq.length) {
    parts.push(
      `## [FAQ (strukturert data)]\n${faq
        .map((f) => `Sp: ${f.question}\nSv: ${f.answer}`)
        .join("\n")}`
    );
  }

  return parts.filter(Boolean).join("\n\n");
}

/** Serialiserer et blogginnlegg til lesbar markdown. */
export function serializeBlogPostContent(post: BlogPost): string {
  const parts: string[] = [`# ${post.title}`];
  if (post.excerpt) parts.push(`_Ingress/utdrag:_ ${post.excerpt}`);

  const image = post.featuredImage;
  parts.push(
    isMediaObject(image)
      ? `[Hovedbilde${image.alt ? `: ${image.alt}` : " – mangler alt-tekst"}]`
      : "[Mangler hovedbilde]"
  );

  parts.push(lexicalToMarkdown(post.content));
  return parts.filter(Boolean).join("\n\n");
}
