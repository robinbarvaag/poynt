# Task 3: Web App & Payload Base

> **Read PLAN.md first** for full context.

## Prerequisites

- Shared packages initialized.

## Goal

Initialize the Next.js 16 application in `apps/web` and configure Payload 3.0 to run embedded within it. Set up the database connection.

## Files to Modify

| File                         | Action | Description                          |
| ---------------------------- | ------ | ------------------------------------ |
| `apps/web/package.json`      | Create | App config                           |
| `apps/web/next.config.mjs`   | Create | Next.js config (with Payload plugin) |
| `apps/web/payload.config.ts` | Create | Payload CMS config                   |
| `apps/web/app/layout.tsx`    | Create | Root layout                          |
| `apps/web/app/(payload)/`    | Create | Payload admin routes                 |
| `.env.local`                 | Create | Env vars (DB, Secret)                |

## Steps

### 1. Next.js Init

**File**: `apps/web/package.json`
**Action**: Create
Dependencies: `next`, `react`, `react-dom`, `payload`, `@payloadcms/db-postgres`, `@payloadcms/richtext-lexical`, `sharp`.
**Important**: Add `"scripts": { "dev": "bun --bun next dev" }`.

### 2. Payload Config

**File**: `apps/web/payload.config.ts`
**Action**: Create

```typescript
import { buildConfig } from "payload";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { sharp } from "sharp";

export default buildConfig({
  editor: lexicalEditor({}),
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || "",
    },
  }),
  sharp,
  collections: [], // Empty for now
});
```

### 3. Payload Admin Routes

**Path**: `apps/web/app/(payload)/admin/[[...segments]]/page.tsx`
**Action**: Create
Standard Payload admin page wrapper.

**Path**: `apps/web/app/(payload)/api/[...slug]/route.ts`
**Action**: Create
Standard Payload REST API handler.

**Path**: `apps/web/app/(payload)/graphql/route.ts`
**Action**: Create
Standard Payload GraphQL handler.

### 4. Environment

**File**: `.env.local` (and `.env.example`)
**Action**: Create
Add `DATABASE_URI`, `PAYLOAD_SECRET`.

## Verification

### Automated

```bash
bun run dev --filter web
```

- [ ] Next.js starts
- [ ] Access `/admin` -> Should see Payload login/init screen.
