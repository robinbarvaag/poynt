"use server";

import { defaultPromptTemplates } from "@poynt/planner-api";
import { db, eq, inArray, sql } from "@poynt/planner-db";
import { plannerPromptTemplate } from "@poynt/planner-db/schema";

export async function upsertPromptTemplate(data: {
  id: string;
  toolId: string;
  name: string;
  description?: string;
  template: string;
  variables?: string[];
  isActive?: boolean;
}) {
  const [existing] = await db
    .select({ id: plannerPromptTemplate.id })
    .from(plannerPromptTemplate)
    .where(eq(plannerPromptTemplate.id, data.id))
    .limit(1);

  if (existing) {
    const [updated] = await db
      .update(plannerPromptTemplate)
      .set({
        name: data.name,
        description: data.description,
        template: data.template,
        variables: data.variables,
        isActive: data.isActive ?? true,
        updatedAt: sql`now()`,
      })
      .where(eq(plannerPromptTemplate.id, data.id))
      .returning();
    return updated;
  }

  const [created] = await db
    .insert(plannerPromptTemplate)
    .values({
      id: data.id,
      toolId: data.toolId,
      name: data.name,
      description: data.description,
      template: data.template,
      variables: data.variables,
      isActive: data.isActive ?? true,
      version: 1,
    })
    .returning();
  return created;
}

export async function deletePromptTemplate(id: string) {
  await db
    .delete(plannerPromptTemplate)
    .where(eq(plannerPromptTemplate.id, id));
  return { success: true };
}

/**
 * Seeder de hardkodede standard-promptene inn i databasen. Idempotent: legger
 * kun inn maler som mangler (på id), så eksisterende/redigerte prompts røres
 * ikke. Seed-teksten er identisk med fallback-en i ai.ts, så dag-1-oppførsel
 * er uendret — men nå kan partner redigere dem i admin.
 */
export async function seedPromptTemplates() {
  const ids = defaultPromptTemplates.map((t) => t.id);
  const existing = await db
    .select({ id: plannerPromptTemplate.id })
    .from(plannerPromptTemplate)
    .where(inArray(plannerPromptTemplate.id, ids));

  const existingIds = new Set(existing.map((row) => row.id));
  const missing = defaultPromptTemplates.filter((t) => !existingIds.has(t.id));

  if (missing.length === 0) {
    return { success: true, count: 0 };
  }

  const inserted = await db
    .insert(plannerPromptTemplate)
    .values(
      missing.map((t) => ({
        id: t.id,
        toolId: t.toolId,
        name: t.name,
        description: t.description,
        template: t.template,
        variables: t.variables,
        isActive: true,
        version: 1,
      }))
    )
    .returning();

  return { success: true, count: inserted.length };
}

export async function togglePromptActive(id: string) {
  const [current] = await db
    .select({ isActive: plannerPromptTemplate.isActive })
    .from(plannerPromptTemplate)
    .where(eq(plannerPromptTemplate.id, id))
    .limit(1);

  if (!current) return { success: false };

  const [updated] = await db
    .update(plannerPromptTemplate)
    .set({ isActive: !current.isActive, updatedAt: sql`now()` })
    .where(eq(plannerPromptTemplate.id, id))
    .returning();

  return updated;
}
