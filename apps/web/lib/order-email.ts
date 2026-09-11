import { parseVatRate } from "@/lib/vat";
import type {
  EmailAttachment,
  OrderConfirmationContent,
  OrderConfirmationLegal,
  OrderConfirmationSeller,
} from "@poynt/email";
import type { Payload } from "payload";

/** Grense per Resend: 40 MB totalt per e-post — vi holder god margin. */
const MAX_TOTAL_ATTACHMENT_BYTES = 25 * 1024 * 1024;

/** Per-produkt-data som varelinjene i e-posten trenger utover ordren selv. */
export interface OrderEmailProductMeta {
  /** MVA-sats i prosent fra produktet. */
  vatRate: number;
  /** Absolutt URL til miniatyrbilde, om produktet har hovedbilde. */
  imageUrl?: string;
}

export interface OrderEmailExtras {
  subject?: string;
  content?: OrderConfirmationContent;
  seller?: OrderConfirmationSeller;
  legal?: OrderConfirmationLegal;
  attachments: EmailAttachment[];
  /** Nøkkel: produkt-id som streng. */
  products: Map<string, OrderEmailProductMeta>;
}

function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_URL ?? "").replace(/\/$/, "");
}

/** Gjør en media-URL absolutt; e-postklienter viser ikke relative bilder. */
function absoluteMediaUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  return url.startsWith("http") ? url : `${siteUrl()}${url}`;
}

/**
 * Samler alt ordrebekreftelsen trenger utover selve ordren: admin-redigerte
 * tekster (checkout-settings), selgeropplysninger og juridiske lenker
 * (shop-settings), produktbilder + MVA-sats per produkt, og PDF-vedlegg.
 * Brukes av både Stripe- og Vipps-webhooken før sendOrderConfirmation.
 *
 * Alt her er «best effort»: feil på ett delelement logges og hoppes over —
 * e-posten skal alltid ut.
 */
export async function buildOrderEmailExtras(
  payload: Payload,
  productIds: (number | string)[]
): Promise<OrderEmailExtras> {
  const [settings, shop] = await Promise.all([
    payload.findGlobal({ slug: "checkout-settings" }).catch((error) => {
      console.error("Klarte ikke hente checkout-settings:", error);
      return null;
    }),
    payload.findGlobal({ slug: "shop-settings", depth: 1 }).catch((error) => {
      console.error("Klarte ikke hente shop-settings:", error);
      return null;
    }),
  ]);

  const content: OrderConfirmationContent | undefined = settings
    ? {
        heading: settings.emailHeading ?? undefined,
        intro: settings.emailIntro ?? undefined,
        pdfNote: settings.emailPdfNote ?? undefined,
        footer: settings.emailFooter ?? undefined,
      }
    : undefined;

  const seller: OrderConfirmationSeller | undefined = shop
    ? {
        name: shop.sellerName || "Poynt AS",
        orgNumber: shop.orgNumber ?? undefined,
        vatRegistered: shop.vatRegistered ?? true,
        address: shop.address ?? undefined,
        supportEmail: shop.supportEmail ?? undefined,
        supportPhone: shop.supportPhone ?? undefined,
      }
    : undefined;

  const pageUrl = (page: unknown): string | undefined => {
    if (!page || typeof page !== "object") return undefined;
    const slug = (page as { slug?: string | null }).slug;
    return slug ? `${siteUrl()}/${slug}` : undefined;
  };
  const legal: OrderConfirmationLegal | undefined = shop
    ? {
        withdrawalNotice: shop.withdrawalNotice ?? undefined,
        termsUrl: pageUrl(shop.termsPage),
        privacyUrl: pageUrl(shop.privacyPage),
      }
    : undefined;

  const attachments: EmailAttachment[] = [];
  const products = new Map<string, OrderEmailProductMeta>();
  let totalBytes = 0;

  for (const id of productIds) {
    try {
      const product = await payload.findByID({
        collection: "products",
        id,
        depth: 2,
      });

      const image =
        typeof product.featuredImage === "object"
          ? product.featuredImage
          : null;
      products.set(String(product.id), {
        vatRate: parseVatRate(product.vatRate),
        imageUrl: absoluteMediaUrl(image?.sizes?.thumbnail?.url ?? image?.url),
      });

      if (product.type !== "pdf" || !product.pdfFile) continue;

      const media =
        typeof product.pdfFile === "object"
          ? product.pdfFile
          : await payload.findByID({
              collection: "media",
              id: product.pdfFile,
            });
      // Enkelte store opplastinger (videoer, PDF-er over noen MB) har tomt
      // `url`-felt i databasen, men filen serveres uansett på Payloads
      // standardsti. Uten denne fallbacken gikk ordrebekreftelsen ut uten
      // PDF-vedlegg (ordre #12, sept. 2026).
      const mediaPath =
        media?.url ||
        (media?.filename
          ? `/api/media/file/${encodeURIComponent(media.filename)}`
          : null);
      if (!mediaPath) {
        console.error(`PDF-produkt ${product.name} mangler fil-URL`);
        continue;
      }

      const fileUrl = absoluteMediaUrl(mediaPath) as string;
      const res = await fetch(fileUrl);
      if (!res.ok) {
        console.error(
          `Klarte ikke hente PDF for ${product.name}: ${res.status}`
        );
        continue;
      }

      const buffer = Buffer.from(await res.arrayBuffer());
      if (totalBytes + buffer.length > MAX_TOTAL_ATTACHMENT_BYTES) {
        console.error(
          `Hopper over PDF-vedlegg for ${product.name} — total vedleggsstørrelse ville passert grensen`
        );
        continue;
      }

      totalBytes += buffer.length;
      attachments.push({
        filename: media.filename || `${product.slug}.pdf`,
        content: buffer.toString("base64"),
      });
    } catch (error) {
      console.error(`Feil ved henting av PDF-vedlegg (produkt ${id}):`, error);
    }
  }

  return {
    subject: settings?.emailSubject ?? undefined,
    content,
    seller,
    legal,
    attachments,
    products,
  };
}
