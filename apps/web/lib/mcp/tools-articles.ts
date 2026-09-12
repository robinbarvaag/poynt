import { notTestProduct } from "@/lib/test-products";
import config from "@/payload.config";
import type { McpServer } from "@modelcontextprotocol/server";
import { getPayload } from "payload";
import { z } from "zod";
import {
  applyTextEdits,
  markdownLossyParts,
  productCardIds,
} from "./lexical-edit";
import { lexicalToMarkdown, markdownToLexical } from "./lexical-markdown";
import { analyseSeo } from "./seo";
import { type SeoDoc, loadMedia, seoInputFor } from "./seo-data";
import {
  type Payload,
  adminUrl,
  errorMessage,
  fail,
  isNumericId,
  relationId,
  siteUrl,
  text,
} from "./util";

/**
 * Lese og oppdatere blogginnlegg og kundehistorier. Oppdateringer lagres som
 * nytt UTKAST — den publiserte versjonen røres ikke før Susanne publiserer.
 */

type ArticleCollection = "blog-posts" | "case-studies";

const ARTICLE = {
  "blog-posts": { label: "blogginnlegg", path: "blogg" },
  "case-studies": { label: "kundehistorie", path: "kundehistorier" },
} as const;

async function findArticle(
  payload: Payload,
  collection: ArticleCollection,
  idOrSlug: string
): Promise<SeoDoc | null> {
  const id = isNumericId(idOrSlug);
  if (id !== null) {
    return (await payload
      .findByID({ collection, id, draft: true, depth: 0 })
      .catch(() => null)) as SeoDoc | null;
  }
  const res = await payload.find({
    collection,
    where: { slug: { equals: idOrSlug } },
    draft: true,
    depth: 0,
    limit: 1,
  });
  return (res.docs[0] ?? null) as SeoDoc | null;
}

const articleSummary = (collection: ArticleCollection, doc: SeoDoc) => ({
  id: doc.id,
  title: doc.title,
  slug: doc.slug,
  status: doc._status === "published" ? "publisert" : "utkast",
  publishedAt: doc.publishedAt,
  updatedAt: doc.updatedAt,
  hasMetaTitle: Boolean(doc.meta?.title),
  hasMetaDescription: Boolean(doc.meta?.description),
  url: `${siteUrl}/${ARTICLE[collection].path}/${doc.slug}`,
  adminUrl: adminUrl(doc.id, collection),
});

const idOrSlugField = z.string().describe("ID eller slug");

/**
 * Markdown → Lexical for blogginnlegg/kundehistorier, med produktkort. Sjekker
 * at hvert kort peker på et aktivt produkt (ellers vises kortet ikke) —
 * returnerer en feilmelding i stedet for å lagre et tomt kort.
 */
export async function articleContentFromMarkdown(
  payload: Payload,
  markdown: string
): Promise<{ content: ReturnType<typeof markdownToLexical> } | string> {
  let content: ReturnType<typeof markdownToLexical>;
  try {
    content = markdownToLexical(markdown, { productCards: true });
  } catch (err) {
    return `${errorMessage(err)} Ingenting ble lagret.`;
  }
  const ids = productCardIds(content);
  if (!ids.length) return { content };
  const res = await payload.find({
    collection: "products",
    where: { id: { in: ids }, active: { equals: true }, ...notTestProduct },
    depth: 0,
    limit: ids.length,
    pagination: false,
  });
  const found = new Set(res.docs.map((d) => d.id));
  const missing = ids.filter((id) => !found.has(id));
  return missing.length
    ? `Fant ikke aktivt produkt med ID ${missing.join(", ")} til produktkort. Bruk ID fra list_related (collection «products»). Ingenting ble lagret.`
    : { content };
}

/** Felles felt for update_*_draft. */
const updateBase = {
  idOrSlug: idOrSlugField,
  title: z.string().min(1).optional(),
  excerpt: z.string().optional().describe("Utdrag/ingress. Tom streng tømmer."),
  content: z
    .string()
    .min(1)
    .optional()
    .describe(
      'Erstatter HELE innholdet med markdown. Produktkort på egen linje: [produktkort id=12 etikett="Anbefalt" tekst="…" kjøpsknapp=nei] (bare id påkrevd). Foretrekk contentEdits for mindre endringer — de bevarer bilder og formatering.'
    ),
  contentEdits: z
    .array(
      z.object({
        find: z
          .string()
          .min(1)
          .describe(
            "Eksakt tekst slik den står (uten markdown-tegn). Må ligge innenfor ett tekststykke — fet/kursiv/lenke deler teksten."
          ),
        replace: z.string(),
      })
    )
    .optional()
    .describe(
      "Finn/erstatt i innholdet. Bevarer alt annet (produktkort, bilder, lenker). Bruk til å justere overskrifter, setninger og søkeord."
    ),
  allowContentLoss: z
    .boolean()
    .optional()
    .describe(
      "Kun når Susanne har bekreftet: tillat at content erstatter innhold med bilder/nummererte lister som markdown ikke kan gjengi."
    ),
  featuredImageId: z
    .number()
    .nullable()
    .optional()
    .describe("Media-ID, null fjerner"),
  metaTitle: z
    .string()
    .max(70)
    .optional()
    .describe("SEO-tittel uten «| Poynt». Tom streng = bruk tittelen."),
  metaDescription: z
    .string()
    .max(160)
    .optional()
    .describe("SEO-beskrivelse. Tom streng = bruk utdraget."),
  metaImageId: z
    .number()
    .nullable()
    .optional()
    .describe("Delingsbilde (media-ID), null = bruk hovedbildet"),
};

type UpdateBase = {
  title?: string;
  excerpt?: string;
  content?: string;
  contentEdits?: { find: string; replace: string }[];
  allowContentLoss?: boolean;
  featuredImageId?: number | null;
  metaTitle?: string;
  metaDescription?: string;
  metaImageId?: number | null;
};

/** Bygger data for felles felt, eller en feilmelding. */
async function baseUpdateData(
  payload: Payload,
  doc: SeoDoc,
  input: UpdateBase
): Promise<{ data: Record<string, unknown>; editResults?: unknown } | string> {
  const data: Record<string, unknown> = { _status: "draft" };
  let editResults: unknown;

  if (input.title !== undefined) data.title = input.title;
  if (input.excerpt !== undefined) data.excerpt = input.excerpt;
  if (input.featuredImageId !== undefined) {
    data.featuredImage = input.featuredImageId;
  }

  if (input.content !== undefined && input.contentEdits?.length) {
    return "Send enten content (hele innholdet) eller contentEdits (finn/erstatt), ikke begge.";
  }
  if (input.content !== undefined) {
    const lossy = markdownLossyParts(doc.content);
    if (lossy.length && !input.allowContentLoss) {
      return `Innholdet inneholder ${lossy.join(", ")} som går tapt om hele innholdet erstattes med markdown. Bruk contentEdits for å endre tekst, eller sett allowContentLoss: true etter at Susanne har bekreftet.`;
    }
    const built = await articleContentFromMarkdown(payload, input.content);
    if (typeof built === "string") return built;
    data.content = built.content;
  }
  if (input.contentEdits?.length) {
    const { content, results } = applyTextEdits(
      doc.content,
      input.contentEdits
    );
    const missing = results.filter((r) => r.matches === 0);
    if (missing.length) {
      return `Fant ikke denne teksten i innholdet: ${missing.map((m) => `«${m.find}»`).join(", ")}. Hent innholdet på nytt (get-verktøyet) og bruk eksakt tekst innenfor ett tekststykke — uten **, _ eller lenke-markdown. Ingenting ble lagret.`;
    }
    data.content = content;
    editResults = results;
  }

  if (
    input.metaTitle !== undefined ||
    input.metaDescription !== undefined ||
    input.metaImageId !== undefined
  ) {
    data.meta = {
      ...(doc.meta ?? {}),
      image: relationId(doc.meta?.image) ?? null,
      ...(input.metaTitle !== undefined ? { title: input.metaTitle } : {}),
      ...(input.metaDescription !== undefined
        ? { description: input.metaDescription }
        : {}),
      ...(input.metaImageId !== undefined ? { image: input.metaImageId } : {}),
    };
  }
  return { data, editResults };
}

async function saveArticle(
  payload: Payload,
  collection: ArticleCollection,
  doc: SeoDoc,
  data: Record<string, unknown>,
  editResults: unknown
) {
  try {
    const updated = (await payload.update({
      collection,
      id: doc.id,
      draft: true,
      depth: 0,
      data: data as never,
    })) as SeoDoc;
    const media = await loadMedia(payload, [updated]);
    return text({
      id: updated.id,
      title: updated.title,
      slug: updated.slug,
      status: "utkast lagret",
      changed: Object.keys(data).filter((k) => k !== "_status"),
      contentEdits: editResults,
      adminUrl: adminUrl(updated.id, collection),
      note:
        doc._status === "published"
          ? "Innlegget er publisert fra før. Endringene ligger som utkast — nettsiden viser den gamle versjonen til Susanne trykker «Publiser endringer» i admin."
          : "Utkastet er oppdatert. Susanne publiserer i admin.",
      seoFindings: analyseSeo(seoInputFor(collection, updated, media)),
    });
  } catch (err) {
    return fail(`Payload avviste endringen: ${errorMessage(err)}`);
  }
}

export function registerArticleTools(server: McpServer) {
  for (const collection of ["blog-posts", "case-studies"] as const) {
    const { label } = ARTICLE[collection];
    const name = collection === "blog-posts" ? "blog_posts" : "case_studies";
    server.registerTool(
      `list_${name}`,
      {
        title: `List ${label}`,
        description: `Alle ${collection === "blog-posts" ? "blogginnlegg" : "kundehistorier"} (siste versjon, også utkast) med ID, slug, status og om SEO-feltene er fylt ut.`,
        inputSchema: z.object({
          query: z.string().optional().describe("Søk i tittel"),
        }),
        annotations: { readOnlyHint: true },
      },
      async ({ query }) => {
        const payload = await getPayload({ config });
        const res = await payload.find({
          collection,
          draft: true,
          depth: 0,
          limit: 200,
          sort: "-publishedAt",
          where: query ? { title: { like: query } } : undefined,
        });
        return text(
          res.docs.map((d) => articleSummary(collection, d as SeoDoc))
        );
      }
    );
  }

  server.registerTool(
    "get_blog_post",
    {
      title: "Hent blogginnlegg",
      description:
        "Hele blogginnlegget (siste utkast): tittel, utdrag, innhold som markdown (produktkort som [produktkort id=…]-linjer), bilder, kategorier og SEO-felt. contentNotInMarkdown lister det markdown ikke gjengir (bruk da contentEdits ved oppdatering).",
      inputSchema: z.object({ idOrSlug: idOrSlugField }),
      annotations: { readOnlyHint: true },
    },
    async ({ idOrSlug }) => {
      const payload = await getPayload({ config });
      const doc = await findArticle(payload, "blog-posts", idOrSlug);
      if (!doc) return fail(`Fant ikke blogginnlegg «${idOrSlug}».`);
      return text({
        ...articleSummary("blog-posts", doc),
        excerpt: doc.excerpt ?? "",
        content: lexicalToMarkdown(doc.content),
        contentNotInMarkdown: markdownLossyParts(doc.content),
        featuredImageId: relationId(doc.featuredImage) ?? null,
        categoryIds: (doc.categories ?? []).map(relationId),
        meta: {
          title: doc.meta?.title ?? "",
          description: doc.meta?.description ?? "",
          imageId: relationId(doc.meta?.image) ?? null,
          noIndex: doc.meta?.noIndex ?? false,
        },
      });
    }
  );

  server.registerTool(
    "update_blog_post_draft",
    {
      title: "Oppdater blogginnlegg (utkast)",
      description:
        "Lagrer endringer på et eksisterende blogginnlegg som UTKAST (publisert versjon urørt). Felter som utelates beholdes. Til tekstendringer: contentEdits (finn/erstatt) bevarer produktkort og formatering; content erstatter alt. Slug kan ikke endres her (krever omdirigering — gjøres i admin). Returnerer SEO-funn etter endringen.",
      inputSchema: z.object({
        ...updateBase,
        categoryIds: z
          .array(z.number())
          .optional()
          .describe("Erstatter kategoriene (ID-er fra list_categories)"),
      }),
      annotations: { destructiveHint: false },
    },
    async ({ idOrSlug, categoryIds, ...input }) => {
      const payload = await getPayload({ config });
      const doc = await findArticle(payload, "blog-posts", idOrSlug);
      if (!doc) return fail(`Fant ikke blogginnlegg «${idOrSlug}».`);
      const built = await baseUpdateData(payload, doc, input);
      if (typeof built === "string") return fail(built);
      if (categoryIds !== undefined) built.data.categories = categoryIds;
      return saveArticle(
        payload,
        "blog-posts",
        doc,
        built.data,
        built.editResults
      );
    }
  );

  server.registerTool(
    "get_case_study",
    {
      title: "Hent kundehistorie",
      description:
        "Hele kundehistorien (siste utkast): kunde, innhold som markdown (produktkort som [produktkort id=…]-linjer), resultater, sitat, bilde og SEO-felt.",
      inputSchema: z.object({ idOrSlug: idOrSlugField }),
      annotations: { readOnlyHint: true },
    },
    async ({ idOrSlug }) => {
      const payload = await getPayload({ config });
      const doc = await findArticle(payload, "case-studies", idOrSlug);
      if (!doc) return fail(`Fant ikke kundehistorie «${idOrSlug}».`);
      return text({
        ...articleSummary("case-studies", doc),
        customer: doc.customer,
        excerpt: doc.excerpt ?? "",
        content: lexicalToMarkdown(doc.content),
        contentNotInMarkdown: markdownLossyParts(doc.content),
        results: doc.results ?? [],
        quote: doc.quote ?? null,
        featuredImageId: relationId(doc.featuredImage) ?? null,
        meta: {
          title: doc.meta?.title ?? "",
          description: doc.meta?.description ?? "",
          imageId: relationId(doc.meta?.image) ?? null,
          noIndex: doc.meta?.noIndex ?? false,
        },
      });
    }
  );

  server.registerTool(
    "update_case_study_draft",
    {
      title: "Oppdater kundehistorie (utkast)",
      description:
        "Lagrer endringer på en eksisterende kundehistorie som UTKAST (publisert versjon urørt). Felter som utelates beholdes; results/quote erstattes i sin helhet når de sendes. Ikke finn på tall eller sitater.",
      inputSchema: z.object({
        ...updateBase,
        customer: z.string().min(1).optional(),
        results: z
          .array(z.object({ value: z.string(), label: z.string() }))
          .optional(),
        quote: z
          .object({
            text: z.string(),
            author: z.string(),
            role: z.string().optional(),
          })
          .optional(),
      }),
      annotations: { destructiveHint: false },
    },
    async ({ idOrSlug, customer, results, quote, ...input }) => {
      const payload = await getPayload({ config });
      const doc = await findArticle(payload, "case-studies", idOrSlug);
      if (!doc) return fail(`Fant ikke kundehistorie «${idOrSlug}».`);
      const built = await baseUpdateData(payload, doc, input);
      if (typeof built === "string") return fail(built);
      if (customer !== undefined) built.data.customer = customer;
      if (results !== undefined) built.data.results = results;
      if (quote !== undefined) built.data.quote = quote;
      return saveArticle(
        payload,
        "case-studies",
        doc,
        built.data,
        built.editResults
      );
    }
  );
}
