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
 * Medlemskapsnivå — de EKTE nivåene som selges, samme enum som
 * `planner_subscription.tier`. «agency» (Byrå) er toppnivået for byrå og
 * konsulenter som styrer mange kunder. Dette erstatter den gamle fiktive
 * free/pro/business-stigen (oppdiktede priser) — det finnes nå én sannhet.
 */
export const membershipTiers = [
  "none",
  "community",
  "community_ai",
  "agency",
] as const;

export type MembershipTier = (typeof membershipTiers)[number];

/** Nivåene man faktisk kan kjøpe/sammenligne (`none` = ikke medlem ennå). */
export const paidMembershipTiers = [
  "community",
  "community_ai",
  "agency",
] as const;

export const membershipTierLabels: Record<MembershipTier, string> = {
  none: "Ingen",
  community: "Community",
  community_ai: "Community AI",
  agency: "Byrå",
};

/** Ett-linjes pitch per nivå (vises under tittelen i sammenligningskortene). */
export const membershipTierTaglines: Record<MembershipTier, string> = {
  none: "",
  community: "Kom i gang med fagstoff og fellesskap",
  community_ai: "Få AI-verktøyene som gjør jobben",
  agency: "Skaler til alle kundene dine",
};

/**
 * Grenser per nivå. `maxWorkspaces` = hvor mange bedrifter (kunder) du kan
 * styre samtidig; -1 = ubegrenset. `none` er gated ute av On Poynt uansett,
 * men får 1 som trygg fallback (f.eks. ved sync-forsinkelse eller lokal test).
 */
export const membershipTierLimits: Record<
  MembershipTier,
  { maxWorkspaces: number; maxMembersPerWorkspace: number }
> = {
  none: { maxWorkspaces: 1, maxMembersPerWorkspace: 1 },
  community: { maxWorkspaces: 1, maxMembersPerWorkspace: 1 },
  community_ai: { maxWorkspaces: 5, maxMembersPerWorkspace: 5 },
  agency: { maxWorkspaces: -1, maxMembersPerWorkspace: -1 },
};

/**
 * Nivåene som låser opp AI-verktøyene. «agency» (Byrå) arver alt fra
 * Community AI — all AI-gating skal sjekke begge via hasAiTools, aldri
 * `tier === "community_ai"` direkte.
 */
export const AI_TIERS = [
  "community_ai",
  "agency",
] as const satisfies readonly MembershipTier[];

export function hasAiTools(tier: MembershipTier): boolean {
  return (AI_TIERS as readonly MembershipTier[]).includes(tier);
}

/** Kort verdiløfte per nivå — brukt i sammenlignings-/oppgraderingsvisningen. */
export const membershipTierFeatures: Record<MembershipTier, string[]> = {
  none: [],
  community: [
    "1 bedrift",
    "Alle artikler og guider",
    "Tilgang til fellesskapet",
  ],
  community_ai: [
    "Alt i Community",
    "Alle AI-verktøy – kanalveileder, markedsplan, årshjul og mer",
    "Opptil 5 bedrifter",
  ],
  agency: [
    "Alt i Community AI",
    "Ubegrenset antall bedrifter",
    "For byrå og konsulenter som styrer flere kunder",
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
  tier: z.enum(membershipTiers),
  status: z.enum(["active", "inactive", "canceled", "past_due"]),
  currentPeriodEnd: z.date().nullable(),
  cancelAtPeriodEnd: z.boolean(),
});

export type Subscription = z.infer<typeof subscriptionSchema>;
