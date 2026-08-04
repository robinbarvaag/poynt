import { convertLexicalToHTML } from "@payloadcms/richtext-lexical/html";
import type { SerializedEditorState } from "@payloadcms/richtext-lexical/lexical";
import { type EmailPreview, renderFormEmailHtml } from "@poynt/email";
import type { Payload } from "payload";

/**
 * Eksempeldata for {{flettefelt}} i forhåndsvisningen — samme navn som
 * skjemafeltene våre bruker. Ukjente felt vises som «(feltnavn)».
 */
const SAMPLE_VALUES: Record<string, string> = {
  navn: "Kari Nordmann",
  name: "Kari Nordmann",
  fornavn: "Kari",
  epost: "kari@eksempel.no",
  email: "kari@eksempel.no",
  "e-post": "kari@eksempel.no",
};

function fillWildcards(text: string): string {
  return text.replace(/\{\{(.+?)\}\}/g, (_, field: string) => {
    const key = field.trim().toLowerCase();
    return SAMPLE_VALUES[key] ?? `(${field.trim()})`;
  });
}

/**
 * Forhåndsvisninger av e-postene partneren selv har satt opp på skjemaene
 * (Skjemaer → «E-poster ved innsending»), rendret i samme Poynt-ramme som de
 * faktisk sendes med (beforeEmail i payload.config). Vises på /admin/epost
 * med lenke rett til skjemaet der teksten redigeres.
 */
export async function buildFormEmailPreviews(
  payload: Payload
): Promise<EmailPreview[]> {
  const forms = await payload
    .find({ collection: "forms", limit: 100, depth: 0 })
    .catch(() => null);
  if (!forms) return [];

  const previews: EmailPreview[] = [];
  for (const form of forms.docs) {
    const emails = (form.emails ?? []) as {
      id?: string;
      emailTo?: string | null;
      subject?: string | null;
      message?: SerializedEditorState | null;
    }[];
    for (const [index, email] of emails.entries()) {
      const subject = email.subject || "(uten emne)";
      const contentHtml = email.message
        ? fillWildcards(convertLexicalToHTML({ data: email.message }))
        : "<p>(tom melding)</p>";
      const toIsSubmitter = (email.emailTo ?? "").includes("{{");
      previews.push({
        key: `form-email-${form.id}-${email.id ?? index}`,
        label:
          emails.length > 1 ? `${form.title} (${index + 1})` : `${form.title}`,
        group: "Skjema-bekreftelser (fra Skjemaer)",
        description: `Sendes automatisk når noen sender inn skjemaet «${form.title}». Teksten redigerer du på selve skjemaet, under «E-poster ved innsending».`,
        subject: fillWildcards(subject),
        to: toIsSubmitter
          ? "Innsenderen"
          : email.emailTo || "Standardavsenderen",
        editHint: {
          label: "Rediger teksten på skjemaet",
          href: `/admin/collections/forms/${form.id}`,
        },
        html: await renderFormEmailHtml({
          preview: fillWildcards(subject),
          contentHtml,
        }),
      });
    }
  }
  return previews;
}
