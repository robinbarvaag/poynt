"use server";

import { requireAdmin } from "@/lib/require-admin";
import { db, eq, sql } from "@poynt/on-poynt-db";
import { onPoyntIndustry } from "@poynt/on-poynt-db/schema";
import { defaultIndustries } from "@poynt/on-poynt-validators";

export async function createIndustry(data: {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  sortOrder?: number;
  promptHints?: string;
}) {
  await requireAdmin();
  const [created] = await db
    .insert(onPoyntIndustry)
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
  await requireAdmin();
  const [updated] = await db
    .update(onPoyntIndustry)
    .set({ ...data, updatedAt: sql`now()` })
    .where(eq(onPoyntIndustry.id, id))
    .returning();
  return updated;
}

export async function deleteIndustry(id: string) {
  await requireAdmin();
  await db.delete(onPoyntIndustry).where(eq(onPoyntIndustry.id, id));
  return { success: true };
}

export async function toggleIndustryActive(id: string) {
  await requireAdmin();
  const [current] = await db
    .select({ isActive: onPoyntIndustry.isActive })
    .from(onPoyntIndustry)
    .where(eq(onPoyntIndustry.id, id))
    .limit(1);

  if (!current) return { success: false };

  const [updated] = await db
    .update(onPoyntIndustry)
    .set({ isActive: !current.isActive, updatedAt: sql`now()` })
    .where(eq(onPoyntIndustry.id, id))
    .returning();

  return updated;
}

export async function seedIndustries() {
  await requireAdmin();
  const existing = await db
    .select({ id: onPoyntIndustry.id })
    .from(onPoyntIndustry)
    .limit(1);

  if (existing.length > 0) {
    return { success: false, error: "Bransjer finnes allerede" };
  }

  const inserted = await db
    .insert(onPoyntIndustry)
    .values(
      defaultIndustries.map((i) => ({ ...i, relatedKeywords: undefined }))
    )
    .returning();

  return { success: true, count: inserted.length };
}
