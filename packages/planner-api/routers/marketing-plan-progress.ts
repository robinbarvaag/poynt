import { db } from "@poynt/planner-db";
import {
  plannerMarketingPlanProgress,
  plannerToolResult,
  plannerWorkspaceMember,
} from "@poynt/planner-db/schema";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
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

export const marketingPlanProgressRouter = router({
  /**
   * Toggle a timeline task completion
   */
  toggleTimelineTask: protectedProcedure
    .input(
      z.object({
        toolResultId: z.string(),
        monthIndex: z.number().min(0).max(11),
        taskIndex: z.number().min(0),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { toolResultId, monthIndex, taskIndex } = input;
      const workspaceId = await getActiveWorkspaceId(ctx.userId);

      // Verify tool result belongs to user's workspace
      const result = await db.query.plannerToolResult.findFirst({
        where: eq(plannerToolResult.id, toolResultId),
      });

      if (!result || result.workspaceId !== workspaceId) {
        throw new Error("Tool result not found");
      }

      // Check if already completed
      const existing = await db.query.plannerMarketingPlanProgress.findFirst({
        where: and(
          eq(plannerMarketingPlanProgress.toolResultId, toolResultId),
          eq(plannerMarketingPlanProgress.type, "timeline"),
          eq(plannerMarketingPlanProgress.monthIndex, monthIndex.toString()),
          eq(plannerMarketingPlanProgress.taskIndex, taskIndex.toString())
        ),
      });

      if (existing) {
        // Remove completion
        await db
          .delete(plannerMarketingPlanProgress)
          .where(eq(plannerMarketingPlanProgress.id, existing.id));
        return { completed: false };
      }

      // Add completion
      await db.insert(plannerMarketingPlanProgress).values({
        id: nanoid(),
        toolResultId,
        type: "timeline",
        monthIndex: monthIndex.toString(),
        taskIndex: taskIndex.toString(),
      });

      return { completed: true };
    }),

  /**
   * Toggle a quick win completion
   */
  toggleQuickWin: protectedProcedure
    .input(
      z.object({
        toolResultId: z.string(),
        taskIndex: z.number().min(0),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { toolResultId, taskIndex } = input;
      const workspaceId = await getActiveWorkspaceId(ctx.userId);

      // Verify tool result belongs to user's workspace
      const result = await db.query.plannerToolResult.findFirst({
        where: eq(plannerToolResult.id, toolResultId),
      });

      if (!result || result.workspaceId !== workspaceId) {
        throw new Error("Tool result not found");
      }

      // Check if already completed
      const existing = await db.query.plannerMarketingPlanProgress.findFirst({
        where: and(
          eq(plannerMarketingPlanProgress.toolResultId, toolResultId),
          eq(plannerMarketingPlanProgress.type, "quickwin"),
          eq(plannerMarketingPlanProgress.taskIndex, taskIndex.toString())
        ),
      });

      if (existing) {
        // Remove completion
        await db
          .delete(plannerMarketingPlanProgress)
          .where(eq(plannerMarketingPlanProgress.id, existing.id));
        return { completed: false };
      }

      // Add completion
      await db.insert(plannerMarketingPlanProgress).values({
        id: nanoid(),
        toolResultId,
        type: "quickwin",
        monthIndex: null,
        taskIndex: taskIndex.toString(),
      });

      return { completed: true };
    }),

  /**
   * Get all progress for a tool result
   */
  getProgress: protectedProcedure
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
        throw new Error("Tool result not found");
      }

      const progress = await db.query.plannerMarketingPlanProgress.findMany({
        where: eq(plannerMarketingPlanProgress.toolResultId, toolResultId),
      });

      return progress;
    }),
});
