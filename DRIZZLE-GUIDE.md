# Drizzle i Poynt

> Drizzle ORM handterer alt av kundedata (auth, membership, workspace, AI-verktøy).
> Payload CMS har si eiga database — dei deler same PostgreSQL-instans men rører ikkje kvarandre.

## Viktig: ALDRI bruk `push`

```bash
# ✅ Rett måte
bun run db:generate    # Lagar SQL-migrasjonsfil
bun run db:migrate     # Køyrer migrasjonen

# ❌ ALDRI gjer dette
bun run db:push        # Ser Payload sine typar og prøver slette dei!
```

`push` ignorerer `tablesFilter` for enum-typar og sequences, så den vil prøve droppe Payload sine ting.

## Struktur

```
packages/planner-db/
├── index.ts              # DB-tilkopling + eksporterer db, eq, and, sql, etc.
├── drizzle.config.ts     # Konfig med tablesFilter: ["planner_*"]
├── schema/
│   ├── index.ts          # Re-eksporterer alle schema-filer
│   ├── auth.ts           # planner_user, planner_session, planner_account, planner_verification
│   ├── workspace.ts      # planner_subscription, planner_workspace, planner_tool_result, etc.
│   ├── webhook.ts        # planner_webhook_event
│   └── admin.ts          # Admin-relaterte tabellar
└── drizzle/
    └── 0000_initial-schema.sql   # Generert migrasjon
```

## Korleis bruke i kode

```typescript
// Importer db + helpers
import { db, eq } from "@poynt/planner-db";
import { plannerUser, plannerSubscription } from "@poynt/planner-db/schema";

// Select
const users = await db
  .select()
  .from(plannerUser)
  .where(eq(plannerUser.id, userId))
  .limit(1);

// Insert
await db.insert(plannerSubscription).values({
  id: crypto.randomUUID(),
  userId,
  tier: "community",
  status: "active",
});

// Update
await db
  .update(plannerUser)
  .set({ onboardingCompleted: true })
  .where(eq(plannerUser.id, userId));

// Upsert (insert or update on conflict)
await db
  .insert(plannerSubscription)
  .values({ id: crypto.randomUUID(), userId, tier, status })
  .onConflictDoUpdate({
    target: plannerSubscription.userId,
    set: { tier, status, updatedAt: sql`now()` },
  });
```

## Legge til eit nytt felt

1. Rediger schema-fila (t.d. `schema/workspace.ts`)
2. Køyr frå `packages/planner-db/`:
   ```bash
   bun run db:generate
   ```
3. Sjekk SQL-fila som vart laga i `drizzle/` — ser den fornuftig ut?
4. Køyr migrasjonen:
   ```bash
   bun run db:migrate
   ```

## Legge til ein ny tabell

1. Lag tabellen i rett schema-fil (eller lag ny fil i `schema/`)
2. Om ny fil: eksporter den frå `schema/index.ts`
3. Alle tabellnamn **må** starte med `planner_` (pga. `tablesFilter`)
4. Køyr `db:generate` → `db:migrate`

## Drizzle Studio (database-GUI)

```bash
cd packages/planner-db
bun run db:studio
```

Opnar ein nettlesar-GUI der du kan sjå og redigere data direkte. Nyttig for debugging.

## Env

Drizzle brukar same `DATABASE_URI` som Payload — dei deler same PostgreSQL-database.
