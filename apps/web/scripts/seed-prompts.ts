/**
 * Resynkroniserer prompt-malene i `planner_prompt_template` med fasiten i
 * `defaultPromptTemplates` (apps/.../prompt-template.ts). I motsetning til
 * `seedPromptTemplates()` (som kun legger inn det som MANGLER) overskriver
 * dette eksisterende rader på id — bruk det når kode-malene er endret og DB
 * kan ha gamle versjoner.
 *
 * Idempotent og trygt å kjøre uansett: oppretter det som mangler, oppdaterer
 * resten. `isActive` røres ikke ved oppdatering (respekterer partnerens av/på).
 *
 *   bun run --cwd apps/web payload run scripts/seed-prompts.ts
 */
import { defaultPromptTemplates } from "@poynt/planner-api";
import { db, sql } from "@poynt/planner-db";
import { plannerPromptTemplate } from "@poynt/planner-db/schema";

async function run() {
  for (const t of defaultPromptTemplates) {
    await db
      .insert(plannerPromptTemplate)
      .values({
        id: t.id,
        toolId: t.toolId,
        name: t.name,
        description: t.description,
        template: t.template,
        variables: t.variables,
        isActive: true,
        version: 1,
      })
      .onConflictDoUpdate({
        target: plannerPromptTemplate.id,
        set: {
          toolId: t.toolId,
          name: t.name,
          description: t.description,
          template: t.template,
          variables: t.variables,
          updatedAt: sql`now()`,
        },
      });
    console.log(`✓ ${t.id}`);
  }

  console.log(
    `\nResynkroniserte ${defaultPromptTemplates.length} prompt-maler.`
  );
  process.exit(0);
}

run().catch((error) => {
  console.error("Klarte ikke resynkronisere prompt-maler:", error);
  process.exit(1);
});
