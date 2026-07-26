import { z } from "zod";
import { brandBriefSchema } from "./brand-brief";
import { brandIdentitySchema } from "./brand-identity";
import { mainGoalTypes, strengthTypes, weeklyTimeTypes } from "./channel-guide";

/**
 * Company size options
 */
export const profileCompanySizes = [
  "solo",
  "small",
  "medium",
  "large",
] as const;
export type ProfileCompanySize = (typeof profileCompanySizes)[number];

export const profileCompanySizeLabels: Record<ProfileCompanySize, string> = {
  solo: "Enmannsbedrift",
  small: "2-10 ansatte",
  medium: "11-50 ansatte",
  large: "50+ ansatte",
};

/**
 * Audience type options (B2B, B2C, or both)
 */
export const profileAudienceTypes = ["b2b", "b2c", "both"] as const;
export type ProfileAudienceType = (typeof profileAudienceTypes)[number];

export const profileAudienceTypeLabels: Record<ProfileAudienceType, string> = {
  b2b: "Bedrifter (B2B)",
  b2c: "Forbrukere (B2C)",
  both: "Begge deler",
};

/**
 * Workspace Profile Schemas
 */
export const workspaceProfileSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  // Organisasjonsnummer — lar oss slå opp bedriften på nytt mot Brønnøysund.
  orgNumber: z.string().nullable(),
  industryId: z.string().nullable(),
  targetAudience: z.string().nullable(),
  audienceType: z.enum(profileAudienceTypes).nullable(),
  companySize: z.enum(profileCompanySizes).nullable(),
  goals: z.array(z.string()).nullable(),
  // Varige verktøy-input («felles hjerne») — deles på tvers av verktøyene.
  mainGoal: z.enum(mainGoalTypes).nullable(),
  weeklyTime: z.enum(weeklyTimeTypes).nullable(),
  strengths: z.enum(strengthTypes).nullable(),
  customContext: z.string().nullable(),
  // «Felles hjerne 2.0» — rik merkevarebrief som injiseres i alle verktøyene.
  brandBrief: brandBriefSchema.nullable(),
  // Visuell merkevare-identitet («merkevare-boka»).
  brandIdentity: brandIdentitySchema.nullable(),
  // Bedriftens podkast-RSS-feed — lar «Podcast til innhold» forhåndsfylle feltet.
  podcastFeedUrl: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type WorkspaceProfileType = z.infer<typeof workspaceProfileSchema>;

export const updateWorkspaceProfileSchema = z.object({
  orgNumber: z.string().nullable().optional(),
  industryId: z.string().nullable().optional(),
  targetAudience: z.string().nullable().optional(),
  audienceType: z.enum(profileAudienceTypes).nullable().optional(),
  companySize: z.enum(profileCompanySizes).nullable().optional(),
  goals: z.array(z.string()).nullable().optional(),
  mainGoal: z.enum(mainGoalTypes).nullable().optional(),
  weeklyTime: z.enum(weeklyTimeTypes).nullable().optional(),
  strengths: z.enum(strengthTypes).nullable().optional(),
  customContext: z.string().nullable().optional(),
  brandBrief: brandBriefSchema.nullable().optional(),
  brandIdentity: brandIdentitySchema.nullable().optional(),
  podcastFeedUrl: z.string().nullable().optional(),
});

export type UpdateWorkspaceProfileInput = z.infer<
  typeof updateWorkspaceProfileSchema
>;

/**
 * Tool Result Schemas
 */
export const toolIds = [
  "channel-guide",
  "decline-generator",
  "marketing-plan",
  "yearly-planner",
  "podcast-to-content",
  "inquiry-reply",
] as const;
export type ToolId = (typeof toolIds)[number];

export const toolIdLabels: Record<ToolId, string> = {
  "channel-guide": "Kanalguide",
  "decline-generator": "Avslå-generator",
  "marketing-plan": "Markedsplan",
  "yearly-planner": "Årshjul",
  "podcast-to-content": "Podcast til innhold",
  "inquiry-reply": "Svar på henvendelser",
};

export const toolResultSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  toolId: z.string(),
  title: z.string().nullable(),
  inputs: z.record(z.string(), z.unknown()).nullable(),
  result: z.record(z.string(), z.unknown()).nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ToolResultType = z.infer<typeof toolResultSchema>;

export const createToolResultSchema = z.object({
  toolId: z.string(),
  title: z.string().optional(),
  inputs: z.record(z.string(), z.unknown()).optional(),
  result: z.record(z.string(), z.unknown()).optional(),
});

export type CreateToolResultInput = z.infer<typeof createToolResultSchema>;

export const updateToolResultSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  result: z.record(z.string(), z.unknown()).optional(),
});

export type UpdateToolResultInput = z.infer<typeof updateToolResultSchema>;
