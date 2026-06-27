import { db } from "@poynt/planner-db";
import {
  plannerWorkspaceMember,
  plannerWorkspaceProfile,
} from "@poynt/planner-db/schema";
import { updateWorkspaceProfileSchema } from "@poynt/planner-validators";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

/**
 * Helper to get active workspace ID for user
 */
async function getActiveWorkspaceId(userId: string): Promise<string> {
  // Get the first workspace the user is a member of
  const membership = await db.query.plannerWorkspaceMember.findFirst({
    where: eq(plannerWorkspaceMember.userId, userId),
  });

  if (!membership) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "No workspace found for user",
    });
  }

  return membership.workspaceId;
}

/**
 * Verifiserer at brukeren er medlem av et gitt arbeidsområde og returnerer id-en.
 * Brukes når en spesifikk bedrift redigeres (f.eks. fra bedrifts-sheeten), så
 * man kan redigere profilen til bedriften man klikket på — ikke bare den aktive.
 */
async function resolveWorkspaceId(
  userId: string,
  workspaceId?: string
): Promise<string> {
  if (!workspaceId) {
    return getActiveWorkspaceId(userId);
  }
  const membership = await db.query.plannerWorkspaceMember.findFirst({
    where: and(
      eq(plannerWorkspaceMember.userId, userId),
      eq(plannerWorkspaceMember.workspaceId, workspaceId)
    ),
  });
  if (!membership) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Ingen tilgang til denne bedriften",
    });
  }
  return workspaceId;
}

export const workspaceProfileRouter = router({
  /**
   * Get the profile for a workspace (the active one, or an explicit workspaceId).
   */
  get: protectedProcedure
    .input(z.object({ workspaceId: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const workspaceId = await resolveWorkspaceId(
        ctx.userId,
        input?.workspaceId
      );

      const profile = await db.query.plannerWorkspaceProfile.findFirst({
        where: eq(plannerWorkspaceProfile.workspaceId, workspaceId),
        with: {
          industry: true,
        },
      });

      // Return empty profile structure if none exists
      if (!profile) {
        return {
          id: null,
          workspaceId,
          industryId: null,
          targetAudience: null,
          audienceType: null,
          companySize: null,
          goals: null,
          mainGoal: null,
          weeklyTime: null,
          strengths: null,
          customContext: null,
          brandBrief: null,
          industry: null,
        };
      }

      return profile;
    }),

  /**
   * Upsert the profile for a workspace (the active one, or an explicit workspaceId).
   * Creates if doesn't exist, updates if it does.
   */
  upsert: protectedProcedure
    .input(
      updateWorkspaceProfileSchema.extend({
        workspaceId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { workspaceId: targetWorkspaceId, ...data } = input;
      const workspaceId = await resolveWorkspaceId(
        ctx.userId,
        targetWorkspaceId
      );

      // Check if profile exists
      const existing = await db.query.plannerWorkspaceProfile.findFirst({
        where: eq(plannerWorkspaceProfile.workspaceId, workspaceId),
      });

      if (existing) {
        // Update existing
        const [updated] = await db
          .update(plannerWorkspaceProfile)
          .set({
            ...data,
            updatedAt: new Date(),
          })
          .where(eq(plannerWorkspaceProfile.id, existing.id))
          .returning();

        return updated;
      }

      // Create new
      const id = crypto.randomUUID();
      const [created] = await db
        .insert(plannerWorkspaceProfile)
        .values({
          id,
          workspaceId,
          ...data,
        })
        .returning();

      return created;
    }),
});
