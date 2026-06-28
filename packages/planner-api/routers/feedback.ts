import { db } from "@poynt/planner-db";
import { plannerFeedback, plannerUser } from "@poynt/planner-db/schema";
import {
  createFeedbackSchema,
  updateFeedbackStatusSchema,
} from "@poynt/planner-validators";
import { desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getActiveWorkspaceId } from "../lib/active-workspace";
import { adminProcedure, protectedProcedure, router } from "../trpc";

export const feedbackRouter = router({
  /** Send inn en tilbakemelding / et ønske (hvilket som helst innlogget medlem). */
  create: protectedProcedure
    .input(createFeedbackSchema)
    .mutation(async ({ ctx, input }) => {
      let workspaceId: string | null = null;
      try {
        workspaceId = await getActiveWorkspaceId(ctx.userId);
      } catch {
        // ingen aktiv bedrift er greit — feedback er knyttet til brukeren
      }

      const [row] = await db
        .insert(plannerFeedback)
        .values({
          id: nanoid(),
          userId: ctx.userId,
          workspaceId,
          category: input.category,
          title: input.title,
          description: input.description,
        })
        .returning();
      return row;
    }),

  /** Mine egne innsendinger (nyeste først). */
  listMine: protectedProcedure.query(async ({ ctx }) => {
    return db
      .select()
      .from(plannerFeedback)
      .where(eq(plannerFeedback.userId, ctx.userId))
      .orderBy(desc(plannerFeedback.createdAt));
  }),

  /** Alle innsendinger — admin-triage, med innsender for kontekst. */
  listAll: adminProcedure.query(async () => {
    return db
      .select({
        id: plannerFeedback.id,
        category: plannerFeedback.category,
        title: plannerFeedback.title,
        description: plannerFeedback.description,
        status: plannerFeedback.status,
        adminResponse: plannerFeedback.adminResponse,
        createdAt: plannerFeedback.createdAt,
        userName: plannerUser.name,
        userEmail: plannerUser.email,
      })
      .from(plannerFeedback)
      .leftJoin(plannerUser, eq(plannerFeedback.userId, plannerUser.id))
      .orderBy(desc(plannerFeedback.createdAt));
  }),

  /** Sett status (+ valgfritt svar til medlemmet). */
  setStatus: adminProcedure
    .input(updateFeedbackStatusSchema)
    .mutation(async ({ input }) => {
      const [row] = await db
        .update(plannerFeedback)
        .set({
          status: input.status,
          adminResponse: input.adminResponse ? input.adminResponse : null,
        })
        .where(eq(plannerFeedback.id, input.id))
        .returning();
      return row;
    }),
});
