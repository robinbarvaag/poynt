import { db } from "@poynt/on-poynt-db";
import {
  onPoyntSubscription,
  onPoyntUserPreferences,
  onPoyntWorkspace,
  onPoyntWorkspaceInvitation,
  onPoyntWorkspaceMember,
} from "@poynt/on-poynt-db/schema";
import {
  type MembershipTier,
  acceptInvitationSchema,
  createWorkspaceSchema,
  inviteMemberSchema,
  membershipTierLimits,
  removeMemberSchema,
  switchWorkspaceSchema,
  updateMemberRoleSchema,
  updateWorkspaceSchema,
} from "@poynt/on-poynt-validators";
import { generateSlug as generateSlugBase } from "@poynt/utils/generate-slug";
import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { memberProcedure, protectedProcedure, router } from "../trpc";

/**
 * Trygg innlesing av medlemskapsnivået. Faller tilbake til «none» om raden
 * mangler, så `membershipTierLimits[tier]` aldri blir undefined (det var den
 * gamle 500-bugen).
 */
function tierFor(rawTier: string | null | undefined): MembershipTier {
  return (rawTier as MembershipTier) ?? "none";
}

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
  const member = await db.query.onPoyntWorkspaceMember.findFirst({
    where: and(
      eq(onPoyntWorkspaceMember.userId, userId),
      eq(onPoyntWorkspaceMember.workspaceId, workspaceId)
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
async function getUserSubscription(userId: string): Promise<MembershipTier> {
  const sub = await db.query.onPoyntSubscription.findFirst({
    where: eq(onPoyntSubscription.userId, userId),
  });

  return tierFor(sub?.tier);
}

/**
 * Helper to count user's owned workspaces
 */
async function countUserWorkspaces(userId: string) {
  const members = await db.query.onPoyntWorkspaceMember.findMany({
    where: and(
      eq(onPoyntWorkspaceMember.userId, userId),
      eq(onPoyntWorkspaceMember.role, "owner")
    ),
  });

  return members.length;
}

export const workspaceRouter = router({
  /**
   * Create a new workspace
   */
  create: memberProcedure
    .input(createWorkspaceSchema)
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.userId;

      // Check subscription limits
      const tier = await getUserSubscription(userId);
      const currentCount = await countUserWorkspaces(userId);
      const limit = membershipTierLimits[tier].maxWorkspaces;

      if (limit !== -1 && currentCount >= limit) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `Du har nådd grensen på ${limit} bedrift(er) for din plan. Oppgrader for å opprette flere.`,
        });
      }

      // Generate unique slug
      let slug = generateSlug(input.name);
      const slugExists = await db.query.onPoyntWorkspace.findFirst({
        where: eq(onPoyntWorkspace.slug, slug),
      });

      if (slugExists) {
        slug = `${slug}-${nanoid(6)}`;
      }

      // Create workspace
      const workspaceId = nanoid();
      const [newWorkspace] = await db
        .insert(onPoyntWorkspace)
        .values({
          id: workspaceId,
          name: input.name,
          slug,
          description: input.description,
        })
        .returning();

      // Add creator as owner
      await db.insert(onPoyntWorkspaceMember).values({
        id: nanoid(),
        workspaceId: workspaceId,
        userId,
        role: "owner",
      });

      // Gjør den nye bedriften til den aktive — når du oppretter en bedrift vil
      // du inn i den for å sette den opp. Uten dette ble du værende i den
      // forrige bedriften (og så dens data på dashbordet).
      const prefs = await db.query.onPoyntUserPreferences.findFirst({
        where: eq(onPoyntUserPreferences.userId, userId),
      });

      if (!prefs) {
        await db.insert(onPoyntUserPreferences).values({
          id: nanoid(),
          userId,
          activeWorkspaceId: workspaceId,
        });
      } else {
        await db
          .update(onPoyntUserPreferences)
          .set({ activeWorkspaceId: workspaceId })
          .where(eq(onPoyntUserPreferences.userId, userId));
      }

      return newWorkspace;
    }),

  /**
   * List user's workspaces
   */
  list: memberProcedure.query(async ({ ctx }) => {
    const userId = ctx.userId;

    const memberships = await db.query.onPoyntWorkspaceMember.findMany({
      where: eq(onPoyntWorkspaceMember.userId, userId),
      with: {
        workspace: true,
      },
      orderBy: desc(onPoyntWorkspaceMember.createdAt),
    });

    return memberships.map((m) => ({
      ...m.workspace,
      role: m.role,
    }));
  }),

  /**
   * Get a workspace by ID
   */
  getById: memberProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const userId = ctx.userId;

      const member = await checkWorkspaceAccess(userId, input.id, [
        "owner",
        "admin",
        "member",
        "client",
      ]);

      const ws = await db.query.onPoyntWorkspace.findFirst({
        where: eq(onPoyntWorkspace.id, input.id),
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
  update: memberProcedure
    .input(updateWorkspaceSchema)
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.userId;

      await checkWorkspaceAccess(userId, input.id, ["owner", "admin"]);

      const [updated] = await db
        .update(onPoyntWorkspace)
        .set({
          name: input.name,
          description: input.description,
          image: input.image,
        })
        .where(eq(onPoyntWorkspace.id, input.id))
        .returning();

      return updated;
    }),

  /**
   * Delete a workspace
   */
  delete: memberProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.userId;

      await checkWorkspaceAccess(userId, input.id, ["owner"]);

      await db
        .delete(onPoyntWorkspace)
        .where(eq(onPoyntWorkspace.id, input.id));

      return { success: true };
    }),

  /**
   * Get workspace members
   */
  getMembers: memberProcedure
    .input(z.object({ workspaceId: z.string() }))
    .query(async ({ input, ctx }) => {
      const userId = ctx.userId;

      await checkWorkspaceAccess(userId, input.workspaceId, [
        "owner",
        "admin",
        "member",
      ]);

      const members = await db.query.onPoyntWorkspaceMember.findMany({
        where: eq(onPoyntWorkspaceMember.workspaceId, input.workspaceId),
        with: {
          user: true,
        },
        orderBy: desc(onPoyntWorkspaceMember.createdAt),
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
  inviteMember: memberProcedure
    .input(inviteMemberSchema)
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.userId;

      await checkWorkspaceAccess(userId, input.workspaceId, ["owner", "admin"]);

      // Check if already invited
      const existingInvite =
        await db.query.onPoyntWorkspaceInvitation.findFirst({
          where: and(
            eq(onPoyntWorkspaceInvitation.workspaceId, input.workspaceId),
            eq(onPoyntWorkspaceInvitation.email, input.email)
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
        .insert(onPoyntWorkspaceInvitation)
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
  acceptInvitation: memberProcedure
    .input(acceptInvitationSchema)
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.userId;

      const invitation = await db.query.onPoyntWorkspaceInvitation.findFirst({
        where: eq(onPoyntWorkspaceInvitation.token, input.token),
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
      const existingMember = await db.query.onPoyntWorkspaceMember.findFirst({
        where: and(
          eq(onPoyntWorkspaceMember.workspaceId, invitation.workspaceId),
          eq(onPoyntWorkspaceMember.userId, userId)
        ),
      });

      if (existingMember) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Du er allerede medlem av denne bedriften",
        });
      }

      // Add as member
      await db.insert(onPoyntWorkspaceMember).values({
        id: nanoid(),
        workspaceId: invitation.workspaceId,
        userId,
        role: invitation.role,
      });

      // Delete invitation
      await db
        .delete(onPoyntWorkspaceInvitation)
        .where(eq(onPoyntWorkspaceInvitation.id, invitation.id));

      return {
        workspace: invitation.workspace,
        role: invitation.role,
      };
    }),

  /**
   * Revoke an invitation
   */
  revokeInvitation: memberProcedure
    .input(z.object({ invitationId: z.string(), workspaceId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.userId;

      await checkWorkspaceAccess(userId, input.workspaceId, ["owner", "admin"]);

      await db
        .delete(onPoyntWorkspaceInvitation)
        .where(eq(onPoyntWorkspaceInvitation.id, input.invitationId));

      return { success: true };
    }),

  /**
   * Get pending invitations for a workspace
   */
  getPendingInvitations: memberProcedure
    .input(z.object({ workspaceId: z.string() }))
    .query(async ({ input, ctx }) => {
      const userId = ctx.userId;

      await checkWorkspaceAccess(userId, input.workspaceId, ["owner", "admin"]);

      const invitations = await db.query.onPoyntWorkspaceInvitation.findMany({
        where: eq(onPoyntWorkspaceInvitation.workspaceId, input.workspaceId),
        with: {
          invitedBy: true,
        },
        orderBy: desc(onPoyntWorkspaceInvitation.createdAt),
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
  updateMemberRole: memberProcedure
    .input(updateMemberRoleSchema)
    .mutation(async ({ input, ctx }) => {
      const currentUserId = ctx.userId;

      await checkWorkspaceAccess(currentUserId, input.workspaceId, ["owner"]);

      // Find the target member by userId and workspaceId
      const targetMember = await db.query.onPoyntWorkspaceMember.findFirst({
        where: and(
          eq(onPoyntWorkspaceMember.userId, input.userId),
          eq(onPoyntWorkspaceMember.workspaceId, input.workspaceId)
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
        .update(onPoyntWorkspaceMember)
        .set({ role: input.role })
        .where(eq(onPoyntWorkspaceMember.id, targetMember.id))
        .returning();

      return updated;
    }),

  /**
   * Remove a member from workspace
   */
  removeMember: memberProcedure
    .input(removeMemberSchema)
    .mutation(async ({ input, ctx }) => {
      const currentUserId = ctx.userId;

      await checkWorkspaceAccess(currentUserId, input.workspaceId, [
        "owner",
        "admin",
      ]);

      // Find the target member by userId and workspaceId
      const targetMember = await db.query.onPoyntWorkspaceMember.findFirst({
        where: and(
          eq(onPoyntWorkspaceMember.userId, input.userId),
          eq(onPoyntWorkspaceMember.workspaceId, input.workspaceId)
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
      const currentMember = await db.query.onPoyntWorkspaceMember.findFirst({
        where: and(
          eq(onPoyntWorkspaceMember.userId, currentUserId),
          eq(onPoyntWorkspaceMember.workspaceId, input.workspaceId)
        ),
      });

      if (currentMember?.role === "admin" && targetMember.role === "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Administratorer kan ikke fjerne andre administratorer",
        });
      }

      await db
        .delete(onPoyntWorkspaceMember)
        .where(eq(onPoyntWorkspaceMember.id, targetMember.id));

      return { success: true };
    }),

  /**
   * Switch active workspace
   */
  switchWorkspace: memberProcedure
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
      const prefs = await db.query.onPoyntUserPreferences.findFirst({
        where: eq(onPoyntUserPreferences.userId, userId),
      });

      if (prefs) {
        await db
          .update(onPoyntUserPreferences)
          .set({ activeWorkspaceId: input.workspaceId })
          .where(eq(onPoyntUserPreferences.userId, userId));
      } else {
        await db.insert(onPoyntUserPreferences).values({
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
  getCurrentWorkspace: memberProcedure.query(async ({ ctx }) => {
    const userId = ctx.userId;

    const prefs = await db.query.onPoyntUserPreferences.findFirst({
      where: eq(onPoyntUserPreferences.userId, userId),
      with: {
        activeWorkspace: true,
      },
    });

    if (!prefs?.activeWorkspace) {
      // Get first workspace user is member of
      const firstMembership = await db.query.onPoyntWorkspaceMember.findFirst({
        where: eq(onPoyntWorkspaceMember.userId, userId),
        with: {
          workspace: true,
        },
      });

      return firstMembership?.workspace ?? null;
    }

    return prefs.activeWorkspace;
  }),

  /**
   * Get subscription and workspace usage status.
   * Krever bare innlogging (ikke medlemskap) — den skal kunne fortelle en
   * bruker UTEN aktivt medlemskap hvorfor hen ikke slipper inn.
   */
  getSubscriptionStatus: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.userId;

    // Get subscription
    const sub = await db.query.onPoyntSubscription.findFirst({
      where: eq(onPoyntSubscription.userId, userId),
    });

    const tier = tierFor(sub?.tier);
    const limits = membershipTierLimits[tier];
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
  hasWorkspace: memberProcedure.query(async ({ ctx }) => {
    const userId = ctx.userId;

    const membership = await db.query.onPoyntWorkspaceMember.findFirst({
      where: eq(onPoyntWorkspaceMember.userId, userId),
    });

    return {
      hasWorkspace: !!membership,
    };
  }),
});
