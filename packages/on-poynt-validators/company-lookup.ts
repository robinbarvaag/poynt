import { z } from "zod";
import { profileCompanySizes } from "./workspace-profile";

/**
 * Organisasjonsnummer-input. Tillater mellomrom (f.eks. "123 456 789") og
 * normaliserer til 9 siffer. Brukes når brukeren slår opp en bedrift mot
 * Brønnøysundregistrene for å forhåndsfylle profilen.
 */
export const orgNumberSchema = z
  .string()
  .transform((v) => v.replace(/\s/g, ""))
  .pipe(z.string().regex(/^\d{9}$/, "Organisasjonsnummer skal være 9 siffer"));

export const companyLookupRequestSchema = z.object({
  orgNumber: orgNumberSchema,
});

export type CompanyLookupRequest = z.infer<typeof companyLookupRequestSchema>;

/**
 * Resultatet av et oppslag: rådata fra Brønnøysund + de avledede profil-
 * feltene (bransje + størrelse) som UI-et forhåndsfyller. Alt utenom navn er
 * nullbart — registeret er ikke alltid komplett, og bransje-matchen kan slå feil.
 */
export const companyLookupResultSchema = z.object({
  orgNumber: z.string(),
  companyName: z.string(),
  website: z.string().nullable(),
  employeeCount: z.number().nullable(),
  naceCode: z.string().nullable(),
  naceDescription: z.string().nullable(),
  // Avledede profil-felter (klare til upsert):
  companySize: z.enum(profileCompanySizes).nullable(),
  industryId: z.string().nullable(),
  industryName: z.string().nullable(),
});

export type CompanyLookupResult = z.infer<typeof companyLookupResultSchema>;
