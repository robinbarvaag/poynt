import { convertLexicalToHTML } from "@payloadcms/richtext-lexical/html";
import type { SerializedEditorState } from "@payloadcms/richtext-lexical/lexical";
import type { EmailTemplateOverride } from "@poynt/email";

/** Har richtext-HTML-en faktisk innhold (ikke bare tomme avsnitt)? */
export function hasRichTextContent(html: string | undefined): html is string {
  return Boolean(html?.replace(/<[^>]*>/g, "").trim());
}

/**
 * Slår opp en admin-redigert e-postmal («E-postmaler» i Payload) for
 * send-funksjonene i @poynt/email. Registreres som template-provider ved
 * app-oppstart (instrumentation.ts). Mangler malen eller er den tom, returneres
 * null og standardteksten i koden brukes.
 */
export async function fetchEmailTemplateOverride(
  key: string
): Promise<EmailTemplateOverride | null> {
  const { getPayload } = await import("payload");
  const { default: config } = await import("@/payload.config");
  const payload = await getPayload({ config });

  const result = await payload.find({
    collection: "email-templates",
    where: { templateKey: { equals: key } },
    limit: 1,
    depth: 0,
  });
  const doc = result.docs[0];
  if (!doc) return null;

  const bodyHtml = doc.body
    ? convertLexicalToHTML({ data: doc.body as SerializedEditorState })
    : undefined;

  const override: EmailTemplateOverride = {
    subject: doc.subject || undefined,
    bodyHtml: hasRichTextContent(bodyHtml) ? bodyHtml : undefined,
  };
  return override.subject || override.bodyHtml ? override : null;
}
