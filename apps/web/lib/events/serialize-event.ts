import { lexicalToMarkdown } from "@/lib/serialize-guide-content";
import type { Event } from "@/payload-types";
import { formatEventLocation, formatEventRange } from "./format";

/**
 * Serialiserer et event til lesbar tekst for AI-kvalitetsvurderingen.
 * [Merkelapper] gjør hull og oppsett synlig for modellen (mangler sted,
 * ingen sluttid, kapasitet uten venteliste …).
 */
export function serializeEventContent(event: Event): string {
  const parts: string[] = [`# ${event.title}`];
  if (event.excerpt) parts.push(`_Kort beskrivelse:_ ${event.excerpt}`);

  parts.push(
    event.startsAt
      ? `[Tid: ${formatEventRange(event.startsAt, event.endsAt)}]${event.endsAt ? "" : " [Mangler sluttid]"}`
      : "[Mangler tidspunkt]"
  );

  const where = formatEventLocation(event.location);
  parts.push(where ? `[Sted: ${where}]` : "[Mangler sted]");

  const image = event.heroImage;
  parts.push(
    image && typeof image === "object"
      ? `[Bilde${image.alt ? `: ${image.alt}` : " – mangler alt-tekst"}]`
      : "[Mangler bilde]"
  );

  const mode = event.registrationMode ?? "internal";
  if (mode === "internal") {
    const details = [
      event.capacity ? `${event.capacity} plasser` : "ingen plassgrense",
      event.capacity
        ? event.waitlistEnabled
          ? "venteliste på"
          : "ingen venteliste"
        : null,
      event.registrationClosesAt ? "har påmeldingsfrist" : "ingen frist",
      event.ticketsEnabled !== false ? "billett med QR-kode" : null,
    ].filter(Boolean);
    parts.push(`[Påmelding her på nettsiden: ${details.join(", ")}]`);
  } else if (mode === "external") {
    parts.push(
      event.externalUrl
        ? "[Påmelding via ekstern lenke]"
        : "[Ekstern påmelding, men lenken mangler]"
    );
  } else {
    parts.push("[Ingen påmelding]");
  }

  if (event.eventStatus && event.eventStatus !== "scheduled") {
    parts.push(
      `[Status: ${event.eventStatus === "cancelled" ? "avlyst" : "utsatt"}]`
    );
  }

  parts.push(
    event.description
      ? lexicalToMarkdown(event.description)
      : "[Ingen beskrivelse av eventet]"
  );

  const program = event.program ?? [];
  parts.push(
    program.length
      ? `## [Program]\n${program
          .map(
            (p) =>
              `- ${[p.time, p.title].filter(Boolean).join(" ")}${p.description ? `: ${p.description}` : ""}`
          )
          .join("\n")}`
      : "[Ingen program]"
  );

  parts.push(
    event.practicalInfo
      ? `## [Praktisk info]\n${lexicalToMarkdown(event.practicalInfo)}`
      : "[Ingen praktisk info]"
  );

  const faq = event.faq ?? [];
  if (faq.length) {
    parts.push(
      `## [FAQ (strukturert data)]\n${faq
        .map((f) => `Sp: ${f.question}\nSv: ${f.answer}`)
        .join("\n")}`
    );
  }

  return parts.filter(Boolean).join("\n\n");
}
