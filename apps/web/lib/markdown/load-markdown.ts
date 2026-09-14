import { getKontaktPage } from "@/lib/kontakt-page";
import { fetchPodcastEpisodes } from "@/lib/podcast-rss";
import { PRODUCT_TYPE_LABELS } from "@/lib/product";
import { SITE_NAME, SITE_URL } from "@/lib/seo";
import { formatServicePrice } from "@/lib/service";
import { notTestProduct } from "@/lib/test-products";
import config from "@/payload.config";
import { cacheLife, cacheTag } from "next/cache";
import { getPayload } from "payload";
import {
  type LinkItem,
  type MarkdownDocument,
  blogPostDocument,
  caseStudyDocument,
  indexDocument,
  linkList,
  pageDocument,
  productDocument,
  renderMarkdownDocument,
  serviceDocument,
} from "./document-to-markdown";
import { eventDocument } from "./event-document";
import { markdownUrlFor } from "./negotiation";

/**
 * Datahenting for markdown-versjonene og llms.txt. Samme publiseringsfiltre
 * som HTML-rutene og sitemap (publisert, aktiv, ikke testprodukt), og samme
 * «cms»-cachetag — så en publisering i admin slår gjennom her også.
 */

type Rec = Record<string, unknown>;

const ctx = { siteUrl: SITE_URL };
const url = (path: string) => `${SITE_URL}${path === "/" ? "" : path}`;

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function date(value: unknown): string {
  const s = str(value);
  return s ? s.slice(0, 10) : "";
}

async function payloadClient() {
  return getPayload({ config });
}

async function getSiteSettings() {
  const payload = await payloadClient();
  return payload
    .findGlobal({ slug: "site-settings", depth: 0 })
    .catch(() => null);
}

async function findPublished<S extends "pages" | "blog-posts" | "case-studies">(
  collection: S,
  where: Rec = {},
  opts: { depth?: number; limit?: number; sort?: string } = {}
) {
  const payload = await payloadClient();
  const result = await payload.find({
    collection,
    where: { _status: { equals: "published" }, ...where },
    depth: opts.depth ?? 2,
    limit: opts.limit ?? 1000,
    ...(opts.sort ? { sort: opts.sort } : {}),
  });
  return result.docs;
}

async function findServices(where: Rec = {}, depth = 2) {
  const payload = await payloadClient();
  const result = await payload.find({
    collection: "services",
    where: {
      active: { equals: true },
      _status: { equals: "published" },
      ...where,
    },
    sort: "sortOrder",
    depth,
    limit: 1000,
  });
  return result.docs;
}

async function findProducts(where: Rec = {}, depth = 2) {
  const payload = await payloadClient();
  const result = await payload.find({
    collection: "products",
    where: { active: { equals: true }, ...notTestProduct, ...where },
    sort: ["displayOrder", "-createdAt"],
    depth,
    limit: 1000,
  });
  return result.docs;
}

async function findEvents(where: Rec = {}, depth = 2) {
  const payload = await payloadClient();
  const result = await payload.find({
    collection: "events",
    where: { _status: { equals: "published" }, ...where },
    sort: "startsAt",
    depth,
    limit: 500,
  });
  return result.docs;
}

async function getPodcastEpisodes() {
  "use cache";
  cacheTag("cms");
  cacheLife("hours");
  const feedUrl = process.env.PODCAST_RSS_URL;
  return feedUrl
    ? fetchPodcastEpisodes(feedUrl, { limit: 200 }).catch(() => [])
    : [];
}

/** Side-/dokument-rader i lenkelister og llms.txt. */
function serviceItem(
  service: {
    name: string;
    slug?: string | null;
    shortDescription?: string | null;
    priceType: "fixed" | "from" | "monthly" | "contact";
    price?: number | null;
    includesVat?: boolean | null;
  },
  link: (path: string) => string
): LinkItem {
  return {
    title: service.name,
    url: link(`/tjenester/${service.slug}`),
    meta: formatServicePrice(service),
    description: service.shortDescription,
  };
}

async function homepageDocument(): Promise<MarkdownDocument> {
  const payload = await payloadClient();
  const [homepage, settings] = await Promise.all([
    payload.findGlobal({ slug: "homepage", depth: 2 }),
    getSiteSettings(),
  ]);
  const doc = pageDocument(
    {
      title: homepage?.meta?.title || settings?.siteName || SITE_NAME,
      layout: homepage?.layout,
      updatedAt: homepage?.updatedAt,
      meta: homepage?.meta,
    },
    { ...ctx, path: "/" }
  );
  return {
    ...doc,
    type: "homepage",
    description: doc.description || settings?.siteDescription,
  };
}

async function contactDocument(): Promise<MarkdownDocument | null> {
  const [page, settings] = await Promise.all([
    getKontaktPage(),
    getSiteSettings(),
  ]);
  if (!page) return null;
  const doc = pageDocument(page, { ...ctx, path: "/kontakt" });
  const contact = [
    settings?.email
      ? `- E-post: [${settings.email}](mailto:${settings.email})`
      : "",
    settings?.phone ? `- Telefon: ${settings.phone}` : "",
    settings?.address
      ? `- Adresse: ${settings.address.replace(/\s*\n\s*/g, ", ")}`
      : "",
  ].filter(Boolean);
  if (contact.length) {
    doc.sections.push(`## Kontaktinformasjon\n\n${contact.join("\n")}`);
  }
  return doc;
}

/**
 * Markdown-dokumentet for en offentlig sidesti (`/`, `/tjenester/x` …), eller
 * `null` når stien ikke finnes / ikke er publisert.
 */
export async function loadMarkdownDocument(
  pathname: string
): Promise<MarkdownDocument | null> {
  "use cache";
  cacheTag("cms");
  cacheLife("max");

  const segments = pathname.split("/").filter(Boolean);
  const [section, slug, ...rest] = segments;
  if (rest.length) {
    return pageBySlug(segments.join("/"));
  }

  if (!section) return homepageDocument();

  switch (section) {
    case "kontakt":
      return slug ? pageBySlug(segments.join("/")) : contactDocument();

    case "tjenester": {
      if (slug) {
        const [service] = await findServices({ slug: { equals: slug } });
        if (!service) return null;
        return serviceDocument(service, {
          ...ctx,
          priceText: formatServicePrice(service),
        });
      }
      const payload = await payloadClient();
      const [pageConfig, services] = await Promise.all([
        payload.findGlobal({ slug: "servicespage" }),
        findServices({}, 0),
      ]);
      return indexDocument({
        title: pageConfig?.hero?.title || "Tjenester",
        description:
          pageConfig?.hero?.description || pageConfig?.meta?.description,
        url: url("/tjenester"),
        type: "service-index",
        items: services.map((s) => serviceItem(s, url)),
      });
    }

    case "produkter": {
      if (slug) {
        const [product] = await findProducts({ slug: { equals: slug } });
        if (!product) return null;
        return productDocument(product, {
          ...ctx,
          typeLabel: PRODUCT_TYPE_LABELS[product.type ?? ""],
        });
      }
      const payload = await payloadClient();
      const [pageConfig, products] = await Promise.all([
        payload.findGlobal({ slug: "productspage" }),
        findProducts({}, 0),
      ]);
      return indexDocument({
        title: pageConfig?.hero?.title || "Produkter",
        description:
          pageConfig?.hero?.description || pageConfig?.meta?.description,
        url: url("/produkter"),
        type: "product-index",
        items: products.map((p) => productItem(p, url)),
      });
    }

    case "blogg": {
      if (slug) {
        const [post] = await findPublished("blog-posts", {
          slug: { equals: slug },
        });
        return post ? blogPostDocument(post, ctx) : null;
      }
      const payload = await payloadClient();
      const [blogPage, posts] = await Promise.all([
        payload
          .findGlobal({ slug: "blogpage" as "homepage", depth: 0 })
          .then((g) => g as unknown as Rec)
          .catch(() => null),
        findPublished(
          "blog-posts",
          {},
          { depth: 0, sort: "-publishedAt", limit: 200 }
        ),
      ]);
      return indexDocument({
        title: str(blogPage?.title) || "Blogg",
        description: str(blogPage?.description),
        url: url("/blogg"),
        type: "blog-index",
        items: posts.map((p) => ({
          title: p.title,
          url: url(`/blogg/${p.slug}`),
          meta: date(p.publishedAt),
          description: p.excerpt,
        })),
      });
    }

    case "kundehistorier": {
      if (slug) {
        const [story] = await findPublished("case-studies", {
          slug: { equals: slug },
        });
        return story ? caseStudyDocument(story, ctx) : null;
      }
      const stories = await findPublished(
        "case-studies",
        {},
        { depth: 0, sort: "-publishedAt" }
      );
      return indexDocument({
        title: "Kundehistorier",
        description:
          "Ekte historier fra folk jeg har jobbet med: hva som var utfordringen, hva vi gjorde, og hva det førte til.",
        url: url("/kundehistorier"),
        type: "case-study-index",
        items: stories.map((s) => ({
          title: s.title,
          url: url(`/kundehistorier/${s.slug}`),
          meta: s.customer,
          description: s.excerpt,
        })),
      });
    }

    case "eventer": {
      if (slug) {
        // Billettsidene er personlige og har ingen markdown-versjon.
        if (slug === "billett") return null;
        const [event] = await findEvents({ slug: { equals: slug } });
        return event ? eventDocument(event, ctx) : null;
      }
      const events = await findEvents({}, 0);
      return indexDocument({
        title: "Eventer",
        description: "Lanseringer, foredrag og samlinger med Poynt.",
        url: url("/eventer"),
        type: "event-index",
        items: events.map((e) => ({
          title: e.title,
          url: url(`/eventer/${e.slug}`),
          meta: date(e.startsAt),
          description: e.excerpt,
        })),
        emptyText: "Ingen eventer publisert akkurat nå.",
      });
    }

    case "podkast": {
      if (slug) return null;
      const payload = await payloadClient();
      const [pageConfig, episodes] = await Promise.all([
        payload.findGlobal({ slug: "podcastpage" }),
        getPodcastEpisodes(),
      ]);
      return indexDocument({
        title: pageConfig?.hero?.title || "Podkast",
        description:
          pageConfig?.hero?.description || pageConfig?.meta?.description,
        url: url("/podkast"),
        type: "podcast",
        items: episodes.flatMap((e) =>
          e.link
            ? [
                {
                  title: e.title,
                  url: e.link,
                  meta: [date(e.publishedAt), e.durationLabel]
                    .filter(Boolean)
                    .join(", "),
                  description: e.description
                    ? truncate(stripHtml(e.description), 280)
                    : undefined,
                },
              ]
            : []
        ),
        emptyText:
          pageConfig?.emptyStateText || "Ingen episoder publisert ennå.",
      });
    }

    default:
      return pageBySlug(segments.join("/"));
  }
}

function productItem(
  product: {
    name: string;
    slug?: string | null;
    type?: string | null;
    shortDescription?: string | null;
    price?: number | null;
  },
  link: (path: string) => string
): LinkItem {
  const price =
    typeof product.price === "number"
      ? `${product.price.toLocaleString("nb-NO")} kr`
      : "";
  return {
    title: product.name,
    url: link(`/produkter/${product.slug}`),
    meta: [PRODUCT_TYPE_LABELS[product.type ?? ""], price]
      .filter(Boolean)
      .join(", "),
    description: product.shortDescription,
  };
}

async function pageBySlug(slug: string): Promise<MarkdownDocument | null> {
  const [page] = await findPublished(
    "pages",
    { slug: { equals: slug } },
    { limit: 1 }
  );
  // Sider som krever bokkjøp har ingen markdown-versjon — ellers kunne hvem
  // som helst hente innholdet via /<slug>.md forbi døra.
  if (!page || page.bookGate) return null;
  return pageDocument(page, { ...ctx, path: `/${slug}` });
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

/**
 * Kort beskrivelse av Poynt: nettsted-innstillingene først, ellers forsidens
 * meta-beskrivelse (som redaktøren faktisk holder oppdatert).
 */
async function siteDescription(
  settings: Awaited<ReturnType<typeof getSiteSettings>>
): Promise<string> {
  if (settings?.siteDescription) return settings.siteDescription;
  const payload = await payloadClient();
  const homepage = await payload
    .findGlobal({ slug: "homepage", depth: 0 })
    .catch(() => null);
  return homepage?.meta?.description || settings?.siteName || SITE_NAME;
}

/** Offentlige, indekserbare sider (samme utvalg som sitemap). */
function isListedPage(page: {
  slug?: string | null;
  unlisted?: boolean | null;
  bookGate?: boolean | null;
  meta?: { noIndex?: boolean | null } | null;
}) {
  return (
    Boolean(page.slug) &&
    page.slug !== "forside" &&
    page.slug !== "kontakt" &&
    !page.unlisted &&
    !page.bookGate &&
    !page.meta?.noIndex
  );
}

/**
 * `/llms.txt` etter https://llmstxt.org: kort presentasjon av Poynt og en
 * lenkeliste til markdown-versjonen av de viktigste sidene.
 */
export async function loadLlmsTxt(): Promise<string> {
  "use cache";
  cacheTag("cms");
  cacheLife("hours");

  const [settings, services, products, stories, pages, posts] =
    await Promise.all([
      getSiteSettings(),
      findServices({}, 0),
      findProducts({}, 0),
      findPublished("case-studies", {}, { depth: 0, sort: "-publishedAt" }),
      findPublished("pages", {}, { depth: 0, sort: "title" }),
      findPublished(
        "blog-posts",
        {},
        { depth: 0, sort: "-publishedAt", limit: 100 }
      ),
    ]);

  const events = await findEvents({}, 0);
  const md = (path: string) => markdownUrlFor(SITE_URL, path);
  const indexable = <T extends { meta?: { noIndex?: boolean | null } | null }>(
    docs: T[]
  ) => docs.filter((d) => !d.meta?.noIndex);
  const siteName = settings?.siteName || SITE_NAME;

  const sections: [string, LinkItem[]][] = [
    [
      "Hovedsider",
      [
        { title: "Forside", url: md("/") },
        { title: "Tjenester", url: md("/tjenester") },
        { title: "Produkter", url: md("/produkter") },
        { title: "Kundehistorier", url: md("/kundehistorier") },
        { title: "Kontakt", url: md("/kontakt") },
      ],
    ],
    ["Tjenester", indexable(services).map((s) => serviceItem(s, md))],
    ["Produkter", indexable(products).map((p) => productItem(p, md))],
    [
      "Kundehistorier",
      indexable(stories).map((s) => ({
        title: s.title,
        url: md(`/kundehistorier/${s.slug}`),
        meta: s.customer,
        description: s.excerpt,
      })),
    ],
    [
      "Eventer",
      indexable(events).map((e) => ({
        title: e.title,
        url: md(`/eventer/${e.slug}`),
        meta: date(e.startsAt),
        description: e.excerpt,
      })),
    ],
    [
      "Sider",
      pages.filter(isListedPage).map((p) => ({
        title: p.title,
        url: md(`/${p.slug}`),
        description: p.meta?.description,
      })),
    ],
    [
      "Blogg",
      indexable(posts).map((p) => ({
        title: p.title,
        url: md(`/blogg/${p.slug}`),
        meta: date(p.publishedAt),
        description: p.excerpt,
      })),
    ],
    [
      "Optional",
      [
        {
          title: "Podkast",
          url: md("/podkast"),
          description: "Alle episoder av podkasten",
        },
        { title: "Alt innhold i én fil", url: `${SITE_URL}/llms-full.txt` },
        { title: "Sitemap", url: `${SITE_URL}/sitemap.xml` },
      ],
    ],
  ];

  const contact = [
    settings?.email ? `e-post ${settings.email}` : "",
    settings?.phone ? `telefon ${settings.phone}` : "",
  ].filter(Boolean);

  return [
    `# ${siteName}`,
    `> ${(await siteDescription(settings)).replace(/\s+/g, " ").trim()}`,
    [
      `Nettsted: ${SITE_URL}. Språk: norsk (bokmål).`,
      contact.length ? `Kontakt: ${contact.join(", ")}.` : "",
      "Alle sidene under finnes som markdown: legg til `.md` på adressen (forsiden er `/index.md`), bruk `?format=md`, eller send `Accept: text/markdown`.",
    ]
      .filter(Boolean)
      .join("\n"),
    ...sections
      .filter(([, items]) => items.length)
      .map(([title, items]) => `## ${title}\n\n${linkList(items)}`),
  ]
    .join("\n\n")
    .concat("\n");
}

/**
 * `/llms-full.txt`: alt offentlig innhold som én markdown-fil, for agenter
 * som vil ha hele konteksten i ett kall.
 */
export async function loadLlmsFullTxt(): Promise<string> {
  "use cache";
  cacheTag("cms");
  cacheLife("hours");

  const [settings, services, products, stories, pages, posts] =
    await Promise.all([
      getSiteSettings(),
      findServices(),
      findProducts(),
      findPublished("case-studies", {}, { sort: "-publishedAt" }),
      findPublished("pages", {}, { sort: "title" }),
      findPublished("blog-posts", {}, { sort: "-publishedAt", limit: 200 }),
    ]);

  const docs: MarkdownDocument[] = [
    await homepageDocument(),
    ...services.map((s) =>
      serviceDocument(s, { ...ctx, priceText: formatServicePrice(s) })
    ),
    ...products.map((p) =>
      productDocument(p, {
        ...ctx,
        typeLabel: PRODUCT_TYPE_LABELS[p.type ?? ""],
      })
    ),
    ...stories.map((s) => caseStudyDocument(s, ctx)),
    ...pages
      .filter(isListedPage)
      .map((p) => pageDocument(p, { ...ctx, path: `/${p.slug}` })),
    ...posts.map((p) => blogPostDocument(p, ctx)),
  ].filter((d) => !d.noIndex);

  const contact = await contactDocument();
  if (contact) docs.splice(1, 0, contact);

  const siteName = settings?.siteName || SITE_NAME;
  return [
    `# ${siteName} – alt innhold`,
    `> ${(await siteDescription(settings)).replace(/\s+/g, " ").trim()}`,
    `Kilde: ${SITE_URL}. Hver seksjon under er én side; se ${SITE_URL}/llms.txt for en kortere oversikt.`,
    ...docs.map(
      (d) =>
        renderMarkdownDocument(d, {
          frontmatter: false,
          siteUrl: SITE_URL,
        }).trim()
      // Dokumentets H1 blir H1 i den samlede fila; ingen justering nødvendig,
      // men skill dokumentene tydelig.
    ),
  ]
    .join("\n\n---\n\n")
    .concat("\n");
}
