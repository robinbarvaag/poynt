import {
  type LexicalLinkFields,
  lexicalLinkHref,
} from "@/lib/lexical/link-fields";
import { toRelativeMediaUrl } from "@/lib/media-url";
import { tagNewsletterUrl } from "@/lib/share-link";
import {
  type HTMLConvertersFunction,
  convertLexicalToHTML,
} from "@payloadcms/richtext-lexical/html";
import type { SerializedEditorState } from "@payloadcms/richtext-lexical/lexical";
import { renderNewsletterHtml } from "@poynt/email";
import { EMAIL_CONTENT_WIDTH } from "@poynt/email/rich-text-styles";
import type { CollectionSlug, Payload } from "payload";
import { sanitizeUrl } from "payload/shared";

const siteUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";

/** E-poster trenger absolutte URL-er — gjør relative src/href absolutte. */
export function absolutizeUrls(html: string): string {
  return html.replace(/(src|href)="\/(?!\/)/g, `$1="${siteUrl}/`);
}

function escapeAttribute(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

interface EmailImageSize {
  url?: string | null;
  width?: number | null;
  height?: number | null;
}

/** Det vi trenger fra et Payload-media for å sette det inn i en e-post. */
export interface EmailMedia extends EmailImageSize {
  alt?: string | null;
  sizes?: Record<string, EmailImageSize | null | undefined> | null;
}

/**
 * Originaler opp til denne bredden sendes som de er. Større originaler er
 * typisk mobilbilder på mange MB — de skal aldri lastes i en e-post.
 */
const EMAIL_MAX_ORIGINAL_WIDTH = 1600;

/**
 * Velg bildefila e-posten skal peke på. Rekkefølge:
 * 1. `tablet` (1024 px bred, samme format som originalen) — skarp også på
 *    retina-skjermer i et 494 px bredt felt, og jpeg/png vises i alle klienter.
 * 2. Originalen når den er liten nok (da finnes ingen `tablet`-variant).
 * 3. `large` (webp, maks 2400 px) — vises ikke i eldre Outlook, men er langt
 *    bedre enn en diger original.
 * 4. Originalen, uansett størrelse.
 */
export function pickEmailImage(media: EmailMedia): EmailImageSize | null {
  const tablet = media.sizes?.tablet;
  if (tablet?.url) return tablet;
  if (!media.url) return media.sizes?.large?.url ? media.sizes.large : null;
  if (media.width && media.width <= EMAIL_MAX_ORIGINAL_WIDTH) return media;
  return media.sizes?.large?.url ? media.sizes.large : media;
}

/**
 * `<img>` for e-post. Payloads standard-konverter lager `<picture>` med
 * originalfila og originalens pikselmål som width/height — i en e-post blir
 * det et bilde på flere tusen piksler som sprenger hele oppsettet. Her får
 * bildet en fast visningsbredde (attributt for Outlook, `max-width` for
 * resten) og krymper med skjermen på mobil.
 */
export function emailImageHtml(
  media: EmailMedia,
  altOverride?: string
): string {
  const source = pickEmailImage(media);
  if (!source?.url) return "";

  const naturalWidth = source.width ?? media.width ?? EMAIL_CONTENT_WIDTH;
  const width = Math.min(EMAIL_CONTENT_WIDTH, naturalWidth);
  const ratio =
    source.width && source.height ? source.height / source.width : null;
  const height = ratio ? ` height="${Math.round(width * ratio)}"` : "";
  const alt = escapeAttribute(altOverride || media.alt || "");
  const src = escapeAttribute(sanitizeUrl(toRelativeMediaUrl(source.url)));

  return `<img alt="${alt}" src="${src}" width="${width}"${height} style="display:block;width:100%;max-width:${width}px;height:auto;border:0;" />`;
}

/**
 * Konvertere for e-post: bilder i e-postvennlig størrelse, og lenketypene fra
 * `link-feature.ts` (side på nettstedet, forsiden, e-post, telefon) — Payloads
 * standard-konverter kjenner bare nettadresser og ga døde lenker for resten.
 */
const emailConverters: HTMLConvertersFunction = ({ defaultConverters }) => ({
  ...defaultConverters,
  upload: (args) => {
    // Typen er unionen av alle collections — vi bryr oss bare om media-feltene.
    const media = args.node.value as
      | (EmailMedia & { mimeType?: string | null })
      | number
      | string
      | null;
    if (
      media &&
      typeof media === "object" &&
      media.mimeType?.startsWith("image")
    ) {
      const alt = (args.node.fields as { alt?: string } | undefined)?.alt;
      return emailImageHtml(media, alt);
    }
    const fallback = defaultConverters.upload;
    return typeof fallback === "function" ? fallback(args) : "";
  },
  link: ({ node, nodesToHTML, providedStyleTag }) => {
    const children = nodesToHTML({ nodes: node.children }).join("");
    const href = lexicalLinkHref(node.fields as LexicalLinkFields, { siteUrl });
    // Kan ikke lenka løses (slettet side, tomt felt): ren tekst framfor en
    // død lenke i innboksen til alle abonnentene.
    if (!href) return children;
    return `<a${providedStyleTag} href="${escapeAttribute(sanitizeUrl(href))}">${children}</a>`;
  },
});

interface LooseNode {
  type?: string;
  relationTo?: string;
  value?: unknown;
  fields?: {
    linkType?: string;
    doc?: { relationTo?: string; value?: unknown };
  };
  children?: LooseNode[];
}

/**
 * Hent dokumentene bak bilder og interne lenker i ULAGRET innhold.
 * Skjemaet i admin har bare id-ene; uten dette viste forhåndsvisningen
 * verken bilder eller riktige lenker. (Lagret innhold hentet med `depth`
 * er alt fylt ut og går uendret gjennom.) Endrer `content` på stedet.
 */
export async function populateNewsletterContent(
  payload: Payload,
  content: SerializedEditorState
): Promise<void> {
  // Hvert treff: hvor id-en står, og hvilken collection den peker inn i.
  const refs: { holder: { value?: unknown }; collection: string }[] = [];
  const walk = (nodes: LooseNode[] | undefined) => {
    for (const node of nodes ?? []) {
      if (node.type === "upload" && node.relationTo) {
        refs.push({ holder: node, collection: node.relationTo });
      }
      const doc = node.fields?.doc;
      if (node.type === "link" && doc?.relationTo) {
        refs.push({ holder: doc, collection: doc.relationTo });
      }
      walk(node.children);
    }
  };
  walk(content.root?.children as LooseNode[] | undefined);

  const pending = refs.filter(
    ({ holder }) =>
      typeof holder.value === "string" || typeof holder.value === "number"
  );
  const collections = new Set(pending.map((ref) => ref.collection));
  for (const collection of collections) {
    const wanted = pending.filter((ref) => ref.collection === collection);
    const found = await payload.find({
      collection: collection as CollectionSlug,
      where: { id: { in: wanted.map((ref) => ref.holder.value) } },
      depth: 0,
      pagination: false,
    });
    const byId = new Map(found.docs.map((doc) => [String(doc.id), doc]));
    for (const ref of wanted) {
      const doc = byId.get(String(ref.holder.value));
      if (doc) ref.holder.value = doc;
    }
  }
}

function unescapeAttribute(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

/**
 * UTM-merk lenkene til eget nettsted (se `tagNewsletterUrl`). Dette er
 * målingen vi har av nyhetsbrevet: antall besøk per utsending, ikke hvem som
 * åpnet eller klikket. Åpnings-/klikksporing i Resend er bevisst AV: piksler
 * og omskrevne lenker krever et eget samtykke til måling (ekomloven § 3-15),
 * og det har vi ikke samlet inn.
 */
export function tagNewsletterLinks(
  html: string,
  options: { site?: string; now?: Date } = {}
): string {
  const site = options.site ?? siteUrl;
  return html.replace(/href="([^"]*)"/g, (match, raw: string) => {
    const href = unescapeAttribute(raw);
    const tagged = tagNewsletterUrl(href, site, options.now);
    return tagged === href ? match : `href="${escapeAttribute(tagged)}"`;
  });
}

/**
 * Lexical-innhold fra Payload → e-postklar HTML (absolutte URL-er, lenker til
 * eget nettsted UTM-merket).
 */
export function lexicalToEmailHtml(content: SerializedEditorState): string {
  return tagNewsletterLinks(
    absolutizeUrls(
      convertLexicalToHTML({ data: content, converters: emailConverters })
    )
  );
}

/**
 * Hele nyhetsbrevet som ferdig HTML i Poynt-ramma. Delt av utsendingen
 * (/api/newsletter-broadcast) og «Forhåndsvisning»-fanen på dokumentet, slik
 * at forhåndsvisningen alltid viser nøyaktig det som sendes.
 */
export async function buildNewsletterHtml(params: {
  content: SerializedEditorState;
  preview: string;
  /** Avmeldingslenka — utsendingen setter Resend-plassholderen, preview «#». */
  unsubscribeUrl?: string;
}): Promise<string> {
  return renderNewsletterHtml({
    preview: params.preview,
    contentHtml: lexicalToEmailHtml(params.content),
    unsubscribeUrl: params.unsubscribeUrl ?? "#",
  });
}
