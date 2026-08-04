import { db } from "@poynt/planner-db";
import { plannerCourseProgress } from "@poynt/planner-db/schema";
import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

const courseSlug = z.string().min(1).max(200);
const lessonKey = z
  .string()
  .min(1)
  .max(50)
  .regex(/^m\d+-l\d+$/, "Ugyldig leksjonsnøkkel");

/**
 * Kursfremdrift — hvilke leksjoner medlemmet har fullført i et kurs.
 * Kurs/leksjoner bor i Payload; her lagres bare (bruker, kurs-slug,
 * leksjonsnøkkel), så fremdriften følger medlemmet på tvers av enheter.
 */
export const courseProgressRouter = router({
  /** Fullførte leksjonsnøkler for ett kurs. */
  list: protectedProcedure
    .input(z.object({ courseSlug }))
    .query(async ({ ctx, input }) => {
      const rows = await db
        .select({ lessonKey: plannerCourseProgress.lessonKey })
        .from(plannerCourseProgress)
        .where(
          and(
            eq(plannerCourseProgress.userId, ctx.userId),
            eq(plannerCourseProgress.courseSlug, input.courseSlug)
          )
        );
      return rows.map((r) => r.lessonKey);
    }),

  /** Sett fullført-status for én leksjon (idempotent begge veier). */
  setCompleted: protectedProcedure
    .input(z.object({ courseSlug, lessonKey, completed: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      if (input.completed) {
        await db
          .insert(plannerCourseProgress)
          .values({
            id: nanoid(),
            userId: ctx.userId,
            courseSlug: input.courseSlug,
            lessonKey: input.lessonKey,
          })
          .onConflictDoNothing();
      } else {
        await db
          .delete(plannerCourseProgress)
          .where(
            and(
              eq(plannerCourseProgress.userId, ctx.userId),
              eq(plannerCourseProgress.courseSlug, input.courseSlug),
              eq(plannerCourseProgress.lessonKey, input.lessonKey)
            )
          );
      }
      return { completed: input.completed };
    }),
});
