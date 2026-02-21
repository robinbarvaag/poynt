"use server";

import { db, eq, sql } from "@poynt/planner-db";
import { plannerIndustry } from "@poynt/planner-db/schema";
import { defaultIndustries } from "@poynt/planner-validators";

export async function createIndustry(data: {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  sortOrder?: number;
  promptHints?: string;
}) {
  const [created] = await db
    .insert(plannerIndustry)
    .values({
      id: data.id,
      name: data.name,
      description: data.description,
      icon: data.icon,
      sortOrder: data.sortOrder ?? 0,
      isActive: true,
      promptHints: data.promptHints,
    })
    .returning();
  return created;
}

export async function updateIndustry(
  id: string,
  data: {
    name?: string;
    description?: string;
    icon?: string;
    sortOrder?: number;
    promptHints?: string;
  }
) {
  const [updated] = await db
    .update(plannerIndustry)
    .set({ ...data, updatedAt: sql`now()` })
    .where(eq(plannerIndustry.id, id))
    .returning();
  return updated;
}

export async function deleteIndustry(id: string) {
  await db.delete(plannerIndustry).where(eq(plannerIndustry.id, id));
  return { success: true };
}

export async function toggleIndustryActive(id: string) {
  const [current] = await db
    .select({ isActive: plannerIndustry.isActive })
    .from(plannerIndustry)
    .where(eq(plannerIndustry.id, id))
    .limit(1);

  if (!current) return { success: false };

  const [updated] = await db
    .update(plannerIndustry)
    .set({ isActive: !current.isActive, updatedAt: sql`now()` })
    .where(eq(plannerIndustry.id, id))
    .returning();

  return updated;
}

export async function seedIndustries() {
  const existing = await db
    .select({ id: plannerIndustry.id })
    .from(plannerIndustry)
    .limit(1);

  if (existing.length > 0) {
    return { success: false, error: "Bransjar finst allereie" };
  }

  const inserted = await db
    .insert(plannerIndustry)
    .values(
      defaultIndustries.map((i) => ({ ...i, relatedKeywords: undefined }))
    )
    .returning();

  return { success: true, count: inserted.length };
}
