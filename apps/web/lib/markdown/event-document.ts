import { formatEventLocation, formatEventRange } from "@/lib/events/format";
import { lexicalToMarkdown } from "@/lib/serialize-guide-content";
import type { MarkdownDocument } from "./document-to-markdown";

/** Markdown-versjonen av et event (/eventer/<slug>.md og llms-full.txt). */
export function eventDocument(
  event: {
    id: number;
    title: string;
    slug?: string | null;
    excerpt?: string | null;
    startsAt: string;
    endsAt?: string | null;
    location?: {
      name?: string | null;
      address?: string | null;
      online?: boolean | null;
    } | null;
    description?: unknown;
    program?:
      | { time?: string | null; title: string; description?: string | null }[]
      | null;
    practicalInfo?: unknown;
    faq?: { question?: string | null; answer?: string | null }[] | null;
    registrationMode?: string | null;
    externalUrl?: string | null;
    eventStatus?: string | null;
    updatedAt?: string | null;
    meta?: { description?: string | null; noIndex?: boolean | null } | null;
  },
  ctx: { siteUrl: string }
): MarkdownDocument {
  const url = `${ctx.siteUrl}/eventer/${event.slug}`;
  const when = formatEventRange(event.startsAt, event.endsAt);
  const where = formatEventLocation(event.location);
  const program = event.program ?? [];
  const faq = (event.faq ?? []).filter((f) => f.question && f.answer);

  const registration =
    event.eventStatus === "cancelled"
      ? "**Eventet er avlyst.**"
      : event.registrationMode === "external" && event.externalUrl
        ? `[Kjøp billett](${event.externalUrl})`
        : event.registrationMode === "none"
          ? "Ingen påmelding."
          : `[Meld deg på](${url}#pamelding) (gratis)`;

  return {
    title: event.title,
    description: event.meta?.description || event.excerpt,
    url,
    type: "event",
    updated: event.updatedAt,
    extra: {
      startDate: event.startsAt,
      endDate: event.endsAt,
      location: where,
    },
    noIndex: Boolean(event.meta?.noIndex),
    sections: [
      event.excerpt ?? "",
      [`**Tid:** ${when}`, where ? `**Sted:** ${where}` : ""]
        .filter(Boolean)
        .join("\n"),
      lexicalToMarkdown(event.description),
      program.length
        ? `## Program\n\n${program
            .map(
              (p) =>
                `- ${[p.time, p.title].filter(Boolean).join(" ")}${p.description ? `: ${p.description}` : ""}`
            )
            .join("\n")}`
        : "",
      event.practicalInfo
        ? `## Praktisk info\n\n${lexicalToMarkdown(event.practicalInfo)}`
        : "",
      faq.length
        ? `## Spørsmål og svar\n\n${faq
            .map((f) => `### ${f.question}\n\n${f.answer}`)
            .join("\n\n")}`
        : "",
      registration,
    ].filter(Boolean),
  };
}
