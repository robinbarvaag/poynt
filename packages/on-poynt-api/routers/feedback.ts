import { db } from "@poynt/on-poynt-db";
import { onPoyntFeedback, onPoyntUser } from "@poynt/on-poynt-db/schema";
import {
  createFeedbackSchema,
  updateFeedbackStatusSchema,
} from "@poynt/on-poynt-validators";
import { desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getActiveWorkspaceId } from "../lib/active-workspace";
import { adminProcedure, memberProcedure, router } from "../trpc";

export const feedbackRouter = router({
  /** Send inn en tilbakemelding / et ønske (hvilket som helst innlogget medlem). */
  create: memberProcedure
    .input(createFeedbackSchema)
    .mutation(async ({ ctx, input }) => {
      let workspaceId: string | null = null;
      try {
        workspaceId = await getActiveWorkspaceId(ctx.userId);
      } catch {
        // ingen aktiv bedrift er greit — feedback er knyttet til brukeren
      }

      const [row] = await db
        .insert(onPoyntFeedback)
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
  listMine: memberProcedure.query(async ({ ctx }) => {
    return db
      .select()
      .from(onPoyntFeedback)
      .where(eq(onPoyntFeedback.userId, ctx.userId))
      .orderBy(desc(onPoyntFeedback.createdAt));
  }),

  /** Alle innsendinger — admin-triage, med innsender for kontekst. */
  listAll: adminProcedure.query(async () => {
    return db
      .select({
        id: onPoyntFeedback.id,
        category: onPoyntFeedback.category,
        title: onPoyntFeedback.title,
        description: onPoyntFeedback.description,
        status: onPoyntFeedback.status,
        adminResponse: onPoyntFeedback.adminResponse,
        createdAt: onPoyntFeedback.createdAt,
        userName: onPoyntUser.name,
        userEmail: onPoyntUser.email,
      })
      .from(onPoyntFeedback)
      .leftJoin(onPoyntUser, eq(onPoyntFeedback.userId, onPoyntUser.id))
      .orderBy(desc(onPoyntFeedback.createdAt));
  }),

  /** Sett status (+ valgfritt svar til medlemmet). */
  setStatus: adminProcedure
    .input(updateFeedbackStatusSchema)
    .mutation(async ({ input }) => {
      const [row] = await db
        .update(onPoyntFeedback)
        .set({
          status: input.status,
          adminResponse: input.adminResponse ? input.adminResponse : null,
        })
        .where(eq(onPoyntFeedback.id, input.id))
        .returning();
      return row;
    }),
});
