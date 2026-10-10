import { db } from "@poynt/on-poynt-db";
import { onPoyntCourseProgress } from "@poynt/on-poynt-db/schema";
import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { memberProcedure, router } from "../trpc";

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
  list: memberProcedure
    .input(z.object({ courseSlug }))
    .query(async ({ ctx, input }) => {
      const rows = await db
        .select({ lessonKey: onPoyntCourseProgress.lessonKey })
        .from(onPoyntCourseProgress)
        .where(
          and(
            eq(onPoyntCourseProgress.userId, ctx.userId),
            eq(onPoyntCourseProgress.courseSlug, input.courseSlug)
          )
        );
      return rows.map((r) => r.lessonKey);
    }),

  /** Sett fullført-status for én leksjon (idempotent begge veier). */
  setCompleted: memberProcedure
    .input(z.object({ courseSlug, lessonKey, completed: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      if (input.completed) {
        await db
          .insert(onPoyntCourseProgress)
          .values({
            id: nanoid(),
            userId: ctx.userId,
            courseSlug: input.courseSlug,
            lessonKey: input.lessonKey,
          })
          .onConflictDoNothing();
      } else {
        await db
          .delete(onPoyntCourseProgress)
          .where(
            and(
              eq(onPoyntCourseProgress.userId, ctx.userId),
              eq(onPoyntCourseProgress.courseSlug, input.courseSlug),
              eq(onPoyntCourseProgress.lessonKey, input.lessonKey)
            )
          );
      }
      return { completed: input.completed };
    }),
});
