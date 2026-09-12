import {
  COMPOSITION_GUIDELINES,
  analyseComposition,
  blocksFromLayout,
} from "@/lib/composition-rules";
import { TONE_OF_VOICE } from "@/lib/tone-of-voice";
import config from "@/payload.config";
import { McpServer, createMcpHandler } from "@modelcontextprotocol/server";
import { getPayload } from "payload";
import { z } from "zod";
import { getBlockSchema, summarizeBlocks } from "./block-schema";
import { LayoutError, toMcpLayout, toPayloadLayout } from "./layout-convert";

/**
 * MCP-server som lar Claude (claude.ai-connector, Claude Desktop, Claude Code)
 * bygge sider i Payload på vegne av redaktøren. Alt skrives som UTKAST —
 * publisering skjer alltid av et menneske i admin. Serveren bruker Payloads
 * lokale API, så validering, versjoner og cache-revalidering skjer akkurat som
 * ved lagring i admin. Autentisering (delt hemmelighet) ligger i ruta:
 * app/api/mcp/[secret]/route.ts.
 */

const siteUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";
const adminUrl = (id: number | string) =>
  `${siteUrl}/admin/collections/pages/${id}`;

const INSTRUCTIONS = `Du hjelper Susanne (Poynt) med å bygge sider i Payload CMS. Sidene består av blokker (seksjoner) i rekkefølge.

Arbeidsflyt:
1. Kall get_guidelines én gang først — den gir tone of voice og komposisjonsregler.
2. Kall list_blocks for å se hvilke seksjoner som finnes, og get_block_schema for feltene i dem du vil bruke.
3. Se gjerne på en eksisterende side med get_page som mal (f.eks. slug «om» eller «tjenester»).
4. Bygg layout, kjør check_layout, og opprett med create_page_draft. Svar med admin-lenken.

Regler: alt lagres som utkast, aldri publisert. Skriv på bokmål i Poynts tone. richText-felter sendes som markdown-streng. Bilder refereres med media-ID fra search_media (utelat bildefelt om du ikke finner et passende). Ikke finn på tall, kundenavn eller priser — spør, eller la feltet stå tomt.`;

const text = (data: unknown) => ({
  content: [
    {
      type: "text" as const,
      text: typeof data === "string" ? data : JSON.stringify(data, null, 2),
    },
  ],
});

const fail = (message: string) => ({
  isError: true,
  content: [{ type: "text" as const, text: message }],
});

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
        collection: z.enum(["products", "services", "forms"]),
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

  return server;
});
