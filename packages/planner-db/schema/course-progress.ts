import { index, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { plannerSchema } from "./_schema";
import { plannerUser } from "./auth";

/**
 * Fullførte kursleksjoner per medlem. Én rad = én fullført leksjon, så
 * «angre fullført» er en delete og fremdriften følger medlemmet på tvers av
 * enheter. Kurset refereres med Payload-slugen (kurs bor i Payload, ikke her)
 * og leksjonen med spillerens stabile nøkkel (`m0-l2`).
 */
export const plannerCourseProgress = plannerSchema.table(
  "planner_course_progress",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => plannerUser.id, { onDelete: "cascade" }),
    courseSlug: text("course_slug").notNull(),
    lessonKey: text("lesson_key").notNull(),
    completedAt: timestamp("completed_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("planner_course_progress_unique_idx").on(
      table.userId,
      table.courseSlug,
      table.lessonKey
    ),
    index("planner_course_progress_user_course_idx").on(
      table.userId,
      table.courseSlug
    ),
  ]
);

export type PlannerCourseProgress = typeof plannerCourseProgress.$inferSelect;
export type NewPlannerCourseProgress =
  typeof plannerCourseProgress.$inferInsert;
