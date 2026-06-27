import { boolean, integer, jsonb, text, timestamp } from "drizzle-orm/pg-core";
import { plannerSchema } from "./_schema";

/**
 * Innholdsradar — redaksjonell AI-assistent i Payload admin.
 * Se docs/CONTENT-RADAR.md for arkitektur og faseplan.
 *
 * Alle tabellene bor i `planner`-schemaet (samme som resten av On Poynt-admin-
 * dataene), så drizzle-kit eier dem og Payloads `public`-objekter er usynlige.
 */

/** Type forslag radaren produserer. */
export type ContentSuggestionType =
  | "create"
  | "refresh"
  | "promote"
  | "repurpose";

/** Livssyklus for et forslag. `dismissed` skal aldri gjenoppstå ved ny kjøring. */
export type ContentSuggestionStatus = "new" | "snoozed" | "done" | "dismissed";

/**
 * Konkrete handlingsforslag til partneren: hva som bør lages, oppdateres,
 * promoteres eller gjenbrukes. Genereres av radar-jobben, vises i widgeten
 * og på /admin/radar.
 */
export const plannerContentSuggestion = plannerSchema.table(
  "planner_content_suggestion",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    // Stabil identitet på tvers av kjøringer, f.eks.
    // "refresh:articles:42" eller "create:category:rekruttering".
    // Brukes til upsert slik at radaren ikke duplikerer forslag.
    dedupKey: text("dedup_key").notNull().unique(),
    type: text("type").$type<ContentSuggestionType>().notNull(),
    title: text("title").notNull(),
    rationale: text("rationale").notNull(),
    // Peker på eksisterende Payload-innhold når forslaget gjelder det.
    targetCollection: text("target_collection"),
    targetId: text("target_id"),
    category: text("category"),
    // Deterministisk prioritet 0–100 (regnet ut fra signalene, ikke av AI).
    priority: integer("priority").default(0).notNull(),
    status: text("status")
      .$type<ContentSuggestionStatus>()
      .default("new")
      .notNull(),
    // Signalene som ga forslaget — revisjon og forklaring i UI.
    evidence: jsonb("evidence").$type<Record<string, unknown>>(),
    source: text("source").$type<"radar" | "inspiration">()
      .default("radar")
      .notNull(),
    runId: text("run_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  }
);

/**
 * Eksterne inspirasjonskilder partneren kan registrere i settings.
 * Bevisst kun offentlige feeds (RSS/nettside) — IKKE auth-gated profiler
 * (LinkedIn/Twitter), som vi ikke kan/skal scrape. `personName` lar oss
 * representere «flinke folk» via deres offentlige blogg/nyhetsbrev.
 */
export const plannerInspirationSource = plannerSchema.table(
  "planner_inspiration_source",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    label: text("label").notNull(),
    url: text("url").notNull(),
    type: text("type").$type<"rss" | "website">().default("website").notNull(),
    personName: text("person_name"),
    isActive: boolean("is_active").default(true).notNull(),
    // Hvor ofte den hentes, f.eks. "weekly". Tolkes av Inngest-jobben.
    cadence: text("cadence").default("weekly").notNull(),
    lastFetchedAt: timestamp("last_fetched_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  }
);

/**
 * Destillerte saker hentet fra inspirasjonskildene. Brukes til gap-analysen:
 * eksterne temaer som On Poynt ennå ikke dekker.
 */
export const plannerInspirationItem = plannerSchema.table(
  "planner_inspiration_item",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    sourceId: text("source_id").notNull(),
    title: text("title").notNull(),
    url: text("url"),
    summary: text("summary"),
    topics: jsonb("topics").$type<string[]>(),
    publishedAt: timestamp("published_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  }
);

/** Revisjonsspor for hver radar-/inspirasjonskjøring. */
export const plannerRadarRun = plannerSchema.table("planner_radar_run", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  trigger: text("trigger")
    .$type<"scheduled" | "manual" | "heartbeat">()
    .notNull(),
  status: text("status")
    .$type<"running" | "ok" | "error">()
    .default("running")
    .notNull(),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  finishedAt: timestamp("finished_at"),
  stats: jsonb("stats").$type<Record<string, unknown>>(),
  error: text("error"),
});

// Type exports
export type PlannerContentSuggestion =
  typeof plannerContentSuggestion.$inferSelect;
export type NewPlannerContentSuggestion =
  typeof plannerContentSuggestion.$inferInsert;
export type PlannerInspirationSource =
  typeof plannerInspirationSource.$inferSelect;
export type NewPlannerInspirationSource =
  typeof plannerInspirationSource.$inferInsert;
export type PlannerInspirationItem = typeof plannerInspirationItem.$inferSelect;
export type NewPlannerInspirationItem =
  typeof plannerInspirationItem.$inferInsert;
export type PlannerRadarRun = typeof plannerRadarRun.$inferSelect;
export type NewPlannerRadarRun = typeof plannerRadarRun.$inferInsert;
