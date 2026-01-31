import { z } from "zod";

/**
 * Company size options
 */
export const profileCompanySizes = ["solo", "small", "medium", "large"] as const;
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
  industryId: z.string().nullable(),
  targetAudience: z.string().nullable(),
  audienceType: z.enum(profileAudienceTypes).nullable(),
  companySize: z.enum(profileCompanySizes).nullable(),
  goals: z.array(z.string()).nullable(),
  customContext: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type WorkspaceProfileType = z.infer<typeof workspaceProfileSchema>;

export const updateWorkspaceProfileSchema = z.object({
  industryId: z.string().nullable().optional(),
  targetAudience: z.string().nullable().optional(),
  audienceType: z.enum(profileAudienceTypes).nullable().optional(),
  companySize: z.enum(profileCompanySizes).nullable().optional(),
  goals: z.array(z.string()).nullable().optional(),
  customContext: z.string().nullable().optional(),
});

export type UpdateWorkspaceProfileInput = z.infer<typeof updateWorkspaceProfileSchema>;

/**
 * Tool Result Schemas
 */
export const toolIds = [
  "channel-guide",
  "decline-generator",
  "marketing-plan",
  "yearly-planner",
] as const;
export type ToolId = (typeof toolIds)[number];

export const toolIdLabels: Record<ToolId, string> = {
  "channel-guide": "Kanalguide",
  "decline-generator": "Avslå-generator",
  "marketing-plan": "Markedsplan",
  "yearly-planner": "Årshjul",
};

export const toolResultSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  toolId: z.string(),
  title: z.string().nullable(),
  inputs: z.record(z.unknown()).nullable(),
  result: z.record(z.unknown()).nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ToolResultType = z.infer<typeof toolResultSchema>;

export const createToolResultSchema = z.object({
  toolId: z.string(),
  title: z.string().optional(),
  inputs: z.record(z.unknown()).optional(),
  result: z.record(z.unknown()).optional(),
});

export type CreateToolResultInput = z.infer<typeof createToolResultSchema>;

export const updateToolResultSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  result: z.record(z.unknown()).optional(),
});

export type UpdateToolResultInput = z.infer<typeof updateToolResultSchema>;
