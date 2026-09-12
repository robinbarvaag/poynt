import { productStoryBlocks } from "@/blocks/product-story";
import { schemasForBlocks } from "@/lib/mcp/block-schema";
import { lexicalToMarkdown } from "@/lib/serialize-guide-content";
import {
  type MarkdownContext,
  absolutizeMarkdownLinks,
  layoutToMarkdown,
} from "./layout-to-markdown";

/**
 * Payload-dokumenter → markdown med YAML-frontmatter. Rene funksjoner: all
 * datahenting skjer i `load-markdown.ts`, så byggerne kan testes med
 * håndskrevne dokumenter.
 */

type Rec = Record<string, unknown>;
type Faq = { question?: string | null; answer?: string | null }[] | null;

export interface MarkdownDocument {
  title: string;
  description?: string | null;
  /** Absolutt URL til HTML-siden (canonical). */
  url: string;
  /** Innholdstype, f.eks. `page`, `blog-post`, `service`. */
  type: string;
  published?: string | null;
  updated?: string | null;
  /** Ekstra frontmatter-felt (pris, kunde …). Tomme verdier utelates. */
  extra?: Record<string, string | number | null | undefined>;
  /** Markdown-seksjoner under H1-tittelen. */
  sections: string[];
  /** Skal ikke indekseres (skjulte sider, noindex i SEO-fanen). */
  noIndex?: boolean;
}

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function yamlValue(value: string | number): string {
  return typeof value === "number" ? String(value) : JSON.stringify(value);
}

function oneLine(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function formatKroner(amount: number): string {
  return `${amount.toLocaleString("nb-NO").replace(/ /g, " ")} kr`;
}

export function renderMarkdownDocument(
  doc: MarkdownDocument,
  opts: { frontmatter?: boolean; siteUrl?: string } = {}
): string {
  const out: string[] = [];

  if (opts.frontmatter !== false) {
    const fm: [string, string | number | null | undefined][] = [
      ["title", doc.title],
      ["description", doc.description ? oneLine(doc.description) : null],
      ["url", doc.url],
      ["type", doc.type],
      ["language", "nb-NO"],
      ["published", doc.published],
      ["updated", doc.updated],
      ...Object.entries(doc.extra ?? {}),
    ];
    out.push(
      [
        "---",
        ...fm
          .filter((entry): entry is [string, string | number] => {
            const v = entry[1];
            return v !== null && v !== undefined && v !== "";
          })
          .map(([key, value]) => `${key}: ${yamlValue(value)}`),
        "---",
      ].join("\n")
    );
  } else {
    out.push(`<!-- Kilde: ${doc.url} -->`);
  }

  out.push(`# ${doc.title}`);
  for (const section of doc.sections) {
    if (section.trim()) out.push(section.trim());
  }

  const body = `${out.join("\n\n")}\n`;
  return opts.siteUrl ? absolutizeMarkdownLinks(body, opts.siteUrl) : body;
}

/** FAQ-feltet («Ofte stilte spørsmål») som egen seksjon. */
export function faqSection(items: Faq | undefined): string {
  const entries = (items ?? []).filter((i) => str(i.question) && str(i.answer));
  if (!entries.length) return "";
  return [
    "## Ofte stilte spørsmål",
    ...entries.map((i) => `### ${str(i.question)}\n\n${str(i.answer)}`),
  ].join("\n\n");
}

/** Lenkeliste til dokumenter (oversiktssider og llms.txt). */
export interface LinkItem {
  title: string;
  url: string;
  description?: string | null;
  meta?: string | null;
}

export function linkList(items: LinkItem[]): string {
  return items
    .map((item) => {
      const extra = [
        item.meta,
        item.description ? oneLine(item.description) : "",
      ]
        .filter(Boolean)
        .join(" — ");
      return `- [${oneLine(item.title)}](${item.url})${extra ? `: ${extra}` : ""}`;
    })
    .join("\n");
}

export function pageDocument(
  page: {
    title: string;
    slug?: string | null;
    layout?: unknown;
    faq?: Faq;
    unlisted?: boolean | null;
    updatedAt?: string | null;
    meta?: {
      title?: string | null;
      description?: string | null;
      noIndex?: boolean | null;
    } | null;
  },
  ctx: MarkdownContext & { path: string }
): MarkdownDocument {
  return {
    title: page.title,
    description: page.meta?.description,
    url: `${ctx.siteUrl}${ctx.path === "/" ? "" : ctx.path}`,
    type: "page",
    updated: page.updatedAt,
    noIndex: Boolean(page.unlisted || page.meta?.noIndex),
    sections: [layoutToMarkdown(page.layout, ctx), faqSection(page.faq)],
  };
}

export function blogPostDocument(
  post: {
    title: string;
    slug?: string | null;
    excerpt?: string | null;
    content?: unknown;
    publishedAt?: string | null;
    updatedAt?: string | null;
    categories?: unknown;
    meta?: { description?: string | null; noIndex?: boolean | null } | null;
  },
  ctx: MarkdownContext
): MarkdownDocument {
  const categories = (Array.isArray(post.categories) ? post.categories : [])
    .map((c) => (c && typeof c === "object" ? str((c as Rec).title) : ""))
    .filter(Boolean);
  return {
    title: post.title,
    description: post.meta?.description || post.excerpt,
    url: `${ctx.siteUrl}/blogg/${post.slug}`,
    type: "blog-post",
    published: post.publishedAt,
    updated: post.updatedAt,
    extra: { categories: categories.join(", ") },
    noIndex: Boolean(post.meta?.noIndex),
    sections: [
      post.excerpt ? `_${oneLine(post.excerpt)}_` : "",
      lexicalToMarkdown(post.content),
    ],
  };
}

export function caseStudyDocument(
  story: {
    title: string;
    slug?: string | null;
    customer?: string | null;
    excerpt?: string | null;
    content?: unknown;
    results?: { value?: string | null; label?: string | null }[] | null;
    quote?: {
      text?: string | null;
      author?: string | null;
      role?: string | null;
    } | null;
    publishedAt?: string | null;
    updatedAt?: string | null;
    meta?: { description?: string | null; noIndex?: boolean | null } | null;
  },
  ctx: MarkdownContext
): MarkdownDocument {
  const results = (story.results ?? []).filter(
    (r) => str(r.value) && str(r.label)
  );
  const quoteText = str(story.quote?.text);
  const who = [str(story.quote?.author), str(story.quote?.role)].filter(
    Boolean
  );
  return {
    title: story.title,
    description: story.meta?.description || story.excerpt,
    url: `${ctx.siteUrl}/kundehistorier/${story.slug}`,
    type: "case-study",
    published: story.publishedAt,
    updated: story.updatedAt,
    extra: { customer: story.customer },
    noIndex: Boolean(story.meta?.noIndex),
    sections: [
      story.customer ? `**Kunde:** ${story.customer}` : "",
      story.excerpt ? `_${oneLine(story.excerpt)}_` : "",
      results.length
        ? [
            "## Resultater",
            results
              .map((r) => `- **${str(r.value)}** ${str(r.label)}`)
              .join("\n"),
          ].join("\n\n")
        : "",
      lexicalToMarkdown(story.content),
      quoteText
        ? `> ${quoteText.split("\n").join("\n> ")}${who.length ? `\n>\n> — ${who.join(", ")}` : ""}`
        : "",
    ],
  };
}

export function serviceDocument(
  service: {
    name: string;
    slug?: string | null;
    shortDescription?: string | null;
    content?: unknown;
    faq?: Faq;
    ctaText?: string | null;
    ctaLink?: string | null;
    updatedAt?: string | null;
    meta?: { description?: string | null; noIndex?: boolean | null } | null;
  },
  ctx: MarkdownContext & { priceText?: string }
): MarkdownDocument {
  const cta = str(service.ctaLink)
    ? `[${str(service.ctaText) || "Ta kontakt"}](${str(service.ctaLink)})`
    : `[Ta kontakt](${ctx.siteUrl}/kontakt)`;
  return {
    title: service.name,
    description: service.meta?.description || service.shortDescription,
    url: `${ctx.siteUrl}/tjenester/${service.slug}`,
    type: "service",
    updated: service.updatedAt,
    extra: { price: ctx.priceText },
    noIndex: Boolean(service.meta?.noIndex),
    sections: [
      service.shortDescription ?? "",
      ctx.priceText ? `**Pris:** ${ctx.priceText}` : "",
      lexicalToMarkdown(service.content),
      faqSection(service.faq),
      cta,
    ],
  };
}

const PRODUCT_STORY_SCHEMAS = schemasForBlocks(productStoryBlocks);

export function productDocument(
  product: {
    name: string;
    slug?: string | null;
    type?: string | null;
    shortDescription?: string | null;
    description?: unknown;
    storySections?: unknown;
    highlights?: { text?: string | null }[] | null;
    price?: number | null;
    compareAtPrice?: number | null;
    recurringInterval?: number | null;
    updatedAt?: string | null;
    meta?: { description?: string | null; noIndex?: boolean | null } | null;
  },
  ctx: MarkdownContext & { typeLabel?: string }
): MarkdownDocument {
  const highlights = (product.highlights ?? [])
    .map((h) => str(h.text))
    .filter(Boolean);
  let priceText: string | undefined;
  if (typeof product.price === "number") {
    const interval =
      product.recurringInterval === 1
        ? " / mnd"
        : product.recurringInterval
          ? ` / ${product.recurringInterval} mnd`
          : "";
    priceText = `${formatKroner(product.price)}${interval}`;
    if (product.compareAtPrice && product.compareAtPrice > product.price) {
      priceText += ` (før ${formatKroner(product.compareAtPrice)})`;
    }
  }
  return {
    title: product.name,
    description: product.meta?.description || product.shortDescription,
    url: `${ctx.siteUrl}/produkter/${product.slug}`,
    type: "product",
    updated: product.updatedAt,
    extra: {
      productType: ctx.typeLabel,
      price: typeof product.price === "number" ? product.price : undefined,
      currency: typeof product.price === "number" ? "NOK" : undefined,
    },
    noIndex: Boolean(product.meta?.noIndex),
    sections: [
      product.shortDescription ?? "",
      [
        ctx.typeLabel ? `**Type:** ${ctx.typeLabel}` : "",
        priceText ? `**Pris:** ${priceText} (inkl. mva)` : "",
      ]
        .filter(Boolean)
        .join("  \n"),
      highlights.length ? highlights.map((h) => `- ${h}`).join("\n") : "",
      lexicalToMarkdown(product.description),
      layoutToMarkdown(product.storySections, ctx, PRODUCT_STORY_SCHEMAS),
    ],
  };
}

/** Oversiktsside: intro + lenkeliste. */
export function indexDocument(opts: {
  title: string;
  description?: string | null;
  url: string;
  type: string;
  items: LinkItem[];
  emptyText?: string;
}): MarkdownDocument {
  return {
    title: opts.title,
    description: opts.description,
    url: opts.url,
    type: opts.type,
    sections: [
      opts.description ?? "",
      opts.items.length ? linkList(opts.items) : (opts.emptyText ?? ""),
    ],
  };
}
