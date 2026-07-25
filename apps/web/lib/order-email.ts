import type { EmailAttachment, OrderConfirmationContent } from "@poynt/email";
import type { Payload } from "payload";

/** Grense per Resend: 40 MB totalt per e-post — vi holder god margin. */
const MAX_TOTAL_ATTACHMENT_BYTES = 25 * 1024 * 1024;

export interface OrderEmailExtras {
  subject?: string;
  content?: OrderConfirmationContent;
  attachments: EmailAttachment[];
}

/**
 * Samler admin-redigerte e-posttekster (checkout-settings-globalen) og
 * PDF-vedlegg for produktene i en ordre. Brukes av både Stripe- og
 * Vipps-webhooken før sendOrderConfirmation.
 *
 * Vedlegg som mangler fil eller sprenger størrelsesgrensen hoppes over med
 * logg — e-posten skal alltid ut, med eller uten vedlegg.
 */
export async function buildOrderEmailExtras(
  payload: Payload,
  productIds: (number | string)[]
): Promise<OrderEmailExtras> {
  const settings = await payload
    .findGlobal({ slug: "checkout-settings" })
    .catch((error) => {
      console.error("Klarte ikke hente checkout-settings:", error);
      return null;
    });

  const content: OrderConfirmationContent | undefined = settings
    ? {
        heading: settings.emailHeading ?? undefined,
        intro: settings.emailIntro ?? undefined,
        pdfNote: settings.emailPdfNote ?? undefined,
        footer: settings.emailFooter ?? undefined,
      }
    : undefined;

  const attachments: EmailAttachment[] = [];
  let totalBytes = 0;

  for (const id of productIds) {
    try {
      const product = await payload.findByID({
        collection: "products",
        id,
        depth: 2,
      });
      if (product.type !== "pdf" || !product.pdfFile) continue;

      const media =
        typeof product.pdfFile === "object"
          ? product.pdfFile
          : await payload.findByID({
              collection: "media",
              id: product.pdfFile,
            });
      if (!media?.url) {
        console.error(`PDF-produkt ${product.name} mangler fil-URL`);
        continue;
      }

      const fileUrl = media.url.startsWith("http")
        ? media.url
        : `${process.env.NEXT_PUBLIC_URL}${media.url}`;
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
    attachments,
  };
}
