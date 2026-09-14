import config from "@/payload.config";
import type { McpServer } from "@modelcontextprotocol/server";
import { getPayload } from "payload";
import { z } from "zod";
import { SEAT_STATUSES } from "../events/capacity";
import { lexicalToMarkdown, markdownToLexical } from "./lexical-markdown";
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
 * MCP-verktøy for eventer: list, les og opprett som UTKAST. Påmeldinger og
 * publisering håndteres alltid i admin. Pris/betaling er bevisst ikke med her.
 */

const isoDate = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), "Ugyldig dato")
  .describe("ISO-dato med tidssone, f.eks. «2026-10-15T18:00:00+02:00»");

export const createEventInput = z.object({
  title: z.string().min(1),
  excerpt: z
    .string()
    .min(1)
    .describe("Én–to setninger: hva er det, og hvorfor bør man komme?"),
  startsAt: isoDate,
  endsAt: isoDate.optional(),
  doorsOpenAt: isoDate.optional(),
  location: z
    .object({
      name: z.string().optional(),
      address: z.string().optional(),
      mapUrl: z.string().url().optional(),
      online: z.boolean().optional(),
    })
    .optional(),
  description: z
    .string()
    .optional()
    .describe("«Om eventet» som markdown — skriv som en invitasjon"),
  program: z
    .array(
      z.object({
        time: z.string().optional().describe("F.eks. «18:00»"),
        title: z.string().min(1),
        description: z.string().optional(),
      })
    )
    .optional(),
  practicalInfo: z
    .string()
    .optional()
    .describe("Parkering, mat, tilgjengelighet som markdown"),
  faq: z
    .array(z.object({ question: z.string().min(1), answer: z.string().min(1) }))
    .optional(),
  registrationMode: z
    .enum(["internal", "external", "none"])
    .default("internal")
    .describe(
      "internal = påmelding på nettsiden, external = lenke til annet billettsystem"
    ),
  externalUrl: z.string().url().optional(),
  capacity: z
    .number()
    .int()
    .min(0)
    .optional()
    .describe("Antall plasser. Utelat for ingen grense — ikke gjett"),
  waitlistEnabled: z.boolean().default(true),
  maxGuests: z
    .number()
    .int()
    .min(0)
    .max(10)
    .optional()
    .describe(
      "Hvor mange hver kan ta med (0/utelatt = hver melder seg på selv)"
    ),
  extraQuestions: z
    .array(
      z.object({
        label: z.string().min(1),
        type: z
          .enum(["text", "textarea", "checkbox", "select"])
          .default("text"),
        options: z.array(z.string()).optional(),
        required: z.boolean().default(false),
      })
    )
    .optional()
    .describe(
      "Bare det dere faktisk trenger. Allergier er helseopplysninger: frivillig, og bare når det serveres mat"
    ),
  confirmationMessage: z.string().optional(),
  heroImageId: z.number().optional().describe("Media-ID fra search_media"),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/, "Kun små bokstaver, tall og bindestrek")
    .optional(),
});

export type CreateEventInput = z.infer<typeof createEventInput>;

/** Opprett eventet som utkast. Returnerer feilmelding som streng. */
export async function createEventDraft(
  payload: Payload,
  input: CreateEventInput
) {
  if (input.slug) {
    const existing = await payload.find({
      collection: "events",
      where: { slug: { equals: input.slug } },
      draft: true,
      depth: 0,
      limit: 1,
    });
    if (existing.docs[0]) {
      return `Slug «${input.slug}» er allerede i bruk (event #${existing.docs[0].id}).`;
    }
  }
  if (input.endsAt && Date.parse(input.endsAt) <= Date.parse(input.startsAt)) {
    return "Sluttid må være etter starttid.";
  }

  try {
    return await payload.create({
      collection: "events",
      draft: true,
      depth: 0,
      data: {
        _status: "draft",
        title: input.title,
        slug: input.slug ?? "",
        excerpt: input.excerpt,
        startsAt: new Date(input.startsAt).toISOString(),
        endsAt: input.endsAt ? new Date(input.endsAt).toISOString() : undefined,
        doorsOpenAt: input.doorsOpenAt
          ? new Date(input.doorsOpenAt).toISOString()
          : undefined,
        location: input.location,
        description: input.description
          ? (markdownToLexical(input.description) as never)
          : undefined,
        program: input.program,
        practicalInfo: input.practicalInfo
          ? (markdownToLexical(input.practicalInfo) as never)
          : undefined,
        faq: input.faq,
        registrationMode: input.registrationMode,
        externalUrl: input.externalUrl,
        capacity: input.capacity,
        waitlistEnabled: input.waitlistEnabled,
        maxGuests: input.maxGuests,
        extraQuestions: input.extraQuestions,
        confirmationMessage: input.confirmationMessage,
        heroImage: input.heroImageId,
        eventStatus: "scheduled",
      },
    });
  } catch (err) {
    return `Payload avviste eventet: ${errorMessage(err)}`;
  }
}

async function findEvent(payload: Payload, idOrSlug: string) {
  const id = isNumericId(idOrSlug);
  if (id !== null) {
    return payload
      .findByID({ collection: "events", id, draft: true, depth: 0 })
      .catch(() => null);
  }
  const res = await payload.find({
    collection: "events",
    where: { slug: { equals: idOrSlug } },
    draft: true,
    depth: 0,
    limit: 1,
  });
  return res.docs[0] ?? null;
}

export function registerEventTools(server: McpServer) {
  server.registerTool(
    "list_events",
    {
      title: "List eventer",
      description:
        "Alle eventer (også utkast) med dato, status, påmelding og antall plasser tatt.",
      inputSchema: z.object({}),
      annotations: { readOnlyHint: true },
    },
    async () => {
      const payload = await getPayload({ config });
      const res = await payload.find({
        collection: "events",
        draft: true,
        depth: 0,
        limit: 200,
        sort: "-startsAt",
      });
      const rows = await Promise.all(
        res.docs.map(async (event) => {
          const { totalDocs: seatsTaken } = await payload.count({
            collection: "event-registrations",
            where: {
              event: { equals: event.id },
              status: { in: SEAT_STATUSES },
            },
          });
          return {
            id: event.id,
            title: event.title,
            slug: event.slug,
            startsAt: event.startsAt,
            status: event._status,
            eventStatus: event.eventStatus,
            registrationMode: event.registrationMode,
            capacity: event.capacity ?? null,
            seatsTaken,
            url: `${siteUrl}/eventer/${event.slug}`,
            adminUrl: adminUrl(event.id, "events"),
          };
        })
      );
      return text(rows);
    }
  );

  server.registerTool(
    "get_event",
    {
      title: "Hent event",
      description:
        "Hele eventet (siste utkast): tider, sted, tekster som markdown, program, FAQ og påmeldingsoppsett. Ingen personopplysninger om påmeldte.",
      inputSchema: z.object({ idOrSlug: z.string() }),
      annotations: { readOnlyHint: true },
    },
    async ({ idOrSlug }) => {
      const payload = await getPayload({ config });
      const event = await findEvent(payload, idOrSlug);
      if (!event) return fail(`Fant ikke eventet «${idOrSlug}».`);
      return text({
        id: event.id,
        title: event.title,
        slug: event.slug,
        status: event._status,
        eventStatus: event.eventStatus,
        excerpt: event.excerpt,
        startsAt: event.startsAt,
        endsAt: event.endsAt ?? null,
        doorsOpenAt: event.doorsOpenAt ?? null,
        location: event.location ?? null,
        description: event.description
          ? lexicalToMarkdown(event.description)
          : "",
        program: event.program ?? [],
        practicalInfo: event.practicalInfo
          ? lexicalToMarkdown(event.practicalInfo)
          : "",
        faq: event.faq ?? [],
        registrationMode: event.registrationMode,
        capacity: event.capacity ?? null,
        waitlistEnabled: event.waitlistEnabled ?? false,
        maxGuests: event.maxGuests ?? 0,
        priceKr: event.priceKr ?? null,
        extraQuestions: (event.extraQuestions ?? []).map((q) => ({
          label: q.label,
          type: q.type,
          options: q.options ?? undefined,
          required: q.required ?? false,
        })),
        confirmationMessage: event.confirmationMessage ?? null,
        heroImageId: relationId(event.heroImage) ?? null,
        url: `${siteUrl}/eventer/${event.slug}`,
        adminUrl: adminUrl(event.id, "events"),
      });
    }
  );

  server.registerTool(
    "create_event_draft",
    {
      title: "Opprett event (utkast)",
      description:
        "Oppretter et event som UTKAST. Susanne ser over, legger inn pris hvis det skal koste noe, og publiserer i admin. Ikke finn på sted, antall plasser, tider eller program — spør, eller utelat.",
      inputSchema: createEventInput,
      annotations: { destructiveHint: false },
    },
    async (input) => {
      const payload = await getPayload({ config });
      const result = await createEventDraft(payload, input);
      if (typeof result === "string") return fail(result);
      return text({
        id: result.id,
        title: result.title,
        slug: result.slug,
        status: "utkast",
        adminUrl: adminUrl(result.id, "events"),
        missing: [
          !input.heroImageId && "bilde",
          !input.location?.name && !input.location?.online && "sted",
          !input.endsAt && "sluttid",
          input.registrationMode === "internal" &&
            input.capacity === undefined &&
            "antall plasser (tomt = ingen grense)",
        ].filter(Boolean),
        next: "Send admin-lenken til Susanne. Eventet er et utkast til hun publiserer det. Skal det koste noe, legger hun inn pris under «Påmelding».",
      });
    }
  );
}
