import { z } from "zod";

/**
 * Situasjonstyper for avslag
 */
export const situationTypes = [
  "collaboration", // Samarbeid/partnerskap
  "free-work", // Gratis arbeid
  "wrong-fit-client", // Kunde som ikke passer
  "meeting", // Møteforespørsel
  "boundary", // Sette grenser
  "other", // Annet
] as const;

export const situationTypeLabels: Record<
  (typeof situationTypes)[number],
  string
> = {
  collaboration: "Samarbeid eller partnerskap",
  "free-work": "Forespørsel om gratis arbeid",
  "wrong-fit-client": "Kunde som ikke passer",
  meeting: "Møteforespørsel",
  boundary: "Sette grenser med eksisterende kunde",
  other: "Annet",
};

/**
 * Relasjonstyper
 */
export const relationshipTypes = [
  "stranger", // Ukjent
  "acquaintance", // Bekjent
  "existing-client", // Eksisterende kunde
  "friend", // Venn
] as const;

export const relationshipTypeLabels: Record<
  (typeof relationshipTypes)[number],
  string
> = {
  stranger: "Ukjent person",
  acquaintance: "Bekjent",
  "existing-client": "Eksisterende kunde",
  friend: "Venn eller nær bekjent",
};

/**
 * Tone-valg
 */
export const toneTypes = ["formal", "friendly", "warm"] as const;

export const toneTypeLabels: Record<(typeof toneTypes)[number], string> = {
  formal: "Formell og profesjonell",
  friendly: "Vennlig men profesjonell",
  warm: "Varm og personlig",
};

/**
 * Zod schema for avslags-forespørsel
 */
export const declineRequestSchema = z.object({
  situationType: z
    .enum(situationTypes, {
      error: "Velg hva du vil si nei til",
    })
    .optional(),
  relationship: z.enum(relationshipTypes, {
    error: "Velg din relasjon til personen",
  }),
  tone: z.enum(toneTypes, {
    error: "Velg ønsket tone",
  }),
  keepDoorOpen: z.boolean(),
  additionalContext: z
    .string()
    .max(500, "Maks 500 tegn")
    .optional()
    .or(z.literal("")),
  originalMessage: z.string().max(1000).optional().or(z.literal("")),
});

export type DeclineRequest = z.infer<typeof declineRequestSchema>;

/**
 * Response fra AI
 */
export const declineResponseSchema = z.object({
  success: z.boolean(),
  result: z.string().optional(),
  error: z.string().optional(),
});

export type DeclineResponse = z.infer<typeof declineResponseSchema>;
