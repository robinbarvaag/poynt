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
packages/on-poynt-db/
├── index.ts              # DB-tilkopling + eksporterer db, eq, and, sql, etc.
├── drizzle.config.ts     # Konfig med schemaFilter: ["on_poynt"]
├── schema/
│   ├── index.ts          # Re-eksporterer alle schema-filer
│   ├── auth.ts           # on_poynt.user, on_poynt.session, on_poynt.account, on_poynt.verification
│   ├── workspace.ts      # on_poynt.subscription, on_poynt.workspace, on_poynt.tool_result, etc.
│   ├── webhook.ts        # on_poynt.webhook_event
│   └── admin.ts          # Admin-relaterte tabellar
└── drizzle/
    └── 0000_initial-schema.sql   # Generert migrasjon
```

## Korleis bruke i kode

```typescript
// Importer db + helpers
import { db, eq } from "@poynt/on-poynt-db";
import { onPoyntUser, onPoyntSubscription } from "@poynt/on-poynt-db/schema";

// Select
const users = await db
  .select()
  .from(onPoyntUser)
  .where(eq(onPoyntUser.id, userId))
  .limit(1);

// Insert
await db.insert(onPoyntSubscription).values({
  id: crypto.randomUUID(),
  userId,
  tier: "community",
  status: "active",
});

// Update
await db
  .update(onPoyntUser)
  .set({ onboardingCompleted: true })
  .where(eq(onPoyntUser.id, userId));

// Upsert (insert or update on conflict)
await db
  .insert(onPoyntSubscription)
  .values({ id: crypto.randomUUID(), userId, tier, status })
  .onConflictDoUpdate({
    target: onPoyntSubscription.userId,
    set: { tier, status, updatedAt: sql`now()` },
  });
```

## Legge til eit nytt felt

1. Rediger schema-fila (t.d. `schema/workspace.ts`)
2. Køyr frå `packages/on-poynt-db/`:
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
3. Bruk `onPoyntSchema.table(...)` (ikkje `pgTable`) så tabellen hamnar i `on_poynt`-skjemaet; inga prefiks i namnet
4. Køyr `db:generate` → `db:migrate`

## Drizzle Studio (database-GUI)

```bash
cd packages/on-poynt-db
bun run db:studio
```

Opnar ein nettlesar-GUI der du kan sjå og redigere data direkte. Nyttig for debugging.

## Env

Drizzle brukar same `DATABASE_URI` som Payload — dei deler same PostgreSQL-database.
