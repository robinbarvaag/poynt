import {
  COMPOSITION_GUIDELINES,
  analyseComposition,
  blocksFromLayout,
} from "@/lib/composition-rules";
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_LABEL } from "@/lib/media-limits";
import { TONE_OF_VOICE } from "@/lib/tone-of-voice";
import type { Product } from "@/payload-types";
import config from "@/payload.config";
import { McpServer, createMcpHandler } from "@modelcontextprotocol/server";
import { getPayload } from "payload";
import { z } from "zod";
import { getBlockSchema, summarizeBlocks } from "./block-schema";
import { LayoutError, toMcpLayout, toPayloadLayout } from "./layout-convert";
import { lexicalToMarkdown, markdownToLexical } from "./lexical-markdown";
import { registerArticleTools } from "./tools-articles";
import { registerSeoTools } from "./tools-seo";
import { adminUrl, fail, siteUrl, text } from "./util";

/**
 * MCP-server som lar Claude (claude.ai-connector, Claude Desktop, Claude Code)
 * bygge sider i Payload på vegne av redaktøren. Alt skrives som UTKAST —
 * publisering skjer alltid av et menneske i admin. Serveren bruker Payloads
 * lokale API, så validering, versjoner og cache-revalidering skjer akkurat som
 * ved lagring i admin. Autentisering (delt hemmelighet) ligger i ruta:
 * app/api/mcp/[secret]/route.ts.
 */

const INSTRUCTIONS = `Du hjelper Susanne (Poynt) med innhold i Payload CMS: sider (bygd av blokker), kundehistorier og blogginnlegg.

Arbeidsflyt for en side:
1. Kall get_guidelines én gang først — den gir tone of voice, komposisjonsregler og oppskriftene for kundehistorie/blogg.
2. Kall list_blocks for å se hvilke seksjoner som finnes, og get_block_schema for feltene i dem du vil bruke.
3. Se gjerne på en eksisterende side med get_page som mal (f.eks. slug «om» eller «tjenester»).
4. Bygg layout, kjør check_layout, og opprett med create_page_draft. Svar med admin-lenken.

Kundehistorie og blogginnlegg: create_case_study_draft / create_blog_post_draft. Forteller Susanne om et kundebesøk, foreslå gjerne begge (samme bilder, ulik vinkel) — men lag dem bare når hun bekrefter.

Endre eksisterende blogginnlegg/kundehistorier: finn med list_blog_posts/list_case_studies, les med get_blog_post/get_case_study, lagre med update_blog_post_draft/update_case_study_draft. Bruk contentEdits (finn/erstatt) for tekstendringer — det bevarer produktkort, bilder og formatering. Sider endres med update_page_draft. Aldri create_* for noe som finnes fra før.

SEO: kall get_seo_guidelines først. seo_audit gir oversikt over hele nettstedet, get_seo detaljer for ett dokument (hva Google og delingskortet faktisk viser), check_live_seo leser den publiserte siden og sjekker at og:image laster. Foreslå endringer (før → etter, med tegnantall) og vent på ja før update_seo_draft. update_media_alt endrer alt-tekst med en gang (media har ikke utkast) — kun etter ja.

Bilder: search_media finner bilder som allerede er lastet opp i admin. upload_media_from_url henter et bilde fra en lenke (Drive, Dropbox, nettside) inn i mediebiblioteket. Bilder limt inn i chatten kan du IKKE laste opp — be Susanne laste dem opp i admin (Media) eller dele en lenke.

Lese og vurdere: list_pages/get_page og list_related/get_product gir deg innholdet slik det står på nettsiden — bruk dem også når Susanne bare spør om noe (f.eks. «stemmer kjøpsbetingelsene med produktene?»), ikke bare når hun vil bygge.

Regler: alt lagres som utkast, aldri publisert. Skriv på bokmål i Poynts tone. richText-felter sendes som markdown-streng. Ikke finn på tall, kundenavn, sitater eller priser — spør, eller la feltet stå tomt.`;

const layoutSchema = z
  .array(z.record(z.string(), z.unknown()))
  .describe(
    "Liste av seksjoner i rekkefølge. Hver seksjon har blockType + feltene fra get_block_schema."
  );

async function findPage(
  payload: Awaited<ReturnType<typeof getPayload>>,
  idOrSlug: string
) {
  const asId = Number(idOrSlug);
  if (Number.isInteger(asId) && String(asId) === idOrSlug) {
    try {
      return await payload.findByID({
        collection: "pages",
        id: asId,
        draft: true,
        depth: 0,
      });
    } catch {
      return null;
    }
  }
  const res = await payload.find({
    collection: "pages",
    where: { slug: { equals: idOrSlug } },
    draft: true,
    depth: 0,
    limit: 1,
  });
  return res.docs[0] ?? null;
}

function pageResult(
  doc: { id: number; slug: string; title: string },
  extra: Record<string, unknown> = {}
) {
  return {
    id: doc.id,
    title: doc.title,
    slug: doc.slug,
    status: "utkast",
    adminUrl: adminUrl(doc.id),
    ...extra,
  };
}

export const mcpHandler = createMcpHandler(() => {
  const server = new McpServer(
    { name: "poynt-cms", version: "1.0.0" },
    { instructions: INSTRUCTIONS }
  );

  server.registerTool(
    "get_guidelines",
    {
      title: "Retningslinjer",
      description:
        "Poynts tone of voice og komposisjonsregler for sider. Les denne først.",
      inputSchema: z.object({}),
      annotations: { readOnlyHint: true },
    },
    async () =>
      text(
        [
          TONE_OF_VOICE,
          "",
          "Huskeregler for en ryddig side:",
          ...COMPOSITION_GUIDELINES.map((g) => `- ${g}`),
          "",
          "Typisk oppbygging av en landingsside: hero → (statsBand eller featureGrid) → contentMedia/content → testimonials → pricing eller ctaSection → faq → newsletter. En vanlig innholdsside: hero → content → featureGrid → ctaSection. Sett pageType «landing» kun på kampanjer/lanseringer.",
          "",
          "Kundehistorie (create_case_study_draft): tittelen sier resultatet, ikke bare kundenavnet («Hageland nådde målene sine med On Poynt»). Innholdet i tre deler: Utfordringen (hvor sto kunden, konkret nok til å kjenne seg igjen) → Hva vi gjorde (konkrete grep: kanaler, verktøy, valg) → Resultatet (helst tall; «fra kaos til plan» teller også). Minst ett resultat i tall i results, og et sitat fra kunden med navn — men bare det Susanne faktisk har oppgitt.",
          "",
          "Blogginnlegg (create_blog_post_draft): leseren skumleser. Kroken: første setning gir grunn til å lese videre, aldri «I denne artikkelen …». Kjøttet: korte avsnitt, mellomtitler (##) som alene forteller historien, konkrete eksempler. Landingen: ett konkret neste steg, gjerne lenke til tjeneste/guide/kundehistorie. Tittel på minst 25 tegn som folk faktisk søker etter. Sett minst én kategori (list_categories).",
        ].join("\n")
      )
  );

  server.registerTool(
    "list_blocks",
    {
      title: "List blokker",
      description:
        "Alle seksjonstyper (blokker) en side kan bygges av, med norsk navn, beskrivelse og feltnavn. Bruk get_block_schema for detaljer om ett felt-sett.",
      inputSchema: z.object({}),
      annotations: { readOnlyHint: true },
    },
    async () => text(summarizeBlocks())
  );

  server.registerTool(
    "get_block_schema",
    {
      title: "Blokk-skjema",
      description:
        "Fullt felt-skjema for én blokktype: labels, beskrivelser, påkrevde felt, select-alternativer og underfelt for arrays/grupper.",
      inputSchema: z.object({
        blockType: z.string().describe("F.eks. «hero», «featureGrid»"),
      }),
      annotations: { readOnlyHint: true },
    },
    async ({ blockType }) => {
      const schema = getBlockSchema(blockType);
      return schema
        ? text(schema)
        : fail(`Ukjent blockType «${blockType}». Se list_blocks.`);
    }
  );

  server.registerTool(
    "list_pages",
    {
      title: "List sider",
      description:
        "Eksisterende sider med tittel, slug, status og admin-lenke. Nyttig for å finne en mal eller unngå slug-kollisjon.",
      inputSchema: z.object({}),
      annotations: { readOnlyHint: true },
    },
    async () => {
      const payload = await getPayload({ config });
      const res = await payload.find({
        collection: "pages",
        draft: true,
        depth: 0,
        limit: 200,
        sort: "-updatedAt",
      });
      return text(
        res.docs.map((p) => ({
          id: p.id,
          title: p.title,
          slug: p.slug,
          pageType: p.pageType,
          status: p._status,
          blocks: (p.layout ?? []).map((b) => b.blockType),
          updatedAt: p.updatedAt,
          adminUrl: adminUrl(p.id),
        }))
      );
    }
  );

  server.registerTool(
    "get_page",
    {
      title: "Hent side",
      description:
        "Hele siden (siste utkast) i MCP-format: richText som markdown, bilder som media-ID. Kan brukes direkte som mal for create_page_draft.",
      inputSchema: z.object({
        idOrSlug: z.string().describe("Side-ID eller slug"),
      }),
      annotations: { readOnlyHint: true },
    },
    async ({ idOrSlug }) => {
      const payload = await getPayload({ config });
      const doc = await findPage(payload, idOrSlug);
      if (!doc) return fail(`Fant ingen side «${idOrSlug}».`);
      return text({
        id: doc.id,
        title: doc.title,
        slug: doc.slug,
        pageType: doc.pageType,
        status: doc._status,
        meta: { title: doc.meta?.title, description: doc.meta?.description },
        layout: toMcpLayout(doc.layout),
        adminUrl: adminUrl(doc.id),
      });
    }
  );

  server.registerTool(
    "check_layout",
    {
      title: "Sjekk layout",
      description:
        "Validerer en layout uten å lagre: ukjente blokker, manglende påkrevde felt og komposisjonsregler (fargepaneler, hero/nyhetsbrev-plassering, CTA-gjentakelse). Kjør før create/update.",
      inputSchema: z.object({ layout: layoutSchema }),
      annotations: { readOnlyHint: true },
    },
    async ({ layout }) => {
      try {
        toPayloadLayout(layout);
      } catch (err) {
        return fail(err instanceof Error ? err.message : String(err));
      }
      const findings = analyseComposition(blocksFromLayout(layout));
      return text({
        ok: !findings.some((f) => f.level === "advarsel"),
        findings,
      });
    }
  );

  server.registerTool(
    "create_page_draft",
    {
      title: "Opprett side (utkast)",
      description:
        "Oppretter en ny side som UTKAST. Returnerer admin-lenke der Susanne kan se over, justere og publisere. Slug genereres fra tittel om den utelates.",
      inputSchema: z.object({
        title: z.string().min(1).describe("Sidetittel"),
        slug: z
          .string()
          .regex(/^[a-z0-9-]+$/, "Kun små bokstaver, tall og bindestrek")
          .optional(),
        pageType: z.enum(["standard", "landing"]).default("standard"),
        metaTitle: z.string().max(70).optional().describe("SEO-tittel"),
        metaDescription: z
          .string()
          .max(160)
          .optional()
          .describe("SEO-beskrivelse (teksten Google viser)"),
        layout: layoutSchema,
      }),
      annotations: { destructiveHint: false },
    },
    async ({ title, slug, pageType, metaTitle, metaDescription, layout }) => {
      let payloadLayout: ReturnType<typeof toPayloadLayout>;
      try {
        payloadLayout = toPayloadLayout(layout);
      } catch (err) {
        return fail(err instanceof LayoutError ? err.message : String(err));
      }
      const payload = await getPayload({ config });
      if (slug) {
        const existing = await findPage(payload, slug);
        if (existing) {
          return fail(
            `Slug «${slug}» er allerede i bruk (side #${existing.id}). Velg en annen, eller bruk update_page_draft.`
          );
        }
      }
      try {
        const doc = await payload.create({
          collection: "pages",
          draft: true,
          depth: 0,
          data: {
            title,
            slug: slug ?? "",
            pageType,
            meta: { title: metaTitle, description: metaDescription },
            // Typene er generert fra blokk-configene; her er de validert
            // dynamisk mot samme configer.
            layout: payloadLayout as never,
            _status: "draft",
          },
        });
        const findings = analyseComposition(blocksFromLayout(layout));
        return text(
          pageResult(doc, {
            compositionFindings: findings,
            next: "Send admin-lenken til Susanne. Siden er et utkast til hun publiserer den i admin.",
          })
        );
      } catch (err) {
        return fail(
          `Payload avviste siden: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }
  );

  server.registerTool(
    "update_page_draft",
    {
      title: "Oppdater side (utkast)",
      description:
        "Lagrer et nytt UTKAST på en eksisterende side. Den publiserte versjonen røres ikke. Felter som utelates beholdes; sendes layout, erstattes hele blokk-lista.",
      inputSchema: z.object({
        idOrSlug: z.string(),
        title: z.string().min(1).optional(),
        pageType: z.enum(["standard", "landing"]).optional(),
        metaTitle: z.string().max(70).optional(),
        metaDescription: z.string().max(160).optional(),
        layout: layoutSchema.optional(),
      }),
      annotations: { destructiveHint: false },
    },
    async ({
      idOrSlug,
      title,
      pageType,
      metaTitle,
      metaDescription,
      layout,
    }) => {
      const payload = await getPayload({ config });
      const doc = await findPage(payload, idOrSlug);
      if (!doc) return fail(`Fant ingen side «${idOrSlug}».`);

      const data: Record<string, unknown> = { _status: "draft" };
      if (title) data.title = title;
      if (pageType) data.pageType = pageType;
      if (metaTitle !== undefined || metaDescription !== undefined) {
        data.meta = {
          ...(doc.meta ?? {}),
          ...(metaTitle !== undefined ? { title: metaTitle } : {}),
          ...(metaDescription !== undefined
            ? { description: metaDescription }
            : {}),
        };
      }
      if (layout) {
        try {
          data.layout = toPayloadLayout(layout);
        } catch (err) {
          return fail(err instanceof LayoutError ? err.message : String(err));
        }
      }
      try {
        const updated = await payload.update({
          collection: "pages",
          id: doc.id,
          draft: true,
          depth: 0,
          data: data as never,
        });
        return text(
          pageResult(updated, {
            compositionFindings: layout
              ? analyseComposition(blocksFromLayout(layout))
              : undefined,
          })
        );
      } catch (err) {
        return fail(
          `Payload avviste endringen: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }
  );

  server.registerTool(
    "search_media",
    {
      title: "Søk i bilder",
      description:
        "Finn opplastede bilder i mediebiblioteket (søker i alt-tekst og filnavn). Returnerer ID til bruk i bildefelt.",
      inputSchema: z.object({
        query: z.string().optional().describe("Søkeord, tomt = nyeste"),
        limit: z.number().int().min(1).max(50).default(20),
      }),
      annotations: { readOnlyHint: true },
    },
    async ({ query, limit }) => {
      const payload = await getPayload({ config });
      const res = await payload.find({
        collection: "media",
        depth: 0,
        limit,
        sort: "-createdAt",
        where: query
          ? {
              or: [{ alt: { like: query } }, { filename: { like: query } }],
            }
          : undefined,
      });
      return text(
        res.docs.map((m) => ({
          id: m.id,
          alt: m.alt,
          filename: m.filename,
          width: m.width,
          height: m.height,
          url: m.url,
        }))
      );
    }
  );

  server.registerTool(
    "list_related",
    {
      title: "List relaterte dokumenter",
      description:
        "Produkter, tjenester eller skjemaer som blokker kan peke på (ID + navn). Bruk ID-en i relationship-felt.",
      inputSchema: z.object({
        collection: z.enum(["products", "services", "forms", "categories"]),
        query: z.string().optional(),
      }),
      annotations: { readOnlyHint: true },
    },
    async ({ collection, query }) => {
      // Produkter/tjenester heter «name», skjemaer «title».
      const titleField = collection === "forms" ? "title" : "name";
      const payload = await getPayload({ config });
      const res = await payload.find({
        collection,
        depth: 0,
        limit: 100,
        where: query ? { [titleField]: { like: query } } : undefined,
      });
      return text(
        res.docs.map((d) => {
          const doc = d as {
            id: number;
            title?: string;
            name?: string;
            slug?: string;
          };
          return { id: doc.id, title: doc.title ?? doc.name, slug: doc.slug };
        })
      );
    }
  );

  server.registerTool(
    "get_product",
    {
      title: "Hent produkt",
      description:
        "Hele produktet fra nettbutikken: type, pris, førpris, MVA-sats, beskrivelser (markdown), varianter, medlemskapsinnstillinger og status. Bruk den for å lese eller vurdere det som selges, f.eks. opp mot kjøpsbetingelser.",
      inputSchema: z.object({
        idOrSlug: z
          .string()
          .describe("Produkt-ID eller slug (fra list_related)"),
      }),
      annotations: { readOnlyHint: true },
    },
    async ({ idOrSlug }) => {
      const payload = await getPayload({ config });
      const asId = Number(idOrSlug);
      let doc: Product | null = null;
      if (Number.isInteger(asId) && String(asId) === idOrSlug) {
        doc = await payload
          .findByID({ collection: "products", id: asId, depth: 0 })
          .catch(() => null);
      } else {
        const res = await payload.find({
          collection: "products",
          where: { slug: { equals: idOrSlug } },
          depth: 0,
          limit: 1,
        });
        doc = res.docs[0] ?? null;
      }
      if (!doc) return fail(`Fant ingen produkt «${idOrSlug}».`);

      const typeLabels: Record<Product["type"], string> = {
        product: "Produkt",
        course: "Kurs",
        pdf: "PDF",
        bundle: "Bundle",
        membership: "Medlemskap",
      };
      const mediaId = (m: unknown) =>
        typeof m === "object" && m !== null ? (m as { id: number }).id : m;

      return text({
        id: doc.id,
        name: doc.name,
        slug: doc.slug,
        url: `${siteUrl}/produkter/${doc.slug}`,
        type: doc.type,
        typeLabel: typeLabels[doc.type],
        active: doc.active ?? true,
        price: doc.price,
        compareAtPrice: doc.compareAtPrice ?? null,
        vatRate: doc.vatRate ? `${doc.vatRate} %` : null,
        shortDescription: doc.shortDescription ?? null,
        description: doc.description ? lexicalToMarkdown(doc.description) : "",
        highlights: (doc.highlights ?? []).map((h) => h.text),
        statusBadge: doc.statusBadge ?? "none",
        statusBadgeLabel: doc.statusBadgeLabel ?? null,
        notice: doc.notice
          ? { title: doc.noticeTitle ?? null, text: doc.notice }
          : null,
        variants: doc.variantOptions?.length
          ? {
              label: doc.variantLabel ?? null,
              options: doc.variantOptions.map((v) => ({
                label: v.label,
                priceDelta: v.priceDelta ?? 0,
              })),
            }
          : null,
        allowQuantity: doc.allowQuantity ?? false,
        // «instant» = digitalt innhold, kunden må samtykke til bortfall av
        // angrerett i kassen; «standard» = tjeneste/medlemskap/fysisk vare.
        deliveryType: doc.deliveryType,
        membership:
          doc.type === "membership"
            ? {
                recurringIntervalMonths: doc.recurringInterval ?? null,
                tier: doc.membershipTier ?? null,
                applyUrl: doc.applyUrl ?? null,
              }
            : null,
        hasPdfFile: Boolean(doc.pdfFile),
        featuredImageId: doc.featuredImage ? mediaId(doc.featuredImage) : null,
        categoryIds: (doc.categories ?? []).map(mediaId),
        updatedAt: doc.updatedAt,
        adminUrl: adminUrl(doc.id, "products"),
      });
    }
  );

  const seoSchema = {
    metaTitle: z.string().max(70).optional().describe("SEO-tittel"),
    metaDescription: z
      .string()
      .max(160)
      .optional()
      .describe("SEO-beskrivelse (teksten Google viser)"),
  };
  const slugField = z
    .string()
    .regex(/^[a-z0-9-]+$/, "Kun små bokstaver, tall og bindestrek")
    .optional()
    .describe("Genereres fra tittel om den utelates");

  async function slugTaken(
    payload: Awaited<ReturnType<typeof getPayload>>,
    collection: "case-studies" | "blog-posts",
    slug: string
  ) {
    const res = await payload.find({
      collection,
      where: { slug: { equals: slug } },
      draft: true,
      depth: 0,
      limit: 1,
    });
    return res.docs[0] ?? null;
  }

  server.registerTool(
    "create_case_study_draft",
    {
      title: "Opprett kundehistorie (utkast)",
      description:
        "Oppretter en kundehistorie som UTKAST (vises på /kundehistorier når den publiseres). Innholdet skrives som markdown i tre deler: utfordringen, hva vi gjorde, resultatet. Se get_guidelines.",
      inputSchema: z.object({
        title: z.string().min(1).describe("Tittel som sier resultatet"),
        customer: z.string().min(1).describe("Kundens/bedriftens navn"),
        excerpt: z
          .string()
          .optional()
          .describe("Én til to setninger som selger historien i lister"),
        content: z.string().min(1).describe("Historien som markdown"),
        results: z
          .array(
            z.object({
              value: z.string().describe("F.eks. «2×» eller «52»"),
              label: z.string().describe("F.eks. «så mange følgere»"),
            })
          )
          .optional()
          .describe("Resultater i tall — kun det Susanne har oppgitt"),
        quote: z
          .object({
            text: z.string(),
            author: z.string(),
            role: z.string().optional(),
          })
          .optional()
          .describe("Sitat fra kunden, med navn"),
        featuredImageId: z
          .number()
          .optional()
          .describe("Media-ID fra search_media/upload_media_from_url"),
        slug: slugField,
        ...seoSchema,
      }),
      annotations: { destructiveHint: false },
    },
    async ({
      title,
      customer,
      excerpt,
      content,
      results,
      quote,
      featuredImageId,
      slug,
      metaTitle,
      metaDescription,
    }) => {
      const payload = await getPayload({ config });
      if (slug) {
        const existing = await slugTaken(payload, "case-studies", slug);
        if (existing) {
          return fail(
            `Slug «${slug}» er allerede i bruk (kundehistorie #${existing.id}).`
          );
        }
      }
      try {
        const doc = await payload.create({
          collection: "case-studies",
          draft: true,
          depth: 0,
          data: {
            title,
            customer,
            excerpt,
            content: markdownToLexical(content) as never,
            results,
            quote,
            featuredImage: featuredImageId,
            slug: slug ?? "",
            publishedAt: new Date().toISOString(),
            meta: { title: metaTitle, description: metaDescription },
            _status: "draft",
          },
        });
        return text({
          id: doc.id,
          title: doc.title,
          slug: doc.slug,
          status: "utkast",
          adminUrl: adminUrl(doc.id, "case-studies"),
          missing: [
            !featuredImageId && "hovedbilde (ekte bilde av kunden)",
            !results?.length && "minst ett resultat i tall",
            !quote && "sitat fra kunden med navn",
          ].filter(Boolean),
        });
      } catch (err) {
        return fail(
          `Payload avviste kundehistorien: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }
  );

  server.registerTool(
    "list_categories",
    {
      title: "List bloggkategorier",
      description: "Kategorier et blogginnlegg kan ha (ID + navn).",
      inputSchema: z.object({}),
      annotations: { readOnlyHint: true },
    },
    async () => {
      const payload = await getPayload({ config });
      const res = await payload.find({
        collection: "categories",
        depth: 0,
        limit: 100,
      });
      return text(
        res.docs.map((c) => ({ id: c.id, name: c.name, slug: c.slug }))
      );
    }
  );

  server.registerTool(
    "create_blog_post_draft",
    {
      title: "Opprett blogginnlegg (utkast)",
      description:
        "Oppretter et blogginnlegg som UTKAST (vises på /blogg når det publiseres). Innhold som markdown med ##-mellomtitler. Se get_guidelines.",
      inputSchema: z.object({
        title: z.string().min(1),
        excerpt: z
          .string()
          .optional()
          .describe("Ingress i lister og søkeresultat"),
        content: z.string().min(1).describe("Innlegget som markdown"),
        featuredImageId: z.number().optional().describe("Media-ID"),
        categoryIds: z
          .array(z.number())
          .optional()
          .describe("ID-er fra list_categories"),
        slug: slugField,
        ...seoSchema,
      }),
      annotations: { destructiveHint: false },
    },
    async ({
      title,
      excerpt,
      content,
      featuredImageId,
      categoryIds,
      slug,
      metaTitle,
      metaDescription,
    }) => {
      const payload = await getPayload({ config });
      if (slug) {
        const existing = await slugTaken(payload, "blog-posts", slug);
        if (existing) {
          return fail(
            `Slug «${slug}» er allerede i bruk (blogginnlegg #${existing.id}).`
          );
        }
      }
      try {
        const doc = await payload.create({
          collection: "blog-posts",
          draft: true,
          depth: 0,
          data: {
            title,
            excerpt,
            content: markdownToLexical(content) as never,
            featuredImage: featuredImageId,
            categories: categoryIds,
            slug: slug ?? "",
            publishedAt: new Date().toISOString(),
            meta: { title: metaTitle, description: metaDescription },
            _status: "draft",
          },
        });
        return text({
          id: doc.id,
          title: doc.title,
          slug: doc.slug,
          status: "utkast",
          adminUrl: adminUrl(doc.id, "blog-posts"),
          missing: [
            !featuredImageId && "hovedbilde",
            !categoryIds?.length && "kategori",
          ].filter(Boolean),
        });
      } catch (err) {
        return fail(
          `Payload avviste innlegget: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }
  );

  server.registerTool(
    "upload_media_from_url",
    {
      title: "Last opp bilde fra lenke",
      description: `Henter et bilde fra en offentlig URL (direktelenke til fila) inn i mediebiblioteket og returnerer media-ID. Maks ${MAX_UPLOAD_LABEL}. Bilder limt inn i chatten kan ikke lastes opp her.`,
      inputSchema: z.object({
        url: z
          .string()
          .url()
          .describe("Direktelenke til bildefila (http/https)"),
        alt: z
          .string()
          .min(1)
          .describe("Alt-tekst: hva bildet viser, for skjermlesere og SEO"),
        filename: z
          .string()
          .optional()
          .describe("Ønsket filnavn, uten sti (valgfritt)"),
      }),
      annotations: { destructiveHint: false },
    },
    async ({ url, alt, filename }) => {
      let parsed: URL;
      try {
        parsed = new URL(url);
      } catch {
        return fail("Ugyldig URL.");
      }
      if (!["http:", "https:"].includes(parsed.protocol)) {
        return fail("Kun http/https-lenker.");
      }
      // Ikke la serveren hente fra interne adresser (SSRF).
      if (
        /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|0\.|\[::1\])/.test(
          parsed.hostname
        )
      ) {
        return fail("Interne adresser er ikke tillatt.");
      }
      let res: Response;
      try {
        res = await fetch(url, { cache: "no-store", redirect: "follow" });
      } catch (err) {
        return fail(
          `Kunne ikke hente bildet: ${err instanceof Error ? err.message : String(err)}`
        );
      }
      if (!res.ok) return fail(`Kunne ikke hente bildet (HTTP ${res.status}).`);
      const mimetype = (res.headers.get("content-type") ?? "")
        .split(";")[0]
        .trim();
      if (!mimetype.startsWith("image/")) {
        return fail(
          `Lenken gir «${mimetype || "ukjent"}», ikke et bilde. Trenger en direktelenke til selve fila (Drive/Dropbox: bruk «last ned»-lenken).`
        );
      }
      const buffer = Buffer.from(await res.arrayBuffer());
      if (buffer.length > MAX_UPLOAD_BYTES) {
        return fail(
          `Bildet er for stort (${(buffer.length / 1024 / 1024).toFixed(1)} MB). Maks ${MAX_UPLOAD_LABEL}.`
        );
      }
      const ext = mimetype.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
      const fromPath = decodeURIComponent(
        parsed.pathname.split("/").pop() ?? ""
      );
      const safeName = (filename || fromPath || `bilde.${ext}`)
        .replace(/[^\p{L}\p{N}._-]+/gu, "-")
        .replace(/^-+|-+$/g, "");
      const name = /\.[a-z0-9]{2,5}$/i.test(safeName)
        ? safeName
        : `${safeName}.${ext}`;
      const payload = await getPayload({ config });
      try {
        const created = await payload.create({
          collection: "media",
          depth: 0,
          data: { alt, sourceUrl: url },
          file: { data: buffer, mimetype, name, size: buffer.length },
        });
        return text({
          id: created.id,
          filename: created.filename,
          alt: created.alt,
          width: created.width,
          height: created.height,
          adminUrl: adminUrl(created.id, "media"),
        });
      } catch (err) {
        return fail(
          `Opplasting feilet: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }
  );

  registerArticleTools(server);
  registerSeoTools(server);

  return server;
});
