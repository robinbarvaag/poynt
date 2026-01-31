import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { protectedProcedure, router } from "../trpc";
import { db } from "@poynt/planner-db";
import { plannerWorkspaceProfile, plannerWorkspaceMember } from "@poynt/planner-db/schema";
import { updateWorkspaceProfileSchema } from "@poynt/planner-validators";

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

export const workspaceProfileRouter = router({
  /**
   * Get the profile for the active workspace
   */
  get: protectedProcedure.query(async ({ ctx }) => {
    const workspaceId = await getActiveWorkspaceId(ctx.userId);

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
        customContext: null,
        industry: null,
      };
    }

    return profile;
  }),

  /**
   * Upsert the profile for the active workspace
   * Creates if doesn't exist, updates if it does
   */
  upsert: protectedProcedure
    .input(updateWorkspaceProfileSchema)
    .mutation(async ({ ctx, input }) => {
      const workspaceId = await getActiveWorkspaceId(ctx.userId);

      // Check if profile exists
      const existing = await db.query.plannerWorkspaceProfile.findFirst({
        where: eq(plannerWorkspaceProfile.workspaceId, workspaceId),
      });

      if (existing) {
        // Update existing
        const [updated] = await db
          .update(plannerWorkspaceProfile)
          .set({
            ...input,
            updatedAt: new Date(),
          })
          .where(eq(plannerWorkspaceProfile.id, existing.id))
          .returning();

        return updated;
      } else {
        // Create new
        const id = crypto.randomUUID();
        const [created] = await db
          .insert(plannerWorkspaceProfile)
          .values({
            id,
            workspaceId,
            ...input,
          })
          .returning();

        return created;
      }
    }),
});
