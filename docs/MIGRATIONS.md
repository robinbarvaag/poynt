# Database Migrations

This repo has **two systems sharing one Postgres database, isolated into separate Postgres
schemas**, each managed by a different tool. Knowing which schema owns a table tells you which
workflow to use.

| Postgres schema | Owned by | Tables | Migration tool |
| --- | --- | --- | --- |
| `public` | **Payload CMS** | `pages`, `homepage`, `products`, `orders`, `media`, `*_blocks_*`, `payload_*`, … | `payload migrate` |
| `planner` | **Better Auth + Drizzle** | `planner_*` only | `drizzle-kit` + custom `migrate.ts` |

They are **physically isolated**: all Better-Auth/planner objects live in a dedicated `planner`
Postgres schema (`pgSchema("planner")` in `packages/planner-db/schema/_schema.ts`), and
drizzle-kit is scoped to it via `schemaFilter: ["planner"]` in `drizzle.config.ts`. Drizzle-kit
**cannot see** Payload's tables/enums (they live in `public`), and Payload never touches
`planner`. This makes the old "push fights our own schema" enum-rename collision *structurally
impossible* rather than merely unlikely. The `planner_` table-name prefix is now redundant but
kept to avoid reserved words (e.g. `user`) and to keep all app/query code unchanged.

`push` is **`false`** in `apps/web/payload.config.ts`. Schema changes go through committed
migration files, not dev-time auto-push.

---

## Commands (run from the repo root)

### Payload (content, products, pages, blocks)

```bash
bun run payload:status           # show which migrations have run
bun run payload:migrate:create   # generate a migration from current Payload schema (optionally: ... my_name)
bun run payload:migrate          # apply pending migrations
bun run payload:migrate:down     # roll back the last batch
bun run payload:types            # regenerate payload-types.ts
```

### Planner (Better Auth members, subscriptions, workspaces — `planner_*`)

```bash
bun run planner:generate         # generate a Drizzle migration from schema changes
bun run planner:migrate          # apply Drizzle migrations (custom migrate.ts, uses postgres.js)
bun run planner:studio           # open Drizzle Studio
```

> The root scripts delegate via `bun run --cwd <pkg> …`, so they work from anywhere in the repo.
> You can still `cd apps/web && bun run migrate` etc. if you prefer.

---

## Typical workflow

### I changed a Payload collection / block / global

1. Edit the collection/block/global (and register new blocks in `payload.config.ts`).
2. `bun run payload:migrate:create` — generates `apps/web/migrations/<timestamp>.ts` + `.json`
   and wires it into `migrations/index.ts`.
3. **Read the generated `up()`** — it should only `CREATE`/`ALTER ADD`. If it `DROP`s a column
   or table you didn't intend to remove, your schema change was wrong — fix the collection, not
   the migration.
4. `bun run payload:migrate` — applies it. Commit the migration files.

### I changed the planner (Drizzle) schema

1. Edit the schema in `packages/planner-db`.
2. `bun run planner:generate`
3. `bun run planner:migrate`
4. Commit the generated SQL.

---

## Hard rules / gotchas

- **Still prefer `generate` + `migrate` over `drizzle-kit push`.** With `schemaFilter: ["planner"]`
  push is now scoped to the `planner` schema and can no longer see Payload's objects, so the old
  cross-schema drop/rename hazard is gone. But migrations remain the source of truth for
  reproducible deploys — only reach for push for throwaway local experiments, never against a DB
  you care about.
- **Drizzle migrations include `CREATE SCHEMA IF NOT EXISTS "planner";`** as their first
  statement. drizzle-kit (0.30) does **not** emit this automatically when using `pgSchema`, so it
  is prepended to the generated `0000_*.sql` by hand. If you regenerate the baseline from scratch,
  re-add that line at the top or the `CREATE TABLE "planner".*` statements fail on a fresh DB.
- Payload `push` stays **`false`**. Even though the schema split removes the enum-collision
  hazard, committed migration files are still how production schema changes are tracked.
- `payload migrate` runs the migration file's raw SQL — it does **not** run drizzle-kit's
  diff/push, so it never triggers the enum-rename prompt. It's the safe path.
- `drizzle-kit migrate` silently no-ops here (wrong driver). `planner:migrate` runs the custom
  `migrate.ts` (postgres.js) instead — use that.

---

## Production deploys

`payload migrate` runs against the production database on deploy. The migration files in
`apps/web/migrations/` are the source of truth, so keep them committed and in order. Run
`bun run payload:status` against an environment to see what's applied there.

If a database was historically built with dev-push (so `payload_migrations` lists migrations as
applied whose tables were never actually created by SQL), reconcile by ensuring the table state
matches and the tracking rows are correct before relying on `payload migrate` there. The local
dev DB was reconciled on 2026-06-17.
