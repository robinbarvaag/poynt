"use server";

import { db, eq, sql } from "@poynt/planner-db";
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
