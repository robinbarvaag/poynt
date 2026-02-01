import { db } from "@poynt/planner-db";
import {
  plannerDeclineGeneratorFeedback,
  plannerToolResult,
  plannerWorkspaceMember,
} from "@poynt/planner-db/schema";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

/**
 * Helper to get active workspace ID for user
 */
async function getActiveWorkspaceId(userId: string): Promise<string> {
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

export const declineFeedbackRouter = router({
  /**
   * Save which variant was copied
   */
  saveVariantCopy: protectedProcedure
    .input(
      z.object({
        toolResultId: z.string(),
        variant: z.enum(["kort", "varm", "alternativ"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { toolResultId, variant } = input;
      const workspaceId = await getActiveWorkspaceId(ctx.userId);

      // Verify tool result belongs to user's workspace
      const result = await db.query.plannerToolResult.findFirst({
        where: eq(plannerToolResult.id, toolResultId),
      });

      if (!result || result.workspaceId !== workspaceId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Tool result not found",
        });
      }

      // Check if feedback already exists
      const existing = await db.query.plannerDeclineGeneratorFeedback.findFirst(
        {
          where: eq(plannerDeclineGeneratorFeedback.toolResultId, toolResultId),
        }
      );

      if (existing) {
        // Update existing
        await db
          .update(plannerDeclineGeneratorFeedback)
          .set({ variantCopied: variant })
          .where(eq(plannerDeclineGeneratorFeedback.id, existing.id));
        return { success: true };
      }

      // Create new
      await db.insert(plannerDeclineGeneratorFeedback).values({
        id: nanoid(),
        toolResultId,
        variantCopied: variant,
      });

      return { success: true };
    }),

  /**
   * Save feedback (thumbs up/down + optional text + custom version)
   */
  saveFeedback: protectedProcedure
    .input(
      z.object({
        toolResultId: z.string(),
        worked: z.boolean().optional(),
        feedbackText: z.string().max(1000).optional(),
        customVersion: z.string().max(2000).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { toolResultId, worked, feedbackText, customVersion } = input;
      const workspaceId = await getActiveWorkspaceId(ctx.userId);

      // Verify tool result belongs to user's workspace
      const result = await db.query.plannerToolResult.findFirst({
        where: eq(plannerToolResult.id, toolResultId),
      });

      if (!result || result.workspaceId !== workspaceId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Tool result not found",
        });
      }

      // Check if feedback already exists
      const existing = await db.query.plannerDeclineGeneratorFeedback.findFirst(
        {
          where: eq(plannerDeclineGeneratorFeedback.toolResultId, toolResultId),
        }
      );

      if (existing) {
        // Update existing
        await db
          .update(plannerDeclineGeneratorFeedback)
          .set({
            worked: worked !== undefined ? worked : existing.worked,
            feedbackText:
              feedbackText !== undefined ? feedbackText : existing.feedbackText,
            customVersion:
              customVersion !== undefined
                ? customVersion
                : existing.customVersion,
          })
          .where(eq(plannerDeclineGeneratorFeedback.id, existing.id));
        return { success: true };
      }

      // Create new
      await db.insert(plannerDeclineGeneratorFeedback).values({
        id: nanoid(),
        toolResultId,
        worked,
        feedbackText,
        customVersion,
      });

      return { success: true };
    }),

  /**
   * Get feedback for a tool result
   */
  getFeedback: protectedProcedure
    .input(
      z.object({
        toolResultId: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      const { toolResultId } = input;
      const workspaceId = await getActiveWorkspaceId(ctx.userId);

      // Verify tool result belongs to user's workspace
      const result = await db.query.plannerToolResult.findFirst({
        where: eq(plannerToolResult.id, toolResultId),
      });

      if (!result || result.workspaceId !== workspaceId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Tool result not found",
        });
      }

      const feedback = await db.query.plannerDeclineGeneratorFeedback.findFirst(
        {
          where: eq(plannerDeclineGeneratorFeedback.toolResultId, toolResultId),
        }
      );

      return feedback || null;
    }),
});
