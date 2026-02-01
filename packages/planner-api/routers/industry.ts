import { db } from "@poynt/planner-db";
import { plannerIndustry } from "@poynt/planner-db/schema";
import {
  createIndustrySchema,
  defaultIndustries,
  updateIndustrySchema,
} from "@poynt/planner-validators";
import { TRPCError } from "@trpc/server";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { adminProcedure, protectedProcedure, router } from "../trpc";

export const industryRouter = router({
  /**
   * List all industries (public for dropdowns)
   * Only returns active industries for non-admins
   */
  list: protectedProcedure
    .input(
      z
        .object({
          includeInactive: z.boolean().optional().default(false),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const includeInactive = input?.includeInactive ?? false;

      const industries = await db
        .select()
        .from(plannerIndustry)
        .where(includeInactive ? undefined : eq(plannerIndustry.isActive, true))
        .orderBy(asc(plannerIndustry.sortOrder), asc(plannerIndustry.name));

      return industries;
    }),

  /**
   * Get single industry by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const [result] = await db
        .select()
        .from(plannerIndustry)
        .where(eq(plannerIndustry.id, input.id))
        .limit(1);

      if (!result) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Bransje ikke funnet",
        });
      }

      return result;
    }),

  /**
   * Create new industry (admin only)
   */
  create: adminProcedure
    .input(createIndustrySchema)
    .mutation(async ({ input }) => {
      // Check if ID already exists
      const [existing] = await db
        .select({ id: plannerIndustry.id })
        .from(plannerIndustry)
        .where(eq(plannerIndustry.id, input.id))
        .limit(1);

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "En bransje med denne ID-en finnes allerede",
        });
      }

      const [created] = await db
        .insert(plannerIndustry)
        .values({
          id: input.id,
          name: input.name,
          description: input.description,
          icon: input.icon,
          sortOrder: input.sortOrder,
          isActive: input.isActive,
          promptHints: input.promptHints,
          relatedKeywords: input.relatedKeywords,
        })
        .returning();

      return created;
    }),

  /**
   * Update industry (admin only)
   */
  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        data: updateIndustrySchema,
      })
    )
    .mutation(async ({ input }) => {
      const [updated] = await db
        .update(plannerIndustry)
        .set({
          ...input.data,
          updatedAt: new Date(),
        })
        .where(eq(plannerIndustry.id, input.id))
        .returning();

      if (!updated) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Bransje ikke funnet",
        });
      }

      return updated;
    }),

  /**
   * Delete industry (admin only)
   */
  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const [deleted] = await db
        .delete(plannerIndustry)
        .where(eq(plannerIndustry.id, input.id))
        .returning();

      if (!deleted) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Bransje ikke funnet",
        });
      }

      return { success: true };
    }),

  /**
   * Seed default industries (admin only)
   * Only inserts if no industries exist
   */
  seed: adminProcedure.mutation(async () => {
    const existing = await db
      .select({ id: plannerIndustry.id })
      .from(plannerIndustry)
      .limit(1);

    if (existing.length > 0) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "Bransjer finnes allerede. Bruk reset for å starte på nytt.",
      });
    }

    const inserted = await db
      .insert(plannerIndustry)
      .values(
        defaultIndustries.map((i) => ({
          id: i.id,
          name: i.name,
          description: i.description,
          icon: i.icon,
          sortOrder: i.sortOrder,
          isActive: i.isActive,
        }))
      )
      .returning();

    return { count: inserted.length };
  }),

  /**
   * Toggle active status (admin only)
   */
  toggleActive: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      // Get current status
      const [current] = await db
        .select({ isActive: plannerIndustry.isActive })
        .from(plannerIndustry)
        .where(eq(plannerIndustry.id, input.id))
        .limit(1);

      if (!current) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Bransje ikke funnet",
        });
      }

      const [updated] = await db
        .update(plannerIndustry)
        .set({
          isActive: !current.isActive,
          updatedAt: new Date(),
        })
        .where(eq(plannerIndustry.id, input.id))
        .returning();

      return updated;
    }),
});
