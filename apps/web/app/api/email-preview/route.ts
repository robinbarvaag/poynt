import { fillFormWildcards } from "@/lib/form-email-previews";
import config from "@/payload.config";
import { convertLexicalToHTML } from "@payloadcms/richtext-lexical/html";
import type { SerializedEditorState } from "@payloadcms/richtext-lexical/lexical";
import { renderEmailPreviews, renderFormEmailHtml } from "@poynt/email";
import { type NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";

/**
 * Felles forhåndsvisnings-API for e-poster i admin. Tar imot ulagret innhold
 * rett fra skjemaet og rendrer nøyaktig slik e-posten sendes, med eksempeldata
 * i flettefeltene. Tre varianter:
 * - "template": en mal fra «E-postmaler» (templateKey + subject + body)
 * - "form": en skjema-e-post («E-poster ved innsending» på et skjema)
 * - "order": ordrebekreftelsen (tekstfeltene fra «Kasse og kvittering»)
 * Payload-auth kreves.
 */

const TEMPLATE_KEYS = new Set([
  "contact-confirmation",
  "sale-notification",
  "newsletter-signup-notification",
  "contact-notification",
  "welcome-member",
  "magic-link",
  "password-reset",
]);

interface TemplateBody {
  kind: "template";
  templateKey?: string;
  subject?: string;
  body?: SerializedEditorState;
}

interface FormBody {
  kind: "form";
  subject?: string;
  message?: SerializedEditorState;
}

interface OrderBody {
  kind: "order";
  subject?: string;
  heading?: string;
  intro?: string;
  pdfNote?: string;
  footer?: string;
}

type PreviewRequest = TemplateBody | FormBody | OrderBody;

export async function POST(req: NextRequest) {
  try {
    const payload = await getPayload({ config });
    const { user } = await payload.auth({ headers: req.headers });
    if (!user) {
      return NextResponse.json({ error: "Ikke innlogget" }, { status: 401 });
    }

    const body = (await req.json()) as PreviewRequest;

    if (body.kind === "template") {
      if (!body.templateKey || !TEMPLATE_KEYS.has(body.templateKey)) {
        return NextResponse.json({ error: "Ukjent mal" }, { status: 400 });
      }
      const bodyHtml = body.body
        ? convertLexicalToHTML({ data: body.body })
        : undefined;
      const previews = await renderEmailPreviews({
        templates: {
          [body.templateKey]: {
            subject: body.subject || undefined,
            bodyHtml: bodyHtml?.replace(/<[^>]*>/g, "").trim()
              ? bodyHtml
              : undefined,
          },
        },
      });
      const preview = previews.find((p) => p.key === body.templateKey);
      if (!preview) {
        return NextResponse.json({ error: "Ukjent mal" }, { status: 400 });
      }
      return NextResponse.json({
        html: preview.html,
        subject: preview.subject,
      });
    }

    if (body.kind === "form") {
      const subject = fillFormWildcards(body.subject || "(uten emne)");
      const contentHtml = body.message
        ? fillFormWildcards(convertLexicalToHTML({ data: body.message }))
        : "<p>(tom melding)</p>";
      const html = await renderFormEmailHtml({ preview: subject, contentHtml });
      return NextResponse.json({ html, subject });
    }

    if (body.kind === "order") {
      const previews = await renderEmailPreviews({
        orderSubject: body.subject || undefined,
        orderContent: {
          heading: body.heading || undefined,
          intro: body.intro || undefined,
          pdfNote: body.pdfNote || undefined,
          footer: body.footer || undefined,
        },
      });
      const preview = previews.find((p) => p.key === "order-confirmation");
      return NextResponse.json({
        html: preview?.html,
        subject: preview?.subject,
      });
    }

    return NextResponse.json({ error: "Ugyldig forespørsel" }, { status: 400 });
  } catch (error) {
    console.error("E-post-forhåndsvisning feilet:", error);
    return NextResponse.json(
      { error: "Kunne ikke lage forhåndsvisningen" },
      { status: 500 }
    );
  }
}
