import { pgSchema } from "drizzle-orm/pg-core";

/**
 * Dedicated Postgres schema for all Better-Auth / On Poynt tables and enums.
 *
 * Keeping these objects in their own `on_poynt` schema (instead of `public`)
 * physically isolates them from Payload CMS, which owns `public`. drizzle-kit
 * is scoped to this schema via `schemaFilter: ["on_poynt"]`, so it can never see
 * — or try to rename/drop — Payload's tables and enums, and vice versa.
 *
 * Table names carry no prefix (`on_poynt.user`, `on_poynt.workspace`, …):
 * the schema already namespaces them, and Drizzle quotes identifiers, so
 * reserved words like `user` are fine. Renamed from `planner`/`planner_*` in
 * migration 0021 (2026-10-06).
 */
export const onPoyntSchema = pgSchema("on_poynt");
