import { pgTable, text, timestamp, boolean, integer, jsonb } from "drizzle-orm/pg-core";

/**
 * Industries - Administreres via admin-panel
 * Brukes på tvers av alle verktøy for konsistent bransje-valg
 */
export const plannerIndustry = pgTable("planner_industry", {
  id: text("id").primaryKey(), // f.eks. "retail", "restaurant"
  name: text("name").notNull(), // "Butikk/Detaljhandel"
  description: text("description"), // Kort beskrivelse
  icon: text("icon"), // Lucide icon name, f.eks. "ShoppingBag"
  sortOrder: integer("sort_order").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  // Metadata for AI-prompts
  promptHints: text("prompt_hints"), // Ekstra kontekst for AI
  relatedKeywords: jsonb("related_keywords").$type<string[]>(), // Søkeord
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

/**
 * Prompt Templates - For å tilpasse AI-oppførsel
 * Kan redigeres i admin uten kodeendringer
 */
export const plannerPromptTemplate = pgTable("planner_prompt_template", {
  id: text("id").primaryKey(), // f.eks. "channel-guide-system"
  toolId: text("tool_id").notNull(), // "channel-guide" | "marketing-plan" | etc
  name: text("name").notNull(),
  description: text("description"),
  template: text("template").notNull(), // Selve prompt-teksten
  variables: jsonb("variables").$type<string[]>(), // Tilgjengelige variabler
  isActive: boolean("is_active").default(true).notNull(),
  version: integer("version").default(1).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

// Type exports
export type PlannerIndustry = typeof plannerIndustry.$inferSelect;
export type NewPlannerIndustry = typeof plannerIndustry.$inferInsert;
export type PlannerPromptTemplate = typeof plannerPromptTemplate.$inferSelect;
export type NewPlannerPromptTemplate = typeof plannerPromptTemplate.$inferInsert;
