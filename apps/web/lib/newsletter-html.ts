import { convertLexicalToHTML } from "@payloadcms/richtext-lexical/html";
import type { SerializedEditorState } from "@payloadcms/richtext-lexical/lexical";
import { renderNewsletterHtml } from "@poynt/email";

const siteUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";

/** E-poster trenger absolutte URL-er — gjør relative src/href absolutte. */
export function absolutizeUrls(html: string): string {
  return html.replace(/(src|href)="\/(?!\/)/g, `$1="${siteUrl}/`);
}

/** Lexical-innhold fra Payload → e-postklar HTML (absolutte URL-er). */
export function lexicalToEmailHtml(content: SerializedEditorState): string {
  return absolutizeUrls(convertLexicalToHTML({ data: content }));
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
