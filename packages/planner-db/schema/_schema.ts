import { pgSchema } from "drizzle-orm/pg-core";

/**
 * Dedicated Postgres schema for all Better-Auth / planner tables and enums.
 *
 * Keeping these objects in their own `planner` schema (instead of `public`)
 * physically isolates them from Payload CMS, which owns `public`. drizzle-kit
 * is scoped to this schema via `schemaFilter: ["planner"]`, so it can never see
 * — or try to rename/drop — Payload's tables and enums, and vice versa.
 *
 * Table names keep the `planner_` prefix to avoid clashing with reserved words
 * (e.g. `user`) and to keep all app/query code unchanged.
 */
export const plannerSchema = pgSchema("planner");
