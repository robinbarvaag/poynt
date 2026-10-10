import { db } from "@poynt/on-poynt-db";
import { onPoyntToolResult } from "@poynt/on-poynt-db/schema";
import {
  createToolResultSchema,
  updateToolResultSchema,
} from "@poynt/on-poynt-validators";
import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { getActiveWorkspaceId } from "../lib/active-workspace";
import { memberProcedure, router } from "../trpc";

export const toolResultRouter = router({
  /**
   * List results for the active workspace
   * Optionally filter by toolId
   */
  list: memberProcedure
    .input(
      z
        .object({
          toolId: z.string().optional(),
          limit: z.number().min(1).max(100).default(20),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const workspaceId = await getActiveWorkspaceId(ctx.userId);
      const toolId = input?.toolId;
      const limit = input?.limit ?? 20;

      const results = await db.query.onPoyntToolResult.findMany({
        where: toolId
          ? and(
              eq(onPoyntToolResult.workspaceId, workspaceId),
              eq(onPoyntToolResult.toolId, toolId)
            )
          : eq(onPoyntToolResult.workspaceId, workspaceId),
        orderBy: [desc(onPoyntToolResult.createdAt)],
        limit,
      });

      return results;
    }),

  /**
   * Get a single result by ID
   */
  getById: memberProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const workspaceId = await getActiveWorkspaceId(ctx.userId);

      const result = await db.query.onPoyntToolResult.findFirst({
        where: and(
          eq(onPoyntToolResult.id, input.id),
          eq(onPoyntToolResult.workspaceId, workspaceId)
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
  save: memberProcedure
    .input(createToolResultSchema)
    .mutation(async ({ ctx, input }) => {
      const workspaceId = await getActiveWorkspaceId(ctx.userId);
      const id = crypto.randomUUID();

      const [created] = await db
        .insert(onPoyntToolResult)
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
  update: memberProcedure
    .input(updateToolResultSchema)
    .mutation(async ({ ctx, input }) => {
      const workspaceId = await getActiveWorkspaceId(ctx.userId);

      // Verify ownership
      const existing = await db.query.onPoyntToolResult.findFirst({
        where: and(
          eq(onPoyntToolResult.id, input.id),
          eq(onPoyntToolResult.workspaceId, workspaceId)
        ),
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Result not found",
        });
      }

      const [updated] = await db
        .update(onPoyntToolResult)
        .set({
          title: input.title ?? existing.title,
          result: input.result ?? existing.result,
          updatedAt: new Date(),
        })
        .where(eq(onPoyntToolResult.id, input.id))
        .returning();

      return updated;
    }),

  /**
   * Delete a result
   */
  delete: memberProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const workspaceId = await getActiveWorkspaceId(ctx.userId);

      // Verify ownership
      const existing = await db.query.onPoyntToolResult.findFirst({
        where: and(
          eq(onPoyntToolResult.id, input.id),
          eq(onPoyntToolResult.workspaceId, workspaceId)
        ),
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Result not found",
        });
      }

      await db
        .delete(onPoyntToolResult)
        .where(eq(onPoyntToolResult.id, input.id));

      return { success: true };
    }),
});
