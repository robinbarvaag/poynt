import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, and, desc } from "drizzle-orm";
import { protectedProcedure, router } from "../trpc";
import { db } from "@poynt/planner-db";
import { plannerToolResult, plannerWorkspaceMember } from "@poynt/planner-db/schema";
import { createToolResultSchema, updateToolResultSchema } from "@poynt/planner-validators";

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

export const toolResultRouter = router({
  /**
   * List results for the active workspace
   * Optionally filter by toolId
   */
  list: protectedProcedure
    .input(
      z.object({
        toolId: z.string().optional(),
        limit: z.number().min(1).max(100).default(20),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const workspaceId = await getActiveWorkspaceId(ctx.userId);
      const toolId = input?.toolId;
      const limit = input?.limit ?? 20;

      const results = await db.query.plannerToolResult.findMany({
        where: toolId
          ? and(
              eq(plannerToolResult.workspaceId, workspaceId),
              eq(plannerToolResult.toolId, toolId)
            )
          : eq(plannerToolResult.workspaceId, workspaceId),
        orderBy: [desc(plannerToolResult.createdAt)],
        limit,
      });

      return results;
    }),

  /**
   * Get a single result by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const workspaceId = await getActiveWorkspaceId(ctx.userId);

      const result = await db.query.plannerToolResult.findFirst({
        where: and(
          eq(plannerToolResult.id, input.id),
          eq(plannerToolResult.workspaceId, workspaceId)
        ),
      });

      if (!result) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Result not found",
        });
      }

      return result;
    }),

  /**
   * Save a new tool result
   */
  save: protectedProcedure
    .input(createToolResultSchema)
    .mutation(async ({ ctx, input }) => {
      const workspaceId = await getActiveWorkspaceId(ctx.userId);
      const id = crypto.randomUUID();

      const [created] = await db
        .insert(plannerToolResult)
        .values({
          id,
          workspaceId,
          toolId: input.toolId,
          title: input.title ?? null,
          inputs: input.inputs ?? null,
          result: input.result ?? null,
        })
        .returning();

      return created;
    }),

  /**
   * Update an existing result (e.g., adjust the result text)
   */
  update: protectedProcedure
    .input(updateToolResultSchema)
    .mutation(async ({ ctx, input }) => {
      const workspaceId = await getActiveWorkspaceId(ctx.userId);

      // Verify ownership
      const existing = await db.query.plannerToolResult.findFirst({
        where: and(
          eq(plannerToolResult.id, input.id),
          eq(plannerToolResult.workspaceId, workspaceId)
        ),
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Result not found",
        });
      }

      const [updated] = await db
        .update(plannerToolResult)
        .set({
          title: input.title ?? existing.title,
          result: input.result ?? existing.result,
          updatedAt: new Date(),
        })
        .where(eq(plannerToolResult.id, input.id))
        .returning();

      return updated;
    }),

  /**
   * Delete a result
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const workspaceId = await getActiveWorkspaceId(ctx.userId);

      // Verify ownership
      const existing = await db.query.plannerToolResult.findFirst({
        where: and(
          eq(plannerToolResult.id, input.id),
          eq(plannerToolResult.workspaceId, workspaceId)
        ),
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Result not found",
        });
      }

      await db.delete(plannerToolResult).where(eq(plannerToolResult.id, input.id));

      return { success: true };
    }),
});
