import { db } from "@poynt/planner-db";
import {
  plannerSubscription,
  plannerUserPreferences,
  plannerWorkspace,
  plannerWorkspaceInvitation,
  plannerWorkspaceMember,
} from "@poynt/planner-db/schema";
import {
  acceptInvitationSchema,
  createWorkspaceSchema,
  inviteMemberSchema,
  removeMemberSchema,
  subscriptionTierLimits,
  switchWorkspaceSchema,
  updateMemberRoleSchema,
  updateWorkspaceSchema,
} from "@poynt/planner-validators";
import { generateSlug as generateSlugBase } from "@poynt/utils/generate-slug";
import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

// Define tier type locally since we need it for the lookup
type TierKey = "free" | "pro" | "business";

/**
 * Helper to generate a URL-friendly slug from a workspace name (max 50 chars).
 */
function generateSlug(name: string): string {
  return generateSlugBase(name, { maxLength: 50 });
}

/**
 * Helper to check if user has required role in workspace
 */
async function checkWorkspaceAccess(
  userId: string,
  workspaceId: string,
  requiredRoles: ("owner" | "admin" | "member" | "client")[]
) {
  const member = await db.query.plannerWorkspaceMember.findFirst({
    where: and(
      eq(plannerWorkspaceMember.userId, userId),
      eq(plannerWorkspaceMember.workspaceId, workspaceId)
    ),
  });

  if (!member) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Du har ikke tilgang til denne bedriften",
    });
  }

  if (!requiredRoles.includes(member.role)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Du har ikke tilstrekkelige rettigheter for denne handlingen",
    });
  }

  return member;
}

/**
 * Helper to get user's subscription tier
 */
async function getUserSubscription(userId: string): Promise<TierKey> {
  const sub = await db.query.plannerSubscription.findFirst({
    where: eq(plannerSubscription.userId, userId),
  });

  return (sub?.tier as TierKey) ?? "free";
}

/**
 * Helper to count user's owned workspaces
 */
async function countUserWorkspaces(userId: string) {
  const members = await db.query.plannerWorkspaceMember.findMany({
    where: and(
      eq(plannerWorkspaceMember.userId, userId),
      eq(plannerWorkspaceMember.role, "owner")
    ),
  });

  return members.length;
}

export const workspaceRouter = router({
  /**
   * Create a new workspace
   */
  create: protectedProcedure
    .input(createWorkspaceSchema)
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.userId;

      // Check subscription limits
      const tier = await getUserSubscription(userId);
      const currentCount = await countUserWorkspaces(userId);
      const limit = subscriptionTierLimits[tier].maxWorkspaces;

      if (limit !== -1 && currentCount >= limit) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `Du har nådd grensen på ${limit} bedrift(er) for din plan. Oppgrader for å opprette flere.`,
        });
      }

      // Generate unique slug
      let slug = generateSlug(input.name);
      const slugExists = await db.query.plannerWorkspace.findFirst({
        where: eq(plannerWorkspace.slug, slug),
      });

      if (slugExists) {
        slug = `${slug}-${nanoid(6)}`;
      }

      // Create workspace
      const workspaceId = nanoid();
      const [newWorkspace] = await db
        .insert(plannerWorkspace)
        .values({
          id: workspaceId,
          name: input.name,
          slug,
          description: input.description,
        })
        .returning();

      // Add creator as owner
      await db.insert(plannerWorkspaceMember).values({
        id: nanoid(),
        workspaceId: workspaceId,
        userId,
        role: "owner",
      });

      // Set as active workspace if user has no active workspace
      const prefs = await db.query.plannerUserPreferences.findFirst({
        where: eq(plannerUserPreferences.userId, userId),
      });

      if (!prefs) {
        await db.insert(plannerUserPreferences).values({
          id: nanoid(),
          userId,
          activeWorkspaceId: workspaceId,
        });
      } else if (!prefs.activeWorkspaceId) {
        await db
          .update(plannerUserPreferences)
          .set({ activeWorkspaceId: workspaceId })
          .where(eq(plannerUserPreferences.userId, userId));
      }

      return newWorkspace;
    }),

  /**
   * List user's workspaces
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.userId;

    const memberships = await db.query.plannerWorkspaceMember.findMany({
      where: eq(plannerWorkspaceMember.userId, userId),
      with: {
        workspace: true,
      },
      orderBy: desc(plannerWorkspaceMember.createdAt),
    });

    return memberships.map((m) => ({
      ...m.workspace,
      role: m.role,
    }));
  }),

  /**
   * Get a workspace by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const userId = ctx.userId;

      const member = await checkWorkspaceAccess(userId, input.id, [
        "owner",
        "admin",
        "member",
        "client",
      ]);

      const ws = await db.query.plannerWorkspace.findFirst({
        where: eq(plannerWorkspace.id, input.id),
      });

      if (!ws) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Bedriften ble ikke funnet",
        });
      }

      return {
        ...ws,
        role: member.role,
      };
    }),

  /**
   * Update a workspace
   */
  update: protectedProcedure
    .input(updateWorkspaceSchema)
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.userId;

      await checkWorkspaceAccess(userId, input.id, ["owner", "admin"]);

      const [updated] = await db
        .update(plannerWorkspace)
        .set({
          name: input.name,
          description: input.description,
          image: input.image,
        })
        .where(eq(plannerWorkspace.id, input.id))
        .returning();

      return updated;
    }),

  /**
   * Delete a workspace
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.userId;

      await checkWorkspaceAccess(userId, input.id, ["owner"]);

      await db
        .delete(plannerWorkspace)
        .where(eq(plannerWorkspace.id, input.id));

      return { success: true };
    }),

  /**
   * Get workspace members
   */
  getMembers: protectedProcedure
    .input(z.object({ workspaceId: z.string() }))
    .query(async ({ input, ctx }) => {
      const userId = ctx.userId;

      await checkWorkspaceAccess(userId, input.workspaceId, [
        "owner",
        "admin",
        "member",
      ]);

      const members = await db.query.plannerWorkspaceMember.findMany({
        where: eq(plannerWorkspaceMember.workspaceId, input.workspaceId),
        with: {
          user: true,
        },
        orderBy: desc(plannerWorkspaceMember.createdAt),
      });

      return members.map((m) => ({
        id: m.id,
        role: m.role,
        createdAt: m.createdAt,
        user: {
          id: m.user.id,
          name: m.user.name,
          email: m.user.email,
          image: m.user.image,
        },
      }));
    }),

  /**
   * Invite a member to workspace
   */
  inviteMember: protectedProcedure
    .input(inviteMemberSchema)
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.userId;

      await checkWorkspaceAccess(userId, input.workspaceId, ["owner", "admin"]);

      // Check if already invited
      const existingInvite =
        await db.query.plannerWorkspaceInvitation.findFirst({
          where: and(
            eq(plannerWorkspaceInvitation.workspaceId, input.workspaceId),
            eq(plannerWorkspaceInvitation.email, input.email)
          ),
        });

      if (existingInvite) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Denne e-postadressen er allerede invitert",
        });
      }

      // Create invitation
      const token = nanoid(32);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

      const [invitation] = await db
        .insert(plannerWorkspaceInvitation)
        .values({
          id: nanoid(),
          workspaceId: input.workspaceId,
          email: input.email,
          role: input.role,
          token,
          expiresAt,
          invitedById: userId,
        })
        .returning();

      // TODO: Send invitation email

      if (!invitation) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Kunne ikke opprette invitasjon",
        });
      }

      return {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt,
      };
    }),

  /**
   * Accept an invitation
   */
  acceptInvitation: protectedProcedure
    .input(acceptInvitationSchema)
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.userId;

      const invitation = await db.query.plannerWorkspaceInvitation.findFirst({
        where: eq(plannerWorkspaceInvitation.token, input.token),
        with: {
          workspace: true,
        },
      });

      if (!invitation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invitasjonen ble ikke funnet",
        });
      }

      if (new Date() > invitation.expiresAt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invitasjonen har utløpt",
        });
      }

      // Check if already a member
      const existingMember = await db.query.plannerWorkspaceMember.findFirst({
        where: and(
          eq(plannerWorkspaceMember.workspaceId, invitation.workspaceId),
          eq(plannerWorkspaceMember.userId, userId)
        ),
      });

      if (existingMember) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Du er allerede medlem av denne bedriften",
        });
      }

      // Add as member
      await db.insert(plannerWorkspaceMember).values({
        id: nanoid(),
        workspaceId: invitation.workspaceId,
        userId,
        role: invitation.role,
      });

      // Delete invitation
      await db
        .delete(plannerWorkspaceInvitation)
        .where(eq(plannerWorkspaceInvitation.id, invitation.id));

      return {
        workspace: invitation.workspace,
        role: invitation.role,
      };
    }),

  /**
   * Revoke an invitation
   */
  revokeInvitation: protectedProcedure
    .input(z.object({ invitationId: z.string(), workspaceId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.userId;

      await checkWorkspaceAccess(userId, input.workspaceId, ["owner", "admin"]);

      await db
        .delete(plannerWorkspaceInvitation)
        .where(eq(plannerWorkspaceInvitation.id, input.invitationId));

      return { success: true };
    }),

  /**
   * Get pending invitations for a workspace
   */
  getPendingInvitations: protectedProcedure
    .input(z.object({ workspaceId: z.string() }))
    .query(async ({ input, ctx }) => {
      const userId = ctx.userId;

      await checkWorkspaceAccess(userId, input.workspaceId, ["owner", "admin"]);

      const invitations = await db.query.plannerWorkspaceInvitation.findMany({
        where: eq(plannerWorkspaceInvitation.workspaceId, input.workspaceId),
        with: {
          invitedBy: true,
        },
        orderBy: desc(plannerWorkspaceInvitation.createdAt),
      });

      return invitations.map((inv) => ({
        id: inv.id,
        email: inv.email,
        role: inv.role,
        expiresAt: inv.expiresAt,
        createdAt: inv.createdAt,
        invitedBy: {
          id: inv.invitedBy.id,
          name: inv.invitedBy.name,
        },
      }));
    }),

  /**
   * Update a member's role
   */
  updateMemberRole: protectedProcedure
    .input(updateMemberRoleSchema)
    .mutation(async ({ input, ctx }) => {
      const currentUserId = ctx.userId;

      await checkWorkspaceAccess(currentUserId, input.workspaceId, ["owner"]);

      // Find the target member by userId and workspaceId
      const targetMember = await db.query.plannerWorkspaceMember.findFirst({
        where: and(
          eq(plannerWorkspaceMember.userId, input.userId),
          eq(plannerWorkspaceMember.workspaceId, input.workspaceId)
        ),
      });

      if (!targetMember) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Medlemmet ble ikke funnet",
        });
      }

      if (targetMember.role === "owner") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Kan ikke endre rollen til eieren",
        });
      }

      const [updated] = await db
        .update(plannerWorkspaceMember)
        .set({ role: input.role })
        .where(eq(plannerWorkspaceMember.id, targetMember.id))
        .returning();

      return updated;
    }),

  /**
   * Remove a member from workspace
   */
  removeMember: protectedProcedure
    .input(removeMemberSchema)
    .mutation(async ({ input, ctx }) => {
      const currentUserId = ctx.userId;

      await checkWorkspaceAccess(currentUserId, input.workspaceId, [
        "owner",
        "admin",
      ]);

      // Find the target member by userId and workspaceId
      const targetMember = await db.query.plannerWorkspaceMember.findFirst({
        where: and(
          eq(plannerWorkspaceMember.userId, input.userId),
          eq(plannerWorkspaceMember.workspaceId, input.workspaceId)
        ),
      });

      if (!targetMember) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Medlemmet ble ikke funnet",
        });
      }

      // Can't remove owner
      if (targetMember.role === "owner") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Kan ikke fjerne eieren fra bedriften",
        });
      }

      // Admin can't remove other admins
      const currentMember = await db.query.plannerWorkspaceMember.findFirst({
        where: and(
          eq(plannerWorkspaceMember.userId, currentUserId),
          eq(plannerWorkspaceMember.workspaceId, input.workspaceId)
        ),
      });

      if (currentMember?.role === "admin" && targetMember.role === "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Administratorer kan ikke fjerne andre administratorer",
        });
      }

      await db
        .delete(plannerWorkspaceMember)
        .where(eq(plannerWorkspaceMember.id, targetMember.id));

      return { success: true };
    }),

  /**
   * Switch active workspace
   */
  switchWorkspace: protectedProcedure
    .input(switchWorkspaceSchema)
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.userId;

      // Verify user has access to this workspace
      await checkWorkspaceAccess(userId, input.workspaceId, [
        "owner",
        "admin",
        "member",
        "client",
      ]);

      // Update or create user preferences
      const prefs = await db.query.plannerUserPreferences.findFirst({
        where: eq(plannerUserPreferences.userId, userId),
      });

      if (prefs) {
        await db
          .update(plannerUserPreferences)
          .set({ activeWorkspaceId: input.workspaceId })
          .where(eq(plannerUserPreferences.userId, userId));
      } else {
        await db.insert(plannerUserPreferences).values({
          id: nanoid(),
          userId,
          activeWorkspaceId: input.workspaceId,
        });
      }

      return { success: true };
    }),

  /**
   * Get current active workspace
   */
  getCurrentWorkspace: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.userId;

    const prefs = await db.query.plannerUserPreferences.findFirst({
      where: eq(plannerUserPreferences.userId, userId),
      with: {
        activeWorkspace: true,
      },
    });

    if (!prefs?.activeWorkspace) {
      // Get first workspace user is member of
      const firstMembership = await db.query.plannerWorkspaceMember.findFirst({
        where: eq(plannerWorkspaceMember.userId, userId),
        with: {
          workspace: true,
        },
      });

      return firstMembership?.workspace ?? null;
    }

    return prefs.activeWorkspace;
  }),

  /**
   * Get subscription and workspace usage status
   */
  getSubscriptionStatus: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.userId;

    // Get subscription
    const sub = await db.query.plannerSubscription.findFirst({
      where: eq(plannerSubscription.userId, userId),
    });

    const tier = (sub?.tier as TierKey) ?? "free";
    const limits = subscriptionTierLimits[tier];
    const workspaceCount = await countUserWorkspaces(userId);

    return {
      tier,
      status: sub?.status ?? "active",
      currentPeriodEnd: sub?.currentPeriodEnd ?? null,
      cancelAtPeriodEnd: sub?.cancelAtPeriodEnd ?? false,
      usage: {
        workspaces: {
          current: workspaceCount,
          limit: limits.maxWorkspaces,
          canCreate:
            limits.maxWorkspaces === -1 ||
            workspaceCount < limits.maxWorkspaces,
        },
      },
    };
  }),

  /**
   * Check if user has any workspace membership (for onboarding flow)
   */
  hasWorkspace: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.userId;

    const membership = await db.query.plannerWorkspaceMember.findFirst({
      where: eq(plannerWorkspaceMember.userId, userId),
    });

    return {
      hasWorkspace: !!membership,
    };
  }),
});
