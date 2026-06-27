import { db } from "@poynt/planner-db";
import { plannerTask, plannerWorkspaceMember } from "@poynt/planner-db/schema";
import { TRPCError } from "@trpc/server";
import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

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

const taskInputSchema = z.object({
  title: z.string().min(1).max(300),
  note: z.string().max(2000).optional(),
  source: z.string().max(50).default("manual"),
  category: z.string().max(100).optional(),
  sortOrder: z.number().int().optional(),
});

/**
 * Oppgaver (tasks) — bindeleddet mellom verktøyene. Markedsplanen og andre
 * verktøy materialiserer oppgaver hit; dashbordet og verktøyene viser og huker
 * dem av. Alt er scopet til det aktive arbeidsområdet.
 */
export const taskRouter = router({
  /** Hent oppgaver. status: open (default) | done | all. Valgfritt filter på source. */
  list: protectedProcedure
    .input(
      z
        .object({
          status: z.enum(["open", "done", "all"]).default("all"),
          source: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const workspaceId = await getActiveWorkspaceId(ctx.userId);
      const status = input?.status ?? "all";
      const source = input?.source;

      const conditions = [eq(plannerTask.workspaceId, workspaceId)];
      if (status === "open") conditions.push(eq(plannerTask.done, false));
      if (status === "done") conditions.push(eq(plannerTask.done, true));
      if (source) conditions.push(eq(plannerTask.source, source));

      return db.query.plannerTask.findMany({
        where: and(...conditions),
        orderBy: [
          asc(plannerTask.done),
          asc(plannerTask.sortOrder),
          asc(plannerTask.createdAt),
        ],
      });
    }),

  /** Legg til én oppgave (typisk manuelt fra dashbordet). */
  add: protectedProcedure
    .input(taskInputSchema)
    .mutation(async ({ ctx, input }) => {
      const workspaceId = await getActiveWorkspaceId(ctx.userId);
      const [created] = await db
        .insert(plannerTask)
        .values({
          id: crypto.randomUUID(),
          workspaceId,
          title: input.title,
          note: input.note ?? null,
          source: input.source,
          category: input.category ?? null,
          sortOrder: input.sortOrder ?? 0,
        })
        .returning();
      return created;
    }),

  /**
   * Sett inn mange oppgaver på én gang (f.eks. når et verktøy genererer dem).
   * `replaceSource` sletter først alle oppgaver fra den source-en, så regenerering
   * ikke gir duplikater.
   */
  createMany: protectedProcedure
    .input(
      z.object({
        tasks: z.array(taskInputSchema).max(100),
        replaceSource: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const workspaceId = await getActiveWorkspaceId(ctx.userId);

      if (input.replaceSource) {
        await db
          .delete(plannerTask)
          .where(
            and(
              eq(plannerTask.workspaceId, workspaceId),
              eq(plannerTask.source, input.replaceSource)
            )
          );
      }

      if (input.tasks.length === 0) return { count: 0 };

      const rows = input.tasks.map((t, i) => ({
        id: crypto.randomUUID(),
        workspaceId,
        title: t.title,
        note: t.note ?? null,
        source: t.source,
        category: t.category ?? null,
        sortOrder: t.sortOrder ?? i,
      }));
      await db.insert(plannerTask).values(rows);
      return { count: rows.length };
    }),

  /**
   * Hent inn én fase (f.eks. en måned fra markedsplanens utrullingsplan) som
   * oppgaver — progressivt, i stedet for å dumpe alle fasene på en gang. Scopet
   * replace på (source + category): å hente fasen på nytt synkroniserer bare den
   * fasen, og lar de andre fasene stå urørt. `category` er fase-etiketten
   * (typisk månedsnavnet), så oppgavene grupperes riktig på dashbordet.
   */
  addPhase: protectedProcedure
    .input(
      z.object({
        source: z.string().max(50),
        category: z.string().min(1).max(100),
        tasks: z.array(z.string().min(1).max(300)).max(50),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const workspaceId = await getActiveWorkspaceId(ctx.userId);

      await db
        .delete(plannerTask)
        .where(
          and(
            eq(plannerTask.workspaceId, workspaceId),
            eq(plannerTask.source, input.source),
            eq(plannerTask.category, input.category)
          )
        );

      if (input.tasks.length === 0) return { count: 0 };

      const rows = input.tasks.map((title, i) => ({
        id: crypto.randomUUID(),
        workspaceId,
        title,
        note: null,
        source: input.source,
        category: input.category,
        sortOrder: i,
      }));
      await db.insert(plannerTask).values(rows);
      return { count: rows.length };
    }),

  /** Hak av / på en oppgave. */
  toggle: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const workspaceId = await getActiveWorkspaceId(ctx.userId);
      const existing = await db.query.plannerTask.findFirst({
        where: and(
          eq(plannerTask.id, input.id),
          eq(plannerTask.workspaceId, workspaceId)
        ),
      });
      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Task not found" });
      }
      const done = !existing.done;
      const [updated] = await db
        .update(plannerTask)
        .set({ done, doneAt: done ? new Date() : null })
        .where(eq(plannerTask.id, input.id))
        .returning();
      return updated;
    }),

  /** Slett en oppgave. */
  remove: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const workspaceId = await getActiveWorkspaceId(ctx.userId);
      await db
        .delete(plannerTask)
        .where(
          and(
            eq(plannerTask.id, input.id),
            eq(plannerTask.workspaceId, workspaceId)
          )
        );
      return { success: true };
    }),
});
