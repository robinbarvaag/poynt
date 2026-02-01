import { z } from "zod";

/**
 * Workspace roles
 */
export const workspaceRoles = ["owner", "admin", "member", "client"] as const;

export const workspaceRoleLabels: Record<
  (typeof workspaceRoles)[number],
  string
> = {
  owner: "Eier",
  admin: "Administrator",
  member: "Medlem",
  client: "Kunde (begrenset tilgang)",
};

export const workspaceRoleDescriptions: Record<
  (typeof workspaceRoles)[number],
  string
> = {
  owner: "Full tilgang. Kan slette workspace og administrere fakturering.",
  admin: "Kan redigere innstillinger og invitere medlemmer.",
  member: "Kan bruke alle verktøy og se data.",
  client: "Kan kun se data, ikke redigere innstillinger.",
};

/**
 * Subscription tiers
 */
export const subscriptionTiers = ["free", "pro", "business"] as const;

export const subscriptionTierLabels: Record<
  (typeof subscriptionTiers)[number],
  string
> = {
  free: "Gratis",
  pro: "Pro",
  business: "Business",
};

export const subscriptionTierLimits: Record<
  (typeof subscriptionTiers)[number],
  { maxWorkspaces: number; maxMembersPerWorkspace: number }
> = {
  free: { maxWorkspaces: 1, maxMembersPerWorkspace: 1 },
  pro: { maxWorkspaces: 5, maxMembersPerWorkspace: 5 },
  business: { maxWorkspaces: -1, maxMembersPerWorkspace: -1 }, // -1 = unlimited
};

export const subscriptionPricing: Record<
  (typeof subscriptionTiers)[number],
  { monthly: number; yearly: number }
> = {
  free: { monthly: 0, yearly: 0 },
  pro: { monthly: 199, yearly: 1990 },
  business: { monthly: 499, yearly: 4990 },
};

export const subscriptionFeatures: Record<
  (typeof subscriptionTiers)[number],
  string[]
> = {
  free: [
    "1 bedrift",
    "Alle AI-verktøy",
    "Grunnleggende rapporter",
    "E-post support",
  ],
  pro: [
    "5 bedrifter",
    "Alle AI-verktøy",
    "Avanserte rapporter",
    "Prioritert support",
    "Eksport til PDF",
  ],
  business: [
    "Ubegrenset bedrifter",
    "Alle AI-verktøy",
    "Tilpassede rapporter",
    "Dedikert support",
    "API-tilgang",
    "Team-funksjoner",
  ],
};

/**
 * Workspace schemas
 */
export const createWorkspaceSchema = z.object({
  name: z
    .string()
    .min(2, "Navn må være minst 2 tegn")
    .max(100, "Navn kan maks være 100 tegn"),
  description: z
    .string()
    .max(500, "Beskrivelse kan maks være 500 tegn")
    .optional(),
});

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;

export const updateWorkspaceSchema = z.object({
  id: z.string(),
  name: z
    .string()
    .min(2, "Navn må være minst 2 tegn")
    .max(100, "Navn kan maks være 100 tegn")
    .optional(),
  description: z
    .string()
    .max(500, "Beskrivelse kan maks være 500 tegn")
    .optional(),
  image: z.string().url("Ugyldig bilde-URL").optional().nullable(),
});

export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;

/**
 * Workspace member schemas
 */
export const inviteMemberSchema = z.object({
  workspaceId: z.string(),
  email: z.string().email("Ugyldig e-postadresse"),
  role: z.enum(["admin", "member", "client"]),
});

export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;

export const updateMemberRoleSchema = z.object({
  workspaceId: z.string(),
  userId: z.string(),
  role: z.enum(["admin", "member", "client"]),
});

export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;

export const removeMemberSchema = z.object({
  workspaceId: z.string(),
  userId: z.string(),
});

export type RemoveMemberInput = z.infer<typeof removeMemberSchema>;

/**
 * Accept invitation schema
 */
export const acceptInvitationSchema = z.object({
  token: z.string(),
});

export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>;

/**
 * Switch workspace schema
 */
export const switchWorkspaceSchema = z.object({
  workspaceId: z.string(),
});

export type SwitchWorkspaceInput = z.infer<typeof switchWorkspaceSchema>;

/**
 * Workspace response types
 */
export const workspaceSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  image: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Workspace = z.infer<typeof workspaceSchema>;

export const workspaceMemberSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  userId: z.string(),
  role: z.enum(workspaceRoles),
  createdAt: z.date(),
  user: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    image: z.string().nullable(),
  }),
});

export type WorkspaceMember = z.infer<typeof workspaceMemberSchema>;

export const workspaceWithRoleSchema = workspaceSchema.extend({
  role: z.enum(workspaceRoles),
  memberCount: z.number(),
});

export type WorkspaceWithRole = z.infer<typeof workspaceWithRoleSchema>;

/**
 * Subscription response types
 */
export const subscriptionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  tier: z.enum(subscriptionTiers),
  status: z.enum(["active", "canceled", "past_due", "trialing"]),
  currentPeriodEnd: z.date().nullable(),
  cancelAtPeriodEnd: z.boolean(),
});

export type Subscription = z.infer<typeof subscriptionSchema>;
