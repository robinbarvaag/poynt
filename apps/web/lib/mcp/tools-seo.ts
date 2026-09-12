import { isFetchableUrl, pickMeta, titleTag } from "@/lib/og";
import { brandCardUrl } from "@/lib/seo";
import config from "@/payload.config";
import type { McpServer } from "@modelcontextprotocol/server";
import { getPayload } from "payload";
import { z } from "zod";
import {
  SEO_COLLECTIONS,
  SEO_LIMITS,
  type SeoCollection,
  type SeoFinding,
  analyseRendered,
  analyseSeo,
  effectiveSeo,
  findDuplicates,
  parseHeadExtras,
  resolveOgImageChoice,
} from "./seo";
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
 * SEO-verktøy: revisjon på tvers av innholdet, detaljer for ett dokument,
 * endring av SEO-felt som UTKAST og sjekk av det som faktisk rendres på den
 * publiserte siden (inkl. at og:image laster).
 */

export const SEO_GUIDELINES = `SEO-retningslinjer for Poynt (norsk marked, bokmål)

Meta-tittel
- ${SEO_LIMITS.title.min}–${SEO_LIMITS.title.max} tegn MED « | Poynt» (legges på automatisk — skriv aldri suffikset selv). Altså ca. 32–52 tegn i feltet.
- Hovedsøkeordet tidlig, slik folk faktisk søker på norsk («innholdsplan for små bedrifter», ikke «content strategy»).
- Unik per side. Lov noe konkret (resultat, format, målgruppe). Ingen VERSALER, ingen søkeord-oppramsing.
- Tom meta-tittel er helt greit når innholdstittelen allerede er god og kort nok — ikke fyll ut for å fylle ut.

Meta-beskrivelse
- ${SEO_LIMITS.description.min}–${SEO_LIMITS.description.max} tegn. Svar på «hvorfor klikke?»: hva leseren får + en myk oppfordring.
- Søkeordet naturlig én gang (Google uthever det). Aktiv form, Poynts tone, ingen anførselstegn (kan kuttes).
- Sider (pages) har ingen fallback — der SKAL den fylles ut. Blogg/kundehistorier faller tilbake til utdraget; skriv da heller et godt utdrag.

Delingsbilde (og:image)
- 1200×630 (1,91:1), JPG/PNG, under 5 MB, motivet midt i (kortene beskjæres ulikt). Ikke SVG.
- Bilder med annet aspekt vises automatisk inni et Poynt-merkevarekort — greit, men et ekte 1,91:1-bilde fyller kortet og gir flere klikk.
- Uten bilde lages et Poynt-kort med tittelen. Bedre enn feil bilde, dårligere enn et godt bilde.
- Facebook/LinkedIn cacher kortet: etter publisering, be Susanne lime adressen inn i Facebook Sharing Debugger / LinkedIn Post Inspector.

Alt-tekst
- Beskriv hva bildet viser, konkret og kort (5–15 ord). Ikke «bilde av», ikke søkeord-stapping. Rent dekorative bilder: kort og nøkternt.

Innhold
- Én H1 (tittelen). Mellomtitler som ## som alene forteller historien — gjerne med søkeord-varianter.
- Internlenker: minst én relevant lenke til tjeneste, guide eller kundehistorie.
- FAQ-feltet på sider og tjenester gir FAQPage-strukturert data (Google + AI-svar). Kun ekte spørsmål kunder stiller, svar på 1–3 setninger.

Tekniske valg — vær forsiktig
- «Skjul fra søkemotorer» (noIndex) og canonical endres bare når Susanne ber om det eller det er tydelig feil. Forklar konsekvensen først.
- Slug endres ikke via MCP (krever omdirigering i admin, ellers mister gamle lenker og rangering).
- Produkter og forsiden har ikke utkast — der foreslår du endringer, og Susanne legger dem inn i admin.

Arbeidsflyt
1. seo_audit for oversikt (eller get_seo for ett dokument).
2. Presenter funnene som en kort prioritert liste: dagens verdi → forslag (med tegnantall), og hvorfor.
3. Skriv først når Susanne har godkjent — update_seo_draft (flere dokumenter = ett kall per dokument). Alt blir utkast.
4. Etter publisering: check_live_seo på adressen for å bekrefte det som faktisk rendres og at delingsbildet laster.`;

const writableCollections = Object.entries(SEO_COLLECTIONS)
  .filter(([, v]) => v.writable)
  .map(([k]) => k) as [SeoCollection, ...SeoCollection[]];

const collectionEnum = z.enum(
  Object.keys(SEO_COLLECTIONS) as [SeoCollection, ...SeoCollection[]]
);

async function findSeoDoc(
  payload: Payload,
  collection: SeoCollection,
  idOrSlug: string
): Promise<SeoDoc | null> {
  const draft = SEO_COLLECTIONS[collection].writable;
  const id = isNumericId(idOrSlug);
  // Unionen av collection-slugs gir ikke en felles dokumenttype — dokumentene
  // leses som den løse SeoDoc-formen.
  const slug = collection as "pages";
  if (id !== null) {
    return (await payload
      .findByID({ collection: slug, id, draft, depth: 0 })
      .catch(() => null)) as SeoDoc | null;
  }
  const res = await payload.find({
    collection: slug,
    where: { slug: { equals: idOrSlug } },
    draft,
    depth: 0,
    limit: 1,
  });
  return (res.docs[0] ?? null) as SeoDoc | null;
}

function describeSeo(
  collection: SeoCollection | "homepage",
  doc: SeoDoc,
  media: Map<number, import("./seo").SeoMedia>
) {
  const input = seoInputFor(collection, doc, media);
  const seo = effectiveSeo(input);
  const og = resolveOgImageChoice(input);
  const isPublished =
    collection === "products"
      ? doc.active !== false
      : collection === "homepage"
        ? true
        : doc._status === "published";
  return {
    input,
    seo,
    og,
    summary: {
      id: doc.id,
      collection,
      title: input.title,
      status:
        collection === "products" || collection === "homepage"
          ? "live (ingen utkast)"
          : isPublished
            ? "publisert"
            : "utkast",
      url: `${siteUrl}${seo.path}`,
      adminUrl:
        collection === "homepage"
          ? `${siteUrl}/admin/globals/homepage`
          : adminUrl(doc.id, collection),
      writableViaMcp:
        collection !== "homepage" && SEO_COLLECTIONS[collection].writable,
    },
  };
}

function ogImageReport(
  og: ReturnType<typeof resolveOgImageChoice>,
  title: string
) {
  if (og.kind === "merkevarekort") {
    return {
      kind: og.kind,
      explanation: "Automatisk Poynt-kort med tittelen (ingen bilde).",
      previewUrl: brandCardUrl({ title }),
    };
  }
  const m = og.media;
  return {
    kind: og.kind,
    source: og.source,
    mediaId: m.id,
    filename: m.filename,
    width: m.width,
    height: m.height,
    alt: m.alt ?? "",
    explanation:
      og.kind === "bilde"
        ? "Bildet brukes direkte (1200×630-beskjæring)."
        : "Bildet vises inni et Poynt-merkevarekort fordi aspektet ikke er 1,91:1.",
    previewUrl:
      og.kind === "bilde"
        ? m.sizes?.og?.url || m.url
        : brandCardUrl({ title, img: m.url ?? undefined }),
  };
}

const severity = { feil: 0, advarsel: 1, tips: 2 } as const;
const sortFindings = (f: SeoFinding[]) =>
  [...f].sort((a, b) => severity[a.level] - severity[b.level]);

const FETCH_TIMEOUT_MS = 10_000;
const USER_AGENT =
  "Mozilla/5.0 (compatible; PoyntSeoCheck/1.0; +https://poynt.no)";

async function timedFetch(url: string, init: RequestInit = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
      redirect: "follow",
      cache: "no-store",
      headers: { "user-agent": USER_AGENT, ...(init.headers ?? {}) },
    });
  } finally {
    clearTimeout(timer);
  }
}

export function registerSeoTools(server: McpServer) {
  server.registerTool(
    "get_seo_guidelines",
    {
      title: "SEO-retningslinjer",
      description:
        "Poynts SEO-regler: meta-tittel, beskrivelse, delingsbilde, alt-tekst, innholdsstruktur og arbeidsflyt. Les før du foreslår SEO-endringer.",
      inputSchema: z.object({}),
      annotations: { readOnlyHint: true },
    },
    async () => text(SEO_GUIDELINES)
  );

  server.registerTool(
    "seo_audit",
    {
      title: "SEO-revisjon",
      description:
        "Går gjennom SEO for sider, blogginnlegg, kundehistorier, tjenester, produkter og forsiden: tittel- og beskrivelseslengde (slik de faktisk vises, med fallback), manglende/feil delingsbilde, alt-tekst, noindex/canonical, innholdsstruktur og duplikate titler/beskrivelser. Sortert med de største problemene først.",
      inputSchema: z.object({
        collections: z
          .array(collectionEnum)
          .optional()
          .describe("Begrens til disse innholdstypene (standard: alle)"),
        includeHomepage: z.boolean().default(true),
        publishedOnly: z
          .boolean()
          .default(true)
          .describe("Hopp over dokumenter som aldri er publisert"),
        includeTips: z
          .boolean()
          .default(false)
          .describe("Ta med «tips»-funn, ikke bare feil og advarsler"),
      }),
      annotations: { readOnlyHint: true },
    },
    async ({ collections, includeHomepage, publishedOnly, includeTips }) => {
      const payload = await getPayload({ config });
      const targets = collections?.length
        ? collections
        : (Object.keys(SEO_COLLECTIONS) as SeoCollection[]);

      const entries: { collection: SeoCollection | "homepage"; doc: SeoDoc }[] =
        [];
      await Promise.all(
        targets.map(async (collection) => {
          const where =
            collection === "products"
              ? { active: { equals: true }, testProduct: { not_equals: true } }
              : collection === "services"
                ? { active: { equals: true } }
                : undefined;
          const res = await payload.find({
            collection: collection as "pages",
            draft: SEO_COLLECTIONS[collection].writable,
            depth: 0,
            limit: 500,
            where: where as never,
          });
          for (const doc of res.docs as SeoDoc[]) {
            if (
              publishedOnly &&
              SEO_COLLECTIONS[collection].writable &&
              doc._status !== "published"
            ) {
              continue;
            }
            entries.push({ collection, doc });
          }
        })
      );
      if (includeHomepage) {
        const home = (await payload
          .findGlobal({ slug: "homepage", depth: 0 })
          .catch(() => null)) as SeoDoc | null;
        if (home) entries.push({ collection: "homepage", doc: home });
      }

      const media = await loadMedia(payload, entries);
      const reports = entries.map(({ collection, doc }) => {
        const { input, seo, summary } = describeSeo(collection, doc, media);
        const findings = sortFindings(analyseSeo(input));
        return {
          ...summary,
          searchTitle: seo.fullTitle,
          description: seo.description,
          descriptionSource: seo.descriptionSource,
          findings: includeTips
            ? findings
            : findings.filter((f) => f.level !== "tips"),
          counts: {
            feil: findings.filter((f) => f.level === "feil").length,
            advarsel: findings.filter((f) => f.level === "advarsel").length,
            tips: findings.filter((f) => f.level === "tips").length,
          },
        };
      });

      // Skjulte/noindex-sider konkurrerer ikke i søk — ikke tell dem som duplikater.
      const duplicates = findDuplicates(
        entries
          .map((e, i) => ({ e, r: reports[i] }))
          .filter(({ e }) => !e.doc.unlisted && !e.doc.meta?.noIndex)
          .map(({ r }) => ({
            key: `${r.collection} #${r.id} (${r.url})`,
            fullTitle: r.searchTitle,
            description: r.description,
          }))
      );

      const sorted = reports
        .filter((r) => r.findings.length)
        .sort(
          (a, b) =>
            b.counts.feil - a.counts.feil ||
            b.counts.advarsel - a.counts.advarsel
        );

      return text({
        checked: reports.length,
        withProblems: reports.filter((r) => r.counts.feil + r.counts.advarsel)
          .length,
        totals: {
          feil: reports.reduce((n, r) => n + r.counts.feil, 0),
          advarsel: reports.reduce((n, r) => n + r.counts.advarsel, 0),
          tips: reports.reduce((n, r) => n + r.counts.tips, 0),
        },
        duplicates,
        documents: sorted,
        note: "Produkter og forsiden har ikke utkast — foreslå endringer der, Susanne legger dem inn i admin. Resten endres med update_seo_draft etter godkjenning.",
      });
    }
  );

  server.registerTool(
    "get_seo",
    {
      title: "SEO for ett dokument",
      description:
        "SEO-detaljer for én side/innlegg/kundehistorie/tjeneste/produkt eller forsiden: råverdiene i SEO-fanen, hva Google og delingskortet faktisk viser (med fallback), hvilket delingsbilde som brukes og hvorfor, og funn.",
      inputSchema: z.object({
        collection: z.enum([
          "pages",
          "blog-posts",
          "case-studies",
          "services",
          "products",
          "homepage",
        ]),
        idOrSlug: z
          .string()
          .optional()
          .describe("ID eller slug (ikke for homepage)"),
      }),
      annotations: { readOnlyHint: true },
    },
    async ({ collection, idOrSlug }) => {
      const payload = await getPayload({ config });
      let doc: SeoDoc | null;
      if (collection === "homepage") {
        doc = (await payload
          .findGlobal({ slug: "homepage", depth: 0 })
          .catch(() => null)) as SeoDoc | null;
      } else {
        if (!idOrSlug) return fail("idOrSlug mangler.");
        doc = await findSeoDoc(payload, collection, idOrSlug);
      }
      if (!doc) return fail(`Fant ikke «${idOrSlug ?? collection}».`);

      const media = await loadMedia(payload, [{ collection, doc }]);
      const { input, seo, og, summary } = describeSeo(collection, doc, media);
      return text({
        ...summary,
        fields: {
          metaTitle: doc.meta?.title ?? "",
          metaDescription: doc.meta?.description ?? "",
          metaImageId: relationId(doc.meta?.image) ?? null,
          noIndex: doc.meta?.noIndex ?? false,
          canonicalUrl: doc.meta?.canonicalUrl ?? "",
          ...(collection === "pages" || collection === "services"
            ? { faq: doc.faq ?? [] }
            : {}),
          ...(collection === "pages"
            ? { unlisted: doc.unlisted ?? false }
            : {}),
          excerpt: input.excerpt ?? "",
        },
        googlePreview: {
          title: seo.fullTitle,
          titleLength: seo.fullTitle.length,
          titleSource: seo.titleSource,
          url: summary.url,
          description: seo.description,
          descriptionLength: seo.description.length,
          descriptionSource: seo.descriptionSource,
          indexed: !seo.noIndex,
        },
        ogImage: ogImageReport(og, seo.title),
        limits: SEO_LIMITS,
        findings: sortFindings(analyseSeo(input)),
      });
    }
  );

  server.registerTool(
    "update_seo_draft",
    {
      title: "Oppdater SEO (utkast)",
      description:
        "Endrer SEO-feltene på en side, et blogginnlegg, en kundehistorie eller en tjeneste og lagrer som UTKAST (publisert versjon urørt til Susanne publiserer). Felter som utelates beholdes; tom streng tømmer feltet (frontend bruker da fallback). Returnerer før/etter og nye funn. Produkter og forsiden støttes ikke (ingen utkast).",
      inputSchema: z.object({
        collection: z.enum(writableCollections),
        idOrSlug: z.string(),
        metaTitle: z
          .string()
          .max(70)
          .optional()
          .describe("Uten «| Poynt». Tom streng = bruk innholdets tittel."),
        metaDescription: z.string().max(160).optional(),
        metaImageId: z
          .number()
          .nullable()
          .optional()
          .describe("Delingsbilde (media-ID). null = bruk hovedbilde/hero."),
        noIndex: z
          .boolean()
          .optional()
          .describe("Kun etter uttrykkelig ønske fra Susanne"),
        canonicalUrl: z
          .string()
          .optional()
          .describe("Kun når innholdet er en kopi. Tom streng fjerner."),
        faq: z
          .array(z.object({ question: z.string(), answer: z.string() }))
          .optional()
          .describe(
            "Kun sider og tjenester. Erstatter hele FAQ-lista (FAQPage-strukturert data)."
          ),
      }),
      annotations: { destructiveHint: false },
    },
    async ({ collection, idOrSlug, faq, ...fields }) => {
      const payload = await getPayload({ config });
      const doc = await findSeoDoc(payload, collection, idOrSlug);
      if (!doc) return fail(`Fant ikke «${idOrSlug}» i ${collection}.`);
      if (faq && collection !== "pages" && collection !== "services") {
        return fail("FAQ finnes bare på sider og tjenester.");
      }

      const media = await loadMedia(payload, [{ collection, doc }]);
      const before = describeSeo(collection, doc, media);

      const meta: Record<string, unknown> = {
        ...(doc.meta ?? {}),
        image: relationId(doc.meta?.image) ?? null,
      };
      if (fields.metaTitle !== undefined) meta.title = fields.metaTitle;
      if (fields.metaDescription !== undefined) {
        meta.description = fields.metaDescription;
      }
      if (fields.metaImageId !== undefined) meta.image = fields.metaImageId;
      if (fields.noIndex !== undefined) meta.noIndex = fields.noIndex;
      if (fields.canonicalUrl !== undefined) {
        meta.canonicalUrl = fields.canonicalUrl;
      }
      const data: Record<string, unknown> = { _status: "draft", meta };
      if (faq) data.faq = faq;

      let updated: SeoDoc;
      try {
        updated = (await payload.update({
          collection: collection as "pages",
          id: doc.id,
          draft: true,
          depth: 0,
          data: data as never,
        })) as SeoDoc;
      } catch (err) {
        return fail(`Payload avviste endringen: ${errorMessage(err)}`);
      }

      const afterMedia = await loadMedia(payload, [
        { collection, doc: updated },
      ]);
      const after = describeSeo(collection, updated, afterMedia);
      return text({
        ...after.summary,
        status: "utkast lagret",
        before: {
          title: before.seo.fullTitle,
          description: before.seo.description,
          ogImage: before.og.kind,
        },
        after: {
          title: after.seo.fullTitle,
          titleLength: after.seo.fullTitle.length,
          description: after.seo.description,
          descriptionLength: after.seo.description.length,
          ogImage: ogImageReport(after.og, after.seo.title),
          indexed: !after.seo.noIndex,
        },
        findings: sortFindings(analyseSeo(after.input)),
        note:
          doc._status === "published"
            ? "Endringen ligger som utkast. Nettsiden viser gammel SEO til Susanne publiserer i admin."
            : "Utkastet er oppdatert.",
      });
    }
  );

  server.registerTool(
    "check_live_seo",
    {
      title: "Sjekk publisert side",
      description:
        "Henter den PUBLISERTE siden på poynt-domenet og leser det som faktisk står i <head>: title, description, canonical, robots, Open Graph, Twitter-kort, H1 og JSON-LD. Laster også og:image og sjekker at det svarer, er et bilde og ikke er for stort. Bruk etter publisering, eller når noe ser rart ut ved deling.",
      inputSchema: z.object({
        pathOrUrl: z
          .string()
          .min(1)
          .describe(
            "Sti («/blogg/innholdsplan») eller full adresse på eget domene"
          ),
      }),
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async ({ pathOrUrl }) => {
      let target: URL;
      try {
        target = new URL(pathOrUrl, siteUrl);
      } catch {
        return fail("Ugyldig adresse.");
      }
      // Kun eget domene: verktøyet skal ikke kunne brukes til å hente vilkårlige
      // adresser fra serveren.
      if (target.host !== new URL(siteUrl).host) {
        return fail(
          `Kun adresser på ${new URL(siteUrl).host}. Send stien, f.eks. «/blogg/slug».`
        );
      }

      let html: string;
      let finalUrl: string;
      let status: number;
      try {
        const res = await timedFetch(target.toString(), {
          headers: { accept: "text/html" },
        });
        status = res.status;
        finalUrl = res.url || target.toString();
        html = (await res.text()).slice(0, 1_000_000);
      } catch (err) {
        return fail(`Kunne ikke hente siden: ${errorMessage(err)}`);
      }
      if (status >= 400) {
        return fail(
          `Siden svarer HTTP ${status}. Er den publisert, og er stien riktig?`
        );
      }

      const extras = parseHeadExtras(html);
      const rendered = {
        title: titleTag(html),
        description: pickMeta(html, "description"),
        robots: pickMeta(html, "robots"),
        ogTitle: pickMeta(html, "og:title"),
        ogDescription: pickMeta(html, "og:description"),
        ogImage: pickMeta(html, "og:image"),
        ogImageWidth: pickMeta(html, "og:image:width"),
        ogImageHeight: pickMeta(html, "og:image:height"),
        ogUrl: pickMeta(html, "og:url"),
        ogType: pickMeta(html, "og:type"),
        twitterCard: pickMeta(html, "twitter:card"),
        ...extras,
      };
      const findings = analyseRendered(rendered, finalUrl.split(/[?#]/)[0]);

      if (rendered.title && rendered.title.length > SEO_LIMITS.title.max) {
        findings.push({
          level: "advarsel",
          field: "title",
          message: `<title> er ${rendered.title.length} tegn — Google kutter etter ca. ${SEO_LIMITS.title.max}.`,
        });
      }
      if (
        rendered.description &&
        rendered.description.length > SEO_LIMITS.description.max
      ) {
        findings.push({
          level: "advarsel",
          field: "description",
          message: `Meta description er ${rendered.description.length} tegn — kuttes etter ca. ${SEO_LIMITS.description.max}.`,
        });
      }

      let ogImageCheck: Record<string, unknown> | null = null;
      if (rendered.ogImage) {
        if (!/^https?:\/\//i.test(rendered.ogImage)) {
          findings.push({
            level: "feil",
            field: "og:image",
            message: `og:image er relativ (${rendered.ogImage}). Sosiale medier krever full adresse.`,
          });
        } else if (!isFetchableUrl(rendered.ogImage)) {
          ogImageCheck = {
            url: rendered.ogImage,
            skipped: "Intern adresse — ikke hentet (lokal utvikling?).",
          };
        } else {
          try {
            const started = Date.now();
            const res = await timedFetch(rendered.ogImage);
            const bytes = (await res.arrayBuffer()).byteLength;
            const contentType = res.headers.get("content-type") ?? "";
            ogImageCheck = {
              url: rendered.ogImage,
              status: res.status,
              contentType,
              sizeKb: Math.round(bytes / 1024),
              loadMs: Date.now() - started,
            };
            if (!res.ok) {
              findings.push({
                level: "feil",
                field: "og:image",
                message: `Delingsbildet svarer HTTP ${res.status} — kortet blir uten bilde.`,
              });
            } else if (!contentType.startsWith("image/")) {
              findings.push({
                level: "feil",
                field: "og:image",
                message: `Delingsbildet er «${contentType}», ikke et bilde.`,
              });
            } else if (contentType.includes("svg")) {
              findings.push({
                level: "advarsel",
                field: "og:image",
                message:
                  "Delingsbildet er SVG — støttes ikke av Facebook/LinkedIn.",
              });
            }
            if (bytes > 5 * 1024 * 1024) {
              findings.push({
                level: "advarsel",
                field: "og:image",
                message: `Delingsbildet er ${(bytes / 1024 / 1024).toFixed(1)} MB. LinkedIn avviser over 5 MB, og store bilder lastes tregt.`,
              });
            }
            const w = Number(rendered.ogImageWidth);
            const h = Number(rendered.ogImageHeight);
            if (w && h && Math.abs(w / h - 1200 / 630) > 0.2) {
              findings.push({
                level: "tips",
                field: "og:image",
                message: `og:image er oppgitt som ${w}×${h}, ikke 1,91:1 — kan bli beskåret i kortet.`,
              });
            }
          } catch (err) {
            ogImageCheck = { url: rendered.ogImage, error: errorMessage(err) };
            findings.push({
              level: "feil",
              field: "og:image",
              message: `Delingsbildet lot seg ikke hente (${errorMessage(err)}).`,
            });
          }
        }
      }

      return text({
        url: finalUrl,
        rendered,
        ogImageCheck,
        findings: sortFindings(findings),
        note: "Dette er den publiserte versjonen. Utkast vises ikke her. Har delingskortet nylig endret seg, kan Facebook/LinkedIn fortsatt vise det gamle — oppdater i Facebook Sharing Debugger / LinkedIn Post Inspector.",
      });
    }
  );

  server.registerTool(
    "update_media_alt",
    {
      title: "Oppdater alt-tekst",
      description:
        "Setter alt-teksten på et bilde i mediebiblioteket. OBS: Media har ikke utkast — endringen gjelder MED EN GANG overalt bildet brukes. Foreslå teksten og få Susannes ja først.",
      inputSchema: z.object({
        mediaId: z.number(),
        alt: z
          .string()
          .min(3)
          .max(200)
          .describe("Hva bildet viser, konkret og kort"),
      }),
      annotations: { destructiveHint: false, idempotentHint: true },
    },
    async ({ mediaId, alt }) => {
      const payload = await getPayload({ config });
      const existing = await payload
        .findByID({ collection: "media", id: mediaId, depth: 0 })
        .catch(() => null);
      if (!existing) return fail(`Fant ikke media #${mediaId}.`);
      try {
        const updated = await payload.update({
          collection: "media",
          id: mediaId,
          depth: 0,
          data: { alt },
        });
        return text({
          id: updated.id,
          filename: updated.filename,
          before: existing.alt ?? "",
          after: updated.alt,
          adminUrl: adminUrl(updated.id, "media"),
        });
      } catch (err) {
        return fail(`Payload avviste endringen: ${errorMessage(err)}`);
      }
    }
  );
}
