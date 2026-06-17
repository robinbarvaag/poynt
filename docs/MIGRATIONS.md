# Database Migrations

This repo has **two independent schemas in the same Postgres database**, managed by two
different tools. Knowing which one owns a table tells you which workflow to use.

| Schema | Owned by | Tables | Migration tool |
| --- | --- | --- | --- |
| Content / shop | **Payload CMS** | `pages`, `homepage`, `products`, `orders`, `media`, `*_blocks_*`, `payload_*`, … | `payload migrate` |
| Auth / members | **Better Auth + Drizzle** | `planner_*` only | `drizzle-kit` + custom `migrate.ts` |

They never touch each other's tables. `payload migrate` only manages Payload tables;
Drizzle is filtered to `planner_*` (`tablesFilter` in `packages/planner-db/drizzle.config.ts`).

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

- **NEVER run `drizzle-kit push`** (`bun run --cwd packages/planner-db db:push`). It sees
  Payload's types/sequences as foreign and tries to drop them. Always use `generate` + `migrate`.
- **NEVER boot dev with Payload `push: true` while `planner_*` enums exist.** Drizzle-kit's
  push resolver can mistake a new Payload enum for a *rename* of a `planner_*` enum and offer to
  rename/destroy it. (This is why `push` is `false`.) Use migrations instead.
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
